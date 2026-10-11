const json = (data, status = 200, headers = {}) => Response.json(data, { status, headers: { "Cache-Control": "no-store", ...headers } });

const ADMIN_COOKIE = "maison_admin";
const encoder = new TextEncoder();

function categoryFor(format, artist, title) {
  const text = `${format || ""} ${artist || ""} ${title || ""}`.toLowerCase();
  if (/bach|beethoven|mozart|vivaldi|pachelbel|opera|symphon|classical|requiem|piano concerto/.test(text)) return "Classical";
  if (/jazz|krall|bublé|blues|thorogood/.test(text)) return "Jazz & Blues";
  if (/country|alabama|celtic|folk|irish|ceilidh/.test(text)) return "Folk & Country";
  if (/ambient|relaxation|natural dreams|solitudes/.test(text)) return "Ambient";
  return "Rock & Pop";
}

function base64url(bytes) {
  let text = "";
  for (const byte of bytes) text += String.fromCharCode(byte);
  return btoa(text).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function sign(value, secret) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return base64url(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value))));
}

function cookieValue(request, name) {
  const cookie = request.headers.get("Cookie") || "";
  return cookie.split(";").map(part => part.trim()).find(part => part.startsWith(`${name}=`))?.slice(name.length + 1) || "";
}

async function authorized(request, env) {
  if (!env.SESSION_SECRET) return false;
  const token = cookieValue(request, ADMIN_COOKIE);
  const [expires, signature] = token.split(".");
  if (!expires || !signature || Number(expires) < Date.now()) return false;
  return signature === await sign(`admin.${expires}`, env.SESSION_SECRET);
}

async function adminGuard(request, env) {
  if (await authorized(request, env)) return null;
  return json({ error: "Unauthorized" }, 401);
}

function normaliseRelease(input) {
  const price = Number(input.price_cad);
  const quantity = Number(input.quantity);
  if (!Number.isFinite(price) || price < 0) return { error: "A valid CAD price is required." };
  if (!Number.isInteger(quantity) || quantity < 0) return { error: "Quantity must be a whole number of zero or more." };
  const status = input.status === "sold" || quantity === 0 ? "sold" : "available";
  return { value: {
    artist: String(input.artist || "").trim(), title: String(input.title || "").trim(), release_id: String(input.release_id || "manual").trim(),
    label_name: String(input.label_name || "").trim(), format: String(input.format || "CD").trim(), release_year: Number(input.release_year) || null,
    media_condition: String(input.media_condition || "").trim(), sleeve_condition: String(input.sleeve_condition || "").trim(), notes: String(input.notes || "").trim(),
    price_cad: price, quantity, status, category: String(input.category || categoryFor(input.format, input.artist, input.title)).trim(), custom_image_url: String(input.custom_image_url || "").trim()
  }};
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/inventory") {
      const search = url.searchParams.get("search")?.trim() || "";
      const category = url.searchParams.get("category") || "";
      const condition = url.searchParams.get("condition") || "";
      const max = Math.min(Math.max(Number(url.searchParams.get("max") || 1000), 1), 2000);
      const where = ["1=1"];
      const values = [];
      if (search) { where.push("(artist LIKE ? OR title LIKE ?)"); values.push(`%${search}%`, `%${search}%`); }
      if (category) { where.push("category = ?"); values.push(category); }
      if (condition) { where.push("media_condition = ?"); values.push(condition); }
      values.push(max);
      const result = await env.DB.prepare(`SELECT * FROM releases WHERE ${where.join(" AND ")} ORDER BY artist COLLATE NOCASE, title COLLATE NOCASE LIMIT ?`).bind(...values).all();
      return json({ releases: result.results || [] });
    }

    if (url.pathname === "/api/featured") {
      const result = await env.DB.prepare("SELECT * FROM releases WHERE status = 'available' ORDER BY popularity_score DESC, price_cad DESC LIMIT 12").all();
      return json({ releases: result.results || [] });
    }

    if (url.pathname === "/api/admin/session") return json({ ok: await authorized(request, env) });

    if (url.pathname === "/api/admin/login" && request.method === "POST") {
      const { password } = await request.json();
      if (!env.ADMIN_PASSWORD || !env.SESSION_SECRET || !password || password !== env.ADMIN_PASSWORD) return json({ ok: false }, 401);
      const expires = String(Date.now() + 1000 * 60 * 60 * 8);
      const signature = await sign(`admin.${expires}`, env.SESSION_SECRET);
      const secure = url.protocol === "https:" ? "; Secure" : "";
      return json({ ok: true }, 200, { "Set-Cookie": `${ADMIN_COOKIE}=${expires}.${signature}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${secure}` });
    }

    if (url.pathname === "/api/admin/logout" && request.method === "POST") return json({ ok: true }, 200, { "Set-Cookie": `${ADMIN_COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0` });

    if (url.pathname === "/api/admin/releases" && request.method === "POST") {
      const denied = await adminGuard(request, env); if (denied) return denied;
      const parsed = normaliseRelease(await request.json());
      if (parsed.error) return json({ error: parsed.error }, 400);
      const item = parsed.value;
      if (!item.artist || !item.title) return json({ error: "Artist and title are required." }, 400);
      const listingKey = `${item.release_id}-${crypto.randomUUID()}`;
      await env.DB.prepare(`INSERT INTO releases (listing_key, release_id, artist, title, label_name, format, release_year, media_condition, sleeve_condition, notes, price_cad, quantity, status, category, custom_image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(listingKey, item.release_id, item.artist, item.title, item.label_name, item.format, item.release_year, item.media_condition, item.sleeve_condition, item.notes, item.price_cad, item.quantity, item.status, item.category, item.custom_image_url || null).run();
      await env.DB.prepare("INSERT INTO admin_audit (release_id, action) VALUES (?, ?)").bind(item.release_id, "Created listing").run();
      return json({ ok: true, listing_key: listingKey }, 201);
    }

    if (url.pathname.startsWith("/api/admin/releases/") && request.method === "PATCH") {
      const denied = await adminGuard(request, env); if (denied) return denied;
      const listingKey = decodeURIComponent(url.pathname.split("/").pop());
      const input = await request.json();
      const allowed = ["artist", "title", "release_id", "label_name", "format", "release_year", "media_condition", "sleeve_condition", "notes", "price_cad", "quantity", "status", "custom_image_url", "category"];
      const updates = allowed.filter(key => Object.hasOwn(input, key));
      if (!updates.length) return json({ error: "No valid fields" }, 400);
      if (Object.hasOwn(input, "price_cad") && (!Number.isFinite(Number(input.price_cad)) || Number(input.price_cad) < 0)) return json({ error: "Invalid price" }, 400);
      if (Object.hasOwn(input, "quantity") && (!Number.isInteger(Number(input.quantity)) || Number(input.quantity) < 0)) return json({ error: "Invalid quantity" }, 400);
      if (Number(input.quantity) === 0 && !Object.hasOwn(input, "status")) { updates.push("status"); input.status = "sold"; }
      const assignments = updates.map(key => `${key} = ?`).join(", ");
      const values = updates.map(key => input[key]);
      await env.DB.prepare(`UPDATE releases SET ${assignments}, updated_at = CURRENT_TIMESTAMP WHERE listing_key = ?`).bind(...values, listingKey).run();
      await env.DB.prepare("INSERT INTO admin_audit (release_id, action) VALUES ((SELECT release_id FROM releases WHERE listing_key = ?), ?)").bind(listingKey, `Updated: ${updates.join(", ")}`).run();
      return json({ ok: true });
    }

    return env.ASSETS.fetch(request);
  }
};

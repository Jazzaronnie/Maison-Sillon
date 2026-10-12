var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/worker.js
var json = /* @__PURE__ */ __name((data, status = 200, headers = {}) => Response.json(data, { status, headers: { "Cache-Control": "no-store", ...headers } }), "json");
var ADMIN_COOKIE = "maison_admin";
var encoder = new TextEncoder();
function categoryFor(format, artist, title) {
  const text = `${format || ""} ${artist || ""} ${title || ""}`.toLowerCase();
  if (/bach|beethoven|mozart|vivaldi|pachelbel|opera|symphon|classical|requiem|piano concerto/.test(text)) return "Classical";
  if (/jazz|krall|bublé|blues|thorogood/.test(text)) return "Jazz & Blues";
  if (/country|alabama|celtic|folk|irish|ceilidh/.test(text)) return "Folk & Country";
  if (/ambient|relaxation|natural dreams|solitudes/.test(text)) return "Ambient";
  return "Rock & Pop";
}
__name(categoryFor, "categoryFor");
function base64url(bytes) {
  let text = "";
  for (const byte of bytes) text += String.fromCharCode(byte);
  return btoa(text).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
__name(base64url, "base64url");
async function sign(value, secret) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return base64url(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value))));
}
__name(sign, "sign");
function cookieValue(request, name) {
  const cookie = request.headers.get("Cookie") || "";
  return cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1) || "";
}
__name(cookieValue, "cookieValue");
async function authorized(request, env) {
  if (!env.SESSION_SECRET) return false;
  const token = cookieValue(request, ADMIN_COOKIE);
  const [expires, signature] = token.split(".");
  if (!expires || !signature || !Number.isFinite(Number(expires)) || Number(expires) < Date.now()) return false;
  return signature === await sign(`admin.${expires}`, env.SESSION_SECRET);
}
__name(authorized, "authorized");
async function adminGuard(request, env) {
  if (await authorized(request, env)) return null;
  return json({ error: "Unauthorized" }, 401);
}
__name(adminGuard, "adminGuard");
function normaliseRelease(input) {
  const price = Number(input.price_cad);
  const quantity = Number(input.quantity);
  if (!Number.isFinite(price) || price < 0) return { error: "A valid CAD price is required." };
  if (!Number.isInteger(quantity) || quantity < 0) return { error: "Quantity must be a whole number of zero or more." };
  const status = input.status === "sold" || quantity === 0 ? "sold" : "available";
  return { value: {
    artist: String(input.artist || "").trim(),
    title: String(input.title || "").trim(),
    release_id: String(input.release_id || "manual").trim(),
    label_name: String(input.label_name || "").trim(),
    format: String(input.format || "CD").trim(),
    release_year: Number(input.release_year) || null,
    media_condition: String(input.media_condition || "").trim(),
    sleeve_condition: String(input.sleeve_condition || "").trim(),
    notes: String(input.notes || "").trim(),
    price_cad: price,
    quantity,
    status,
    category: String(input.category || categoryFor(input.format, input.artist, input.title)).trim(),
    custom_image_url: String(input.custom_image_url || "").trim()
  } };
}
__name(normaliseRelease, "normaliseRelease");
var worker_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if(url.pathname.startsWith('/api/admin/') && !['GET','HEAD'].includes(request.method)){
      const origin=request.headers.get('Origin');
      if(origin && origin!==url.origin)return json({error:'Invalid origin'},403);
    }
    if(url.pathname==='/api/admin/releases' && request.method==='GET'){
      const denied=await adminGuard(request,env);if(denied)return denied;
      const result=await env.DB.prepare('SELECT * FROM releases ORDER BY artist COLLATE NOCASE, title COLLATE NOCASE, listing_key').all();
      return json({releases:result.results||[]});
    }
    if(url.pathname==='/api/admin/health' && request.method==='GET'){
      const denied=await adminGuard(request,env);if(denied)return denied;
      const result=await env.DB.prepare('SELECT listing_key, is_hidden FROM releases LIMIT 1').all();
      return json({ok:true});
    }
    if (url.pathname === "/api/inventory" && request.method === "GET") {
      const search = url.searchParams.get("search")?.trim() || "";
      const category = url.searchParams.get("category") || "";
      const condition = url.searchParams.get("condition") || "";
      const max = Math.min(Math.max(Number(url.searchParams.get("max") || 1e3), 1), 2e3);
      const where = ["is_hidden = 0", "LOWER(format) NOT LIKE '%cass%'", "LOWER(format) NOT LIKE '%8-track%' AND LOWER(format) NOT LIKE '%8-trk%'"];
      const offset=Math.max(0,Math.floor(Number(url.searchParams.get('offset'))||0));
      const values = [];
      if (search) {
        where.push("(artist LIKE ? OR title LIKE ?)");
        values.push(`%${search}%`, `%${search}%`);
      }
      if (category) {
        where.push("category = ?");
        values.push(category);
      }
      if (condition) {
        where.push("media_condition = ?");
        values.push(condition);
      }
      values.push(max + 1, offset);
      const result = await env.DB.prepare(`SELECT * FROM releases WHERE ${where.join(" AND ")} ORDER BY artist COLLATE NOCASE, title COLLATE NOCASE, listing_key LIMIT ? OFFSET ?`).bind(...values).all();
      const rows=result.results||[];
      return json({releases:rows.slice(0,max),hasMore:rows.length>max,nextOffset:offset+max});
    }
    if (url.pathname === "/api/featured") {
      const result = await env.DB.prepare("SELECT * FROM releases WHERE status = 'available' AND quantity > 0 AND is_hidden = 0 AND LOWER(format) NOT LIKE '%cass%' AND LOWER(format) NOT LIKE '%8-track%' AND LOWER(format) NOT LIKE '%8-trk%' ORDER BY popularity_score DESC, price_cad DESC LIMIT 12").all();
      return json({ releases: result.results || [] });
    }
    if (url.pathname === "/api/admin/session") return json({ ok: await authorized(request, env) });
    if (url.pathname === "/api/admin/login" && request.method === "POST") {
      const { password } = await request.json();
      if (!env.ADMIN_PASSWORD || !env.SESSION_SECRET || !password || password !== env.ADMIN_PASSWORD) return json({ ok: false }, 401);
      const expires = String(Date.now() + 1e3 * 60 * 60 * 8);
      const signature = await sign(`admin.${expires}`, env.SESSION_SECRET);
      const secure = url.protocol === "https:" ? "; Secure" : "";
      return json({ ok: true }, 200, { "Set-Cookie": `${ADMIN_COOKIE}=${expires}.${signature}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${secure}` });
    }
    if (url.pathname === "/api/admin/logout" && request.method === "POST") return json({ ok: true }, 200, { "Set-Cookie": `${ADMIN_COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0` });
    if (url.pathname === "/api/admin/releases" && request.method === "POST") {
      const denied = await adminGuard(request, env);
      if (denied) return denied;
      const parsed = normaliseRelease(await request.json());
      if (parsed.error) return json({ error: parsed.error }, 400);
      const item = parsed.value;
      if (!item.artist || !item.title) return json({ error: "Artist and title are required." }, 400);
      const listingKey = `${item.release_id}-${crypto.randomUUID()}`;
      await env.DB.prepare(`INSERT INTO releases (listing_key, release_id, artist, title, label_name, format, release_year, media_condition, sleeve_condition, notes, price_cad, quantity, status, category, custom_image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(listingKey, item.release_id, item.artist, item.title, item.label_name, item.format, item.release_year, item.media_condition, item.sleeve_condition, item.notes, item.price_cad, item.quantity, item.status, item.category, item.custom_image_url || null).run();
      await env.DB.prepare("INSERT INTO admin_audit (release_id, action) VALUES (?, ?)").bind(item.release_id, "Created listing").run();
      return json({ ok: true, listing_key: listingKey }, 201);
    }
    if (url.pathname.startsWith("/api/admin/releases/") && request.method === "PATCH") {
      const denied = await adminGuard(request, env);
      if (denied) return denied;
      const listingKey = decodeURIComponent(url.pathname.split("/").pop());
      const input = await request.json();
      const allowed = ["artist", "title", "release_id", "label_name", "format", "release_year", "media_condition", "sleeve_condition", "notes", "price_cad", "quantity", "status", "custom_image_url", "category", "is_hidden"];
      const updates = allowed.filter((key) => Object.hasOwn(input, key));
      if (!updates.length) return json({ error: "No valid fields" }, 400);
      if (Object.hasOwn(input, "price_cad") && (!Number.isFinite(Number(input.price_cad)) || Number(input.price_cad) < 0)) return json({ error: "Invalid price" }, 400);
      if (Object.hasOwn(input, "quantity") && (!Number.isInteger(Number(input.quantity)) || Number(input.quantity) < 0)) return json({ error: "Invalid quantity" }, 400);
      if(Object.hasOwn(input,'status') && !['available','sold'].includes(input.status))return json({error:'Invalid status'},400);
      if(Object.hasOwn(input,'is_hidden') && ![0,1].includes(input.is_hidden))return json({error:'Invalid visibility'},400);
      const existing=await env.DB.prepare('SELECT * FROM releases WHERE listing_key = ?').bind(listingKey).first();
      if(!existing)return json({error:'Listing not found'},404);
      if(Number(input.quantity ?? existing.quantity)===0){
        if(!updates.includes("status"))updates.push("status");
        input.status = "sold";
      }
      const assignments = updates.map((key) => `${key} = ?`).join(", ");
      const values = updates.map((key) => input[key]);
      await env.DB.prepare(`UPDATE releases SET ${assignments}, updated_at = CURRENT_TIMESTAMP WHERE listing_key = ?`).bind(...values, listingKey).run();
      await env.DB.prepare("INSERT INTO admin_audit (release_id, action) VALUES ((SELECT release_id FROM releases WHERE listing_key = ?), ?)").bind(listingKey, `Updated: ${updates.join(", ")}`).run();
      return json({ ok: true });
    }
    if(url.pathname.startsWith('/api/'))return json({error:'Not found'},404);
    return env.ASSETS.fetch(request);
  }
};
export {
  worker_default as default
};

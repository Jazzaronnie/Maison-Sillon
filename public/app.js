const state = {
  language: localStorage.getItem("maison-language") || "fr",
  inventory: [],
  cart: JSON.parse(localStorage.getItem("maison-cart") || "[]"),
  admin: false,
  visibleCount: 80
};

const copy = {
  fr: {
    eyebrow:"COLLECTION MONTRÉALAISE", heroTitle:"Une collection choisie,<br>à écouter autrement.", heroBody:"Faites défiler pour parcourir la salle. Découvrez les pièces sélectionnées, puis explorez le catalogue complet.",
    browse:"Explorer le catalogue", scroll:"Défiler pour entrer", featuredEyebrow:"PIÈCES EN VEDETTE", featuredTitle:"Sur les étagères", featuredBody:"Albums sélectionnés selon leur prix, leur disponibilité et leur intérêt Discogs. Touchez une pochette pour l’examiner.",
    catalogueEyebrow:"INVENTAIRE COMPLET", catalogueTitle:"Le catalogue", search:"Rechercher", searchPlaceholder:"Artiste ou titre", category:"Catégorie", condition:"État du média", price:"Prix maximum", all:"Toutes",
    admin:"Administration", sold:"VENDU", add:"Ajouter", remove:"Retirer", cartTitle:"Votre panier", fulfillment:"Livraison et cueillette", pickup:"Cueillette gratuite à Montréal", shipping:"Livraison postale", neighbourhood:"Quartier et code postal",
    total:"Total estimé", copyOrder:"Copier la demande pour Messenger", empty:"Votre panier est vide.", adminTitle:"Administration Maison Sillon", adminBody:"Entrez votre mot de passe pour modifier les prix, quantités, images et disponibilités.",
    password:"Mot de passe", signIn:"Ouvrir la session", signOut:"Fermer la session", turn:"Voir le verso", media:"État média", sleeve:"Pochette", label:"Étiquette", format:"Format", year:"Année", available:"Disponible", unavailable:"Vendu",
    copied:"Copié — collez-le dans Messenger !", shippingSmall:"10 $ pour 1–2 CD; 20 $ pour 3 CD ou plus.", items:"albums affichés", showMore:"Afficher plus", edit:"Modifier", addListing:"Ajouter un album", save:"Enregistrer", cancel:"Annuler",
    editorTitle:"Modifier l’album", newTitle:"Ajouter un album", quantity:"Quantité", imageUrl:"URL de l’image HD", notes:"Notes", releaseId:"ID Discogs", saved:"Modifications enregistrées.", loginError:"Mot de passe incorrect.", adminOpen:"Session administrateur ouverte.",
    discogsNotice:"Les images et données Discogs sont utilisées conformément à leurs conditions d’utilisation. Discogs n’est ni affilié à Maison Sillon ni responsable de ce catalogue."
  },
  en: {
    eyebrow:"MONTREAL COLLECTION", heroTitle:"A considered collection,<br>heard differently.", heroBody:"Scroll through the room. Discover selected records, then browse the full catalogue.",
    browse:"Browse the catalogue", scroll:"Scroll to enter", featuredEyebrow:"FEATURED SELECTION", featuredTitle:"On the shelves", featuredBody:"Albums selected for price, availability and Discogs interest. Tap a cover to inspect it.",
    catalogueEyebrow:"COMPLETE INVENTORY", catalogueTitle:"The catalogue", search:"Search", searchPlaceholder:"Artist or title", category:"Category", condition:"Media condition", price:"Maximum price", all:"All",
    admin:"Administration", sold:"SOLD", add:"Add", remove:"Remove", cartTitle:"Your basket", fulfillment:"Delivery & pickup", pickup:"Free pickup in Montréal", shipping:"Postal shipping", neighbourhood:"Neighbourhood and postal code",
    total:"Estimated total", copyOrder:"Copy request for Messenger", empty:"Your basket is empty.", adminTitle:"Maison Sillon administration", adminBody:"Enter your password to edit prices, quantities, images and availability.",
    password:"Password", signIn:"Open session", signOut:"Sign out", turn:"View reverse", media:"Media condition", sleeve:"Sleeve condition", label:"Label", format:"Format", year:"Year", available:"Available", unavailable:"Sold",
    copied:"Copied — paste it into Messenger!", shippingSmall:"$10 for 1–2 CDs; $20 for 3+ CDs.", items:"albums shown", showMore:"Show more", edit:"Edit", addListing:"Add an album", save:"Save", cancel:"Cancel",
    editorTitle:"Edit album", newTitle:"Add an album", quantity:"Quantity", imageUrl:"HD image URL", notes:"Notes", releaseId:"Discogs ID", saved:"Changes saved.", loginError:"Incorrect password.", adminOpen:"Admin session is open.",
    discogsNotice:"Discogs images and data are used under its terms of use. Discogs is not affiliated with Maison Sillon and is not responsible for this catalogue."
  }
};

const t = key => copy[state.language][key] || key;
const money = value => new Intl.NumberFormat(state.language === "fr" ? "fr-CA" : "en-CA", { style:"currency", currency:"CAD" }).format(Number(value || 0));
const escape = value => String(value ?? "").replace(/[&<>"']/g, character => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[character]));
const idOf = release => release.listing_key || release.release_id;
const placeholder = text => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800"><rect width="100%" height="100%" fill="#5c3926"/><circle cx="400" cy="400" r="280" fill="#25140d"/><circle cx="400" cy="400" r="70" fill="#c69a61"/><text x="400" y="715" text-anchor="middle" fill="#f3e5d1" font-family="Georgia" font-size="34">${escape(text).slice(0,28)}</text></svg>`)}`;

const samples = [
  ["11164230","Michael Bublé","Michael Bublé",19,"Jazz & Blues","Near Mint (NM or M-)","Very Good Plus (VG+)","143 Records, Reprise Records","CD, Album",2003,1,"available"],
  ["4207554","Joe Jackson","Stepping Out — The Very Best Of Joe Jackson",14,"Rock & Pop","Near Mint (NM or M-)","Near Mint (NM or M-)","A&M Records","CD, Comp",1989,1,"available"],
  ["5746001","Diana Krall","Live In Paris",25,"Jazz & Blues","Near Mint (NM or M-)","Near Mint (NM or M-)","Verve Records","CD, Album",2002,1,"available"],
  ["5487348","Ludwig van Beethoven","9 Symphonien",23,"Classical","Near Mint (NM or M-)","Near Mint (NM or M-)","Deutsche Grammophon","5xCD, Box",1995,1,"available"],
  ["2344371","KISS","Smashes, Thrashes & Hits",17,"Rock & Pop","Very Good (VG)","Very Good (VG)","Mercury","CD, Comp",1988,1,"available"],
  ["3896167","Alabama","Greatest Hits Vol. III",16,"Folk & Country","Near Mint (NM or M-)","Near Mint (NM or M-)","RCA","CD, Comp",1994,1,"available"]
].map(([release_id,artist,title,price_cad,category,media_condition,sleeve_condition,label_name,format,release_year,quantity,status]) => ({release_id,listing_key:release_id,artist,title,price_cad,category,media_condition,sleeve_condition,label_name,format,release_year,quantity,status,popularity_score:0}));

function applyLanguage() {
  document.documentElement.lang = state.language;
  document.querySelectorAll("[data-i18n]").forEach(element => {
    const value = t(element.dataset.i18n);
    if (value.includes("<br>")) element.innerHTML = value; else element.textContent = value;
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(element => element.placeholder = t(element.dataset.i18nPlaceholder));
  document.querySelector("#language").textContent = state.language === "fr" ? "FR / EN" : "EN / FR";
  renderFilters(); renderFeatured(); renderCatalogue(); renderCart();
}

async function loadInventory() {
  try {
    const response = await fetch("/api/inventory?max=2000");
    if (!response.ok) throw new Error("Inventory unavailable");
    const data = await response.json();
    state.inventory = data.releases?.length ? data.releases : samples;
  } catch { state.inventory = samples; }
  applyLanguage();
}

function createCard(release) {
  const node = document.querySelector("#card-template").content.firstElementChild.cloneNode(true);
  const image = node.querySelector("img");
  image.src = release.custom_image_url || release.discogs_image_url || placeholder(release.title);
  image.alt = `${release.artist} — ${release.title}`;
  image.onerror = () => { image.onerror = null; image.src = placeholder(release.title); };
  node.querySelector("h3").textContent = release.title;
  node.querySelector(".artist").textContent = release.artist;
  node.querySelector(".card-price").textContent = money(release.price_cad);
  const sold = release.status === "sold" || Number(release.quantity) < 1;
  if (sold) node.classList.add("is-sold");
  node.querySelector(".cover-button").onclick = () => openRecord(release);
  node.querySelector(".add").onclick = () => addToCart(idOf(release));
  const edit = node.querySelector(".admin-edit");
  edit.hidden = !state.admin;
  edit.onclick = () => openEditor(release);
  return node;
}

function renderFeatured() {
  const target = document.querySelector("#featured-grid"); target.innerHTML = "";
  const categories = [...new Set(state.inventory.map(release => release.category))];
  const featured = categories.flatMap(category => state.inventory.filter(release => release.category === category && release.status !== "sold").sort((a,b) => b.popularity_score - a.popularity_score || b.price_cad - a.price_cad).slice(0,2)).slice(0,10);
  (featured.length ? featured : state.inventory.slice(0,6)).forEach(release => target.append(createCard(release)));
}

function renderFilters() {
  const fill = (selector, values) => {
    const select = document.querySelector(selector); const current = select.value;
    select.innerHTML = `<option value="">${t("all")}</option>` + values.map(value => `<option value="${escape(value)}">${escape(value)}</option>`).join("");
    select.value = current;
  };
  fill("#category-filter", [...new Set(state.inventory.map(release => release.category))].filter(Boolean).sort());
  fill("#condition-filter", [...new Set(state.inventory.map(release => release.media_condition))].filter(Boolean).sort());
}

function filteredInventory() {
  const query = document.querySelector("#search").value.toLowerCase().trim();
  const category = document.querySelector("#category-filter").value;
  const condition = document.querySelector("#condition-filter").value;
  const max = Number(document.querySelector("#price-filter").value);
  return state.inventory.filter(release => (!query || `${release.artist} ${release.title}`.toLowerCase().includes(query)) && (!category || release.category === category) && (!condition || release.media_condition === condition) && Number(release.price_cad) <= max);
}

function renderCatalogue() {
  const releases = filteredInventory(); const target = document.querySelector("#catalogue-grid"); target.innerHTML = "";
  releases.slice(0, state.visibleCount).forEach(release => target.append(createCard(release)));
  document.querySelector("#catalogue-count").textContent = `${releases.length} ${t("items")}`;
  document.querySelector("#price-output").textContent = money(document.querySelector("#price-filter").value);
  const more = document.querySelector("#show-more");
  more.hidden = releases.length <= state.visibleCount;
  more.textContent = t("showMore");
}

function openRecord(release) {
  const image = release.custom_image_url || release.discogs_image_url || placeholder(release.title);
  document.querySelector("#record-content").innerHTML = `<div class="record-stage"><div class="record-object" id="record-object"><div class="record-face"><img src="${escape(image)}" alt="${escape(release.title)}"></div><div class="record-face record-back"><p>${escape(release.artist)}<br><br>${escape(release.title)}<br><br>${escape(release.format || "CD")}</p></div></div></div><div class="record-info"><p class="eyebrow">${escape(release.category || "")}</p><h2>${escape(release.title)}</h2><p>${escape(release.artist)}</p><p class="card-price">${money(release.price_cad)}</p><div class="record-meta"><div>${t("format")}: ${escape(release.format || "—")}</div><div>${t("label")}: ${escape(release.label_name || "—")}</div><div>${t("year")}: ${escape(release.release_year || "—")}</div><div>${t("media")}: ${escape(release.media_condition || "—")}</div><div>${t("sleeve")}: ${escape(release.sleeve_condition || "—")}</div></div><div class="record-actions"><button id="flip-record">${t("turn")}</button><button class="primary" id="record-add">${t("add")}</button>${state.admin ? `<button id="record-edit">${t("edit")}</button>` : ""}</div></div>`;
  document.querySelector("#flip-record").onclick = () => document.querySelector("#record-object").classList.toggle("flipped");
  document.querySelector("#record-add").onclick = () => { addToCart(idOf(release)); document.querySelector("#record-dialog").close(); };
  if (state.admin) document.querySelector("#record-edit").onclick = () => { document.querySelector("#record-dialog").close(); openEditor(release); };
  document.querySelector("#record-dialog").showModal();
}

function addToCart(id) {
  const release = state.inventory.find(item => idOf(item) === id);
  if (!release || release.status === "sold" || Number(release.quantity) < 1) return;
  const existing = state.cart.find(item => item.id === id);
  if (existing) existing.quantity = Math.min(existing.quantity + 1, Number(release.quantity)); else state.cart.push({ id, quantity: 1 });
  persistCart(); renderCart();
}
function persistCart() { localStorage.setItem("maison-cart", JSON.stringify(state.cart)); }
function cartReleases() { return state.cart.map(item => ({...item, release: state.inventory.find(release => idOf(release) === item.id)})).filter(item => item.release); }
function renderCart() {
  const items = cartReleases();
  document.querySelector("#cart-count").textContent = items.reduce((number,item) => number + item.quantity, 0);
  const target = document.querySelector("#cart-items"); target.innerHTML = items.length ? "" : `<p>${t("empty")}</p>`;
  items.forEach(({release,quantity}) => {
    const row = document.createElement("div"); row.className = "cart-row";
    row.innerHTML = `<div><strong>${escape(release.title)}</strong><p>${escape(release.artist)} × ${quantity}</p></div><strong>${money(release.price_cad * quantity)}</strong><button aria-label="${t("remove")}">×</button>`;
    row.querySelector("button").onclick = () => { state.cart = state.cart.filter(item => item.id !== idOf(release)); persistCart(); renderCart(); };
    target.append(row);
  });
  const shipping = document.querySelector('input[name="delivery"]:checked')?.value || "pickup";
  const subtotal = items.reduce((number,{release,quantity}) => number + Number(release.price_cad) * quantity, 0);
  const fee = shipping === "shipping" ? (items.reduce((number,item) => number + item.quantity, 0) <= 2 ? 10 : 20) : 0;
  document.querySelector("#shipping-note").textContent = shipping === "shipping" ? t("shippingSmall") : t("pickup");
  document.querySelector("#cart-total").textContent = money(subtotal + fee);
}

function copyOrder() {
  const items = cartReleases(); const shipping = document.querySelector('input[name="delivery"]:checked').value;
  const count = items.reduce((number,item) => number + item.quantity, 0);
  const subtotal = items.reduce((number,{release,quantity}) => number + Number(release.price_cad) * quantity, 0);
  const fee = shipping === "shipping" ? (count <= 2 ? 10 : 20) : 0;
  const location = document.querySelector("#neighbourhood").value.trim();
  const delivery = shipping === "pickup" ? t("pickup") : `${t("shipping")} (${money(fee)})${location ? ` — ${location}` : ""}`;
  const text = `Maison Sillon\n\n${items.map(({release,quantity}) => `• ${release.artist} — ${release.title} × ${quantity}: ${money(release.price_cad * quantity)}`).join("\n")}\n\n${t("fulfillment")}: ${delivery}\n${t("total")}: ${money(subtotal + fee)}`;
  navigator.clipboard.writeText(text).then(() => { const button = document.querySelector("#copy-order"); button.textContent = t("copied"); setTimeout(() => button.textContent = t("copyOrder"), 1800); });
}

function openEditor(release = null) {
  if (!state.admin) return;
  const form = document.querySelector("#editor-form");
  form.reset(); form.dataset.listingKey = release ? idOf(release) : "";
  document.querySelector("#editor-heading").textContent = release ? t("editorTitle") : t("newTitle");
  const values = release || { quantity:1, status:"available", format:"CD", price_cad:"", category:"Rock & Pop" };
  ["artist","title","release_id","label_name","format","release_year","media_condition","sleeve_condition","notes","price_cad","quantity","status","category","custom_image_url"].forEach(name => {
    const input = form.elements.namedItem(name); if (input) input.value = values[name] ?? "";
  });
  document.querySelector("#editor-dialog").showModal();
}

async function saveEditor(event) {
  event.preventDefault();
  const form = event.currentTarget; const input = Object.fromEntries(new FormData(form).entries());
  input.price_cad = Number(input.price_cad); input.quantity = Number(input.quantity); input.release_year = input.release_year ? Number(input.release_year) : null;
  const editing = Boolean(form.dataset.listingKey);
  const response = await fetch(editing ? `/api/admin/releases/${encodeURIComponent(form.dataset.listingKey)}` : "/api/admin/releases", {
    method: editing ? "PATCH" : "POST", headers: { "Content-Type":"application/json" }, body: JSON.stringify(input)
  });
  const result = await response.json().catch(() => ({}));
  const status = document.querySelector("#editor-status");
  if (!response.ok) { status.textContent = result.error || "Unable to save."; return; }
  status.textContent = t("saved"); document.querySelector("#editor-dialog").close();
  await loadInventory();
}

async function updateAdminSession() {
  try { state.admin = Boolean((await (await fetch("/api/admin/session")).json()).ok); } catch { state.admin = false; }
}

function setup() {
  document.querySelector("#language").onclick = () => { state.language = state.language === "fr" ? "en" : "fr"; localStorage.setItem("maison-language", state.language); applyLanguage(); };
  document.querySelectorAll("[data-close]").forEach(button => button.onclick = () => document.querySelector(`#${button.dataset.close}`).close());
  document.querySelector("#open-cart").onclick = () => { renderCart(); document.querySelector("#cart-dialog").showModal(); };
  document.querySelectorAll("#search,#category-filter,#condition-filter,#price-filter").forEach(element => element.addEventListener("input", () => { state.visibleCount = 80; renderCatalogue(); }));
  document.querySelectorAll('input[name="delivery"]').forEach(element => element.onchange = () => { document.querySelector("#neighbourhood-row").hidden = element.value !== "shipping" || !element.checked; renderCart(); });
  document.querySelector("#copy-order").onclick = copyOrder;
  document.querySelector("#show-more").onclick = () => { state.visibleCount += 80; renderCatalogue(); };
  document.querySelector("#admin-launch").onclick = () => document.querySelector("#admin-dialog").showModal();
  document.querySelector("#admin-login").onclick = async () => {
    const password = document.querySelector("#admin-password").value;
    const response = await fetch("/api/admin/login", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ password }) });
    document.querySelector("#admin-status").textContent = response.ok ? t("adminOpen") : t("loginError");
    if (response.ok) { state.admin = true; document.querySelector("#admin-password").value = ""; renderFeatured(); renderCatalogue(); document.querySelector("#admin-tools").hidden = false; }
  };
  document.querySelector("#admin-add").onclick = () => { document.querySelector("#admin-dialog").close(); openEditor(); };
  document.querySelector("#admin-logout").onclick = async () => { await fetch("/api/admin/logout", { method:"POST" }); state.admin = false; document.querySelector("#admin-tools").hidden = true; renderFeatured(); renderCatalogue(); };
  document.querySelector("#editor-form").addEventListener("submit", saveEditor);
  window.addEventListener("scroll", () => {
    const progress = Math.min(window.scrollY / Math.max(1, window.innerHeight), 1);
    document.querySelector("#room").style.transform = `scale(${1 + progress * .06}) translateY(${progress * -1.5}%)`;
    document.querySelector(".topbar").classList.toggle("scrolled", window.scrollY > 50);
  }, { passive:true });
  updateAdminSession().then(() => { if (state.admin) document.querySelector("#admin-tools").hidden = false; loadInventory(); });
}
setup();

import { store, mode, makeFolio } from "./store.js";
import { CATEGORIES, FLAVORS, SIDES, DEFAULT_MENU, DEFAULT_PROMOS } from "./defaults.js";

/* ---------- utilidades ---------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const money = n => "$" + Number(n || 0).toLocaleString("es-MX", { maximumFractionDigits: 2 });
const slug = s => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "item";
const fmtDate = ms => new Date(ms).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" });

let toastTimer;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
}

$("#year").textContent = new Date().getFullYear();

/* ---------- menú lateral (3 líneas) ---------- */
const drawer = $("#drawer"), backdrop = $("#drawerBackdrop"), burger = $("#burgerBtn");
function setDrawer(open) {
  drawer.classList.toggle("open", open);
  drawer.setAttribute("aria-hidden", String(!open));
  burger.setAttribute("aria-expanded", String(open));
  backdrop.hidden = !open;
}
burger.addEventListener("click", () => setDrawer(!drawer.classList.contains("open")));
backdrop.addEventListener("click", () => setDrawer(false));
$$("#drawer a[href^='#']").forEach(a => a.addEventListener("click", () => setDrawer(false)));
document.addEventListener("keydown", e => { if (e.key === "Escape") setDrawer(false); });

/* ---------- estado ---------- */
let MENU = [], PROMOS = [];
let isAdmin = false;
let cart = [];
try { cart = JSON.parse(localStorage.getItem("nj_cart") || "[]"); } catch { cart = []; }
const saveCart = () => { try { localStorage.setItem("nj_cart", JSON.stringify(cart)); } catch { /* */ } };

/* ---------- promociones ---------- */
function renderPromos() {
  const active = PROMOS.filter(p => p.active);
  $("#promoGrid").innerHTML = active.length ? active.map(p => `
    <article class="promo">
      ${p.tag ? `<span class="promo-tag">${esc(p.tag)}</span>` : ""}
      <h3>${esc(p.title)}</h3>
      <p>${esc(p.desc)}</p>
      <div class="promo-foot">
        <span class="promo-price">${money(p.price)}${p.before > p.price ? `<s>${money(p.before)}</s>` : ""}</span>
        <button class="btn btn-gold btn-sm" data-promo="${esc(p.id)}">Agregar</button>
      </div>
    </article>`).join("") : `<p class="empty">Pronto tendremos nuevas promociones. ¡Síguenos!</p>`;
}
$("#promoGrid").addEventListener("click", e => {
  const b = e.target.closest("[data-promo]");
  if (!b) return;
  const p = PROMOS.find(x => x.id === b.dataset.promo);
  if (!p) return;
  if (/alita|tabla/i.test(p.title + " " + p.desc)) {
    openOptions({ id: p.id, name: "Promo: " + p.title, price: p.price, options: ["flavor"] });
  } else {
    addToCart({ id: p.id, name: "Promo: " + p.title, price: p.price }, 1, "");
  }
});

/* ---------- menú ---------- */
function renderMenu() {
  const html = CATEGORIES.map(c => {
    const items = MENU.filter(i => i.cat === c.id);
    if (!items.length) return "";
    return `<div class="menu-cat">
      <h3>${esc(c.name)}</h3>
      ${c.note ? `<p class="menu-note">${esc(c.note)}</p>` : ""}
      ${items.map(i => `
        <div class="menu-item">
          <h4>${esc(i.name)}</h4>
          <span class="menu-price">${money(i.price)}</span>
          ${i.desc ? `<p>${esc(i.desc)}</p>` : "<p></p>"}
          <button class="add" data-add="${esc(i.id)}">+ Agregar</button>
        </div>`).join("")}
    </div>`;
  }).join("");
  $("#menuBoard").innerHTML = html;
}
$("#menuBoard").addEventListener("click", e => {
  const b = e.target.closest("[data-add]");
  if (!b) return;
  const item = MENU.find(i => i.id === b.dataset.add);
  if (!item) return;
  if (item.options?.length) openOptions(item);
  else addToCart(item, 1, "");
});

/* ---------- modal de opciones ---------- */
const optModal = $("#optionModal");
let optItem = null, optQty = 1;
function openOptions(item) {
  optItem = item; optQty = 1;
  $("#optionTitle").textContent = item.name;
  $("#optionQty").textContent = "1";
  const groups = [];
  if (item.options.includes("flavor")) groups.push(["flavor", "Sabor de alitas", FLAVORS]);
  if (item.options.includes("side")) groups.push(["side", "Guarnición", SIDES]);
  $("#optionFields").innerHTML = groups.map(([name, label, opts]) => `
    <fieldset class="opt-group"><legend>${label}</legend><div class="opts">
      ${opts.map((o, i) => `<label><input type="radio" name="${name}" value="${esc(o)}" ${i === 0 ? "checked" : ""}> ${esc(o)}</label>`).join("")}
    </div></fieldset>`).join("");
  optModal.showModal();
}
optModal.addEventListener("click", e => {
  const b = e.target.closest("[data-step]");
  if (!b) return;
  optQty = Math.max(1, Math.min(20, optQty + Number(b.dataset.step)));
  $("#optionQty").textContent = optQty;
});
optModal.addEventListener("close", () => {
  if (optModal.returnValue !== "ok" || !optItem) return;
  const f = $("#optionForm");
  const detail = [f.flavor?.value && `Sabor: ${f.flavor.value}`, f.side?.value && `Guarnición: ${f.side.value}`].filter(Boolean).join(" · ");
  addToCart(optItem, optQty, detail);
  optItem = null;
});

/* ---------- carrito ---------- */
function addToCart(item, qty, detail) {
  const key = item.id + "|" + detail;
  const line = cart.find(l => l.key === key);
  if (line) line.qty += qty;
  else cart.push({ key, id: item.id, name: item.name, price: Number(item.price), qty, detail });
  saveCart(); renderCart();
  toast(`Agregado: ${item.name}`);
}
function cartTotal() { return cart.reduce((s, l) => s + l.price * l.qty, 0); }
function renderCart() {
  // Mantiene los precios al día si el administrador los cambia
  cart.forEach(l => {
    const m = MENU.find(i => i.id === l.id) || PROMOS.find(p => p.id === l.id);
    if (m) l.price = Number(m.price);
  });
  const count = cart.reduce((s, l) => s + l.qty, 0);
  $("#cartCount").textContent = count;
  $("#cartEmpty").hidden = cart.length > 0;
  $("#cartList").innerHTML = cart.map((l, i) => `
    <li>
      <span>${l.qty} × ${esc(l.name)}</span><strong>${money(l.price * l.qty)}</strong>
      ${l.detail ? `<small>${esc(l.detail)}</small>` : ""}
      <div class="cart-line-ctrl">
        <button data-q="${i}" data-d="-1" aria-label="Quitar uno">−</button>
        <button data-q="${i}" data-d="1" aria-label="Agregar uno">+</button>
        <button class="rm" data-rm="${i}">Quitar</button>
      </div>
    </li>`).join("");
  $("#cartTotal").textContent = money(cartTotal());
  $("#orderSubmit").disabled = cart.length === 0;
}
$("#cartList").addEventListener("click", e => {
  const q = e.target.closest("[data-q]"), rm = e.target.closest("[data-rm]");
  if (q) {
    const l = cart[+q.dataset.q];
    l.qty += +q.dataset.d;
    if (l.qty < 1) cart.splice(+q.dataset.q, 1);
  } else if (rm) cart.splice(+rm.dataset.rm, 1);
  else return;
  saveCart(); renderCart();
});
$("#cartBtn").addEventListener("click", () => $("#cartPanel").scrollIntoView({ behavior: "smooth", block: "start" }));

/* ---------- realizar pedido ---------- */
const orderForm = $("#orderForm");
orderForm.addEventListener("change", e => {
  if (e.target.name === "delivery") $("#addressWrap").hidden = e.target.value !== "A domicilio";
});
orderForm.addEventListener("submit", async e => {
  e.preventDefault();
  const err = $("#orderError");
  const f = new FormData(orderForm);
  const name = f.get("name").trim(), phone = f.get("phone").trim(), delivery = f.get("delivery");
  const address = (f.get("address") || "").trim(), notes = f.get("notes").trim();
  err.textContent = "";
  if (!cart.length) return (err.textContent = "Agrega al menos un platillo.");
  if (!name) return (err.textContent = "Escribe tu nombre.");
  if (phone.replace(/\D/g, "").length < 10) return (err.textContent = "Escribe un teléfono de 10 dígitos.");
  if (delivery === "A domicilio" && !address) return (err.textContent = "Escribe la dirección de entrega.");

  const folio = makeFolio();
  const order = {
    folio, name, phone, delivery, address: delivery === "A domicilio" ? address : "", notes,
    items: cart.map(({ name, qty, price, detail }) => ({ name, qty, price, detail })),
    total: cartTotal(), status: "pendiente",
  };
  const btn = $("#orderSubmit");
  btn.disabled = true; btn.textContent = "Enviando…";
  try {
    await store.addOrder(order);
    cart = []; saveCart(); renderCart();
    orderForm.reset(); $("#addressWrap").hidden = true;
    $("#doneFolio").textContent = folio;
    $("#doneModal").showModal();
  } catch (ex) {
    console.error(ex);
    err.textContent = "No se pudo enviar el pedido. Intenta de nuevo o llámanos al 272 281 38 77.";
  } finally {
    btn.textContent = "Realizar pedido";
    btn.disabled = cart.length === 0;
  }
});
$("#doneClose").addEventListener("click", () => $("#doneModal").close());

/* ---------- galería ---------- */
const lb = $("#lightbox");
$$(".g-item").forEach(b => b.addEventListener("click", () => {
  $("#lbImg").src = b.dataset.full;
  $("#lbImg").alt = b.querySelector("img").alt;
  lb.showModal();
}));
$("#lbClose").addEventListener("click", () => lb.close());
lb.addEventListener("click", e => { if (e.target === lb) lb.close(); });

/* ---------- reseñas ---------- */
let REVIEWS = [];
const starStr = n => `<span class="review-stars" aria-label="${n} de 5 estrellas">${"★".repeat(n)}<span class="off">${"★".repeat(5 - n)}</span></span>`;
function renderReviews() {
  $("#reviewList").innerHTML = REVIEWS.map(r => `
    <article class="review">
      ${starStr(r.rating)}
      <p>${esc(r.text)}</p>
      <footer><strong>${esc(r.name)}</strong><span>${new Date(r.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}</span></footer>
    </article>`).join("");
  if (REVIEWS.length) {
    const avg = REVIEWS.reduce((s, r) => s + r.rating, 0) / REVIEWS.length;
    $("#ratingSummary").textContent = `★ ${avg.toFixed(1)} de 5 · ${REVIEWS.length} reseña${REVIEWS.length === 1 ? "" : "s"}`;
  }
  renderReviewAdmin();
}
let rating = 0;
const paintStars = () => $$("#starsInput button").forEach(b => b.classList.toggle("on", +b.dataset.v <= rating));
$("#starsInput").addEventListener("click", e => {
  const b = e.target.closest("button");
  if (b) { rating = +b.dataset.v; paintStars(); }
});
$("#reviewForm").addEventListener("submit", async e => {
  e.preventDefault();
  const f = e.target, err = $("#reviewError");
  const name = f.name.value.trim(), text = f.text.value.trim();
  err.textContent = "";
  if (!rating) return (err.textContent = "Elige una calificación de estrellas.");
  if (!name || !text) return (err.textContent = "Escribe tu nombre y tu opinión.");
  try {
    await store.addReview({ name, text, rating });
    f.reset(); rating = 0; paintStars();
    toast("¡Gracias por tu reseña!");
  } catch (ex) {
    console.error(ex);
    err.textContent = "No se pudo publicar. Intenta de nuevo.";
  }
});

/* =====================================================================
   ADMINISTRADOR
   ===================================================================== */
const loginModal = $("#loginModal"), panel = $("#adminPanel");
let ORDERS = [], stopOrders = null;

$("#adminEntryBtn").addEventListener("click", () => {
  setDrawer(false);
  if (isAdmin) openPanel();
  else { $("#loginError").textContent = ""; loginModal.showModal(); $("#loginForm").email.focus(); }
});
$("#loginCancel").addEventListener("click", () => loginModal.close());
$("#loginForm").addEventListener("submit", async e => {
  e.preventDefault();
  const f = e.target;
  try {
    await store.login(f.email.value, f.password.value);
    f.reset(); loginModal.close();
    openPanel();
    toast("Sesión iniciada");
  } catch (ex) {
    $("#loginError").textContent = ex.message || "No se pudo iniciar sesión.";
  }
});
$("#logoutBtn").addEventListener("click", async () => {
  await store.logout(); setDrawer(false); panel.hidden = true; document.body.style.overflow = "";
  toast("Sesión cerrada");
});

const handleAuth = admin => {
  isAdmin = admin;
  $("#adminEntryLabel").textContent = admin ? "Pedidos pendientes" : "Administrador";
  $("#logoutBtn").hidden = !admin;
  if (stopOrders) { stopOrders(); stopOrders = null; }
  if (admin) stopOrders = store.watchOrders(list => { ORDERS = list; renderOrders(); });
  else { ORDERS = []; panel.hidden = true; $("#pendingBadge").hidden = true; }
};

function openPanel() {
  panel.hidden = false;
  document.body.style.overflow = "hidden";
  renderOrders(); renderMenuEditor(); renderPromoEditor(); renderReviewAdmin();
}
$("#adminClose").addEventListener("click", () => { panel.hidden = true; document.body.style.overflow = ""; });

$$(".admin-tabs button").forEach(b => b.addEventListener("click", () => {
  $$(".admin-tabs button").forEach(x => x.classList.toggle("active", x === b));
  $$(".admin-pane").forEach(p => p.hidden = p.dataset.pane !== b.dataset.tab);
}));

/* ----- pedidos ----- */
const STATUS_LABEL = { pendiente: "Pendiente", preparando: "Preparando", entregado: "Entregado" };
function renderOrders() {
  const pending = ORDERS.filter(o => o.status !== "entregado");
  $("#tabBadge").textContent = pending.length;
  $("#pendingBadge").textContent = pending.length;
  $("#pendingBadge").hidden = !isAdmin || pending.length === 0;
  if (panel.hidden) return;
  const list = $("#showDone").checked ? ORDERS : pending;
  const note = mode === "local"
    ? `<div class="demo-note">Modo demostración: los pedidos se guardan solo en este navegador. Para recibir pedidos de los clientes desde cualquier teléfono, conecta Firebase (ver README).</div>` : "";
  $("#orderList").innerHTML = note + (list.length ? list.map(o => `
    <article class="order-card ${o.status === "entregado" ? "done" : ""}">
      <div class="order-head">
        <div><strong>${esc(o.folio)}</strong> · ${esc(o.name)}</div>
        <span class="order-status ${esc(o.status)}">${STATUS_LABEL[o.status] || esc(o.status)}</span>
      </div>
      <div class="order-meta">
        ${fmtDate(o.createdAt)} · <a href="tel:${esc(o.phone.replace(/[^\d+]/g, ""))}">${esc(o.phone)}</a> · ${esc(o.delivery)}
        ${o.address ? `<br>📍 ${esc(o.address)}` : ""}
      </div>
      <ul class="order-items">
        ${(o.items || []).map(i => `<li>${i.qty} × ${esc(i.name)} — ${money(i.price * i.qty)}${i.detail ? `<br><small>${esc(i.detail)}</small>` : ""}</li>`).join("")}
      </ul>
      ${o.notes ? `<p class="order-meta">📝 ${esc(o.notes)}</p>` : ""}
      <div class="order-foot">
        <span class="order-total">${money(o.total)}</span>
        <div class="order-actions">
          ${o.status === "pendiente" ? `<button class="btn btn-sm btn-outline" data-status="preparando" data-id="${esc(o.id)}">Preparando</button>` : ""}
          ${o.status !== "entregado" ? `<button class="btn btn-sm btn-ok" data-status="entregado" data-id="${esc(o.id)}">Entregado</button>` : `<button class="btn btn-sm btn-ghost" data-status="pendiente" data-id="${esc(o.id)}">Reabrir</button>`}
          <button class="btn btn-sm btn-danger" data-del-order="${esc(o.id)}">Eliminar</button>
        </div>
      </div>
    </article>`).join("") : `<p class="empty">No hay pedidos ${$("#showDone").checked ? "" : "pendientes"} por ahora.</p>`);
}
$("#showDone").addEventListener("change", renderOrders);
$("#orderList").addEventListener("click", async e => {
  const s = e.target.closest("[data-status]"), d = e.target.closest("[data-del-order]");
  try {
    if (s) await store.setOrderStatus(s.dataset.id, s.dataset.status);
    else if (d && confirm("¿Eliminar este pedido? No se puede deshacer.")) await store.deleteOrder(d.dataset.delOrder);
  } catch (ex) { console.error(ex); toast("No se pudo actualizar el pedido"); }
});

/* ----- editor de menú ----- */
let menuDraft = [];
function renderMenuEditor() {
  menuDraft = MENU.map(i => ({ ...i, options: [...(i.options || [])] }));
  drawMenuEditor();
}
function drawMenuEditor() {
  $("#menuEditor").innerHTML = menuDraft.map((i, n) => `
    <div class="edit-row" data-n="${n}">
      <label>Categoría<select data-f="cat">${CATEGORIES.map(c => `<option value="${c.id}" ${c.id === i.cat ? "selected" : ""}>${esc(c.name)}</option>`).join("")}</select></label>
      <label>Nombre<input data-f="name" value="${esc(i.name)}"></label>
      <label>Descripción<input data-f="desc" value="${esc(i.desc)}"></label>
      <label>Precio ($)<input data-f="price" type="number" min="0" step="1" inputmode="numeric" value="${esc(i.price)}"></label>
      <button class="btn btn-sm btn-danger" data-del-item="${n}" aria-label="Eliminar ${esc(i.name)}">Eliminar</button>
    </div>`).join("");
}
$("#menuEditor").addEventListener("input", e => {
  const row = e.target.closest("[data-n]"), f = e.target.dataset.f;
  if (!row || !f) return;
  menuDraft[+row.dataset.n][f] = f === "price" ? Number(e.target.value) : e.target.value;
});
$("#menuEditor").addEventListener("click", e => {
  const b = e.target.closest("[data-del-item]");
  if (b && confirm("¿Eliminar este platillo del menú?")) { menuDraft.splice(+b.dataset.delItem, 1); drawMenuEditor(); }
});
$("#addMenuItem").addEventListener("click", () => {
  menuDraft.push({ id: "", cat: "costilla", name: "", desc: "", price: 0, options: [] });
  drawMenuEditor();
  $("#menuEditor .edit-row:last-child [data-f=name]").focus();
});
$("#saveMenu").addEventListener("click", async () => {
  const items = menuDraft.filter(i => i.name.trim());
  if (items.some(i => !(i.price >= 0) || Number.isNaN(i.price))) return toast("Revisa los precios");
  const used = new Set();
  items.forEach(i => {
    i.name = i.name.trim(); i.desc = (i.desc || "").trim();
    if (!i.id) i.id = slug(i.name) + "-" + Date.now().toString(36);
    while (used.has(i.id)) i.id += "x";
    used.add(i.id);
    if (!i.options.length && i.cat === "alitas") i.options = ["flavor"];
  });
  try { await store.saveMenu(items); toast("Menú guardado"); }
  catch (ex) { console.error(ex); toast("No se pudo guardar"); }
});

/* ----- editor de promociones ----- */
let promoDraft = [];
function renderPromoEditor() { promoDraft = PROMOS.map(p => ({ ...p })); drawPromoEditor(); }
function drawPromoEditor() {
  $("#promoEditor").innerHTML = promoDraft.length ? promoDraft.map((p, n) => `
    <div class="edit-row promo-edit" data-n="${n}">
      <label>Título<input data-f="title" value="${esc(p.title)}"></label>
      <label>Etiqueta<input data-f="tag" value="${esc(p.tag)}" placeholder="Ej. Martes de alitas"></label>
      <label>Precio ($)<input data-f="price" type="number" min="0" inputmode="numeric" value="${esc(p.price)}"></label>
      <label>Antes ($)<input data-f="before" type="number" min="0" inputmode="numeric" value="${esc(p.before ?? "")}"></label>
      <label class="chk"><input data-f="active" type="checkbox" ${p.active ? "checked" : ""}> Activa</label>
      <button class="btn btn-sm btn-danger" data-del-promo="${n}">Eliminar</button>
      <label class="wide">Descripción<input data-f="desc" value="${esc(p.desc)}"></label>
    </div>`).join("") : `<p class="empty">No hay promociones. Crea una nueva.</p>`;
}
$("#promoEditor").addEventListener("input", e => {
  const row = e.target.closest("[data-n]"), f = e.target.dataset.f;
  if (!row || !f) return;
  const p = promoDraft[+row.dataset.n];
  p[f] = f === "active" ? e.target.checked : (f === "price" || f === "before") ? Number(e.target.value) : e.target.value;
});
$("#promoEditor").addEventListener("click", e => {
  const b = e.target.closest("[data-del-promo]");
  if (b && confirm("¿Eliminar esta promoción?")) { promoDraft.splice(+b.dataset.delPromo, 1); drawPromoEditor(); }
});
$("#addPromo").addEventListener("click", () => {
  promoDraft.push({ id: "", tag: "", title: "", desc: "", price: 0, before: 0, active: true });
  drawPromoEditor();
  $("#promoEditor .edit-row:last-child [data-f=title]").focus();
});
$("#savePromos").addEventListener("click", async () => {
  const items = promoDraft.filter(p => p.title.trim()).map(p => ({
    ...p, title: p.title.trim(), tag: (p.tag || "").trim(), desc: (p.desc || "").trim(),
    price: Number(p.price) || 0, before: Number(p.before) || 0,
    id: p.id || "promo-" + slug(p.title) + "-" + Date.now().toString(36),
  }));
  try { await store.savePromos(items); toast("Promociones guardadas"); }
  catch (ex) { console.error(ex); toast("No se pudo guardar"); }
});

/* ----- reseñas (admin) ----- */
function renderReviewAdmin() {
  if (!isAdmin || panel.hidden) return;
  $("#reviewAdmin").innerHTML = REVIEWS.map(r => `
    <div class="edit-row" style="grid-template-columns:1fr auto">
      <div>${starStr(r.rating)} <strong>${esc(r.name)}</strong><br><span class="muted">${esc(r.text)}</span></div>
      ${r.seed ? "" : `<button class="btn btn-sm btn-danger" data-del-review="${esc(r.id)}">Eliminar</button>`}
    </div>`).join("") || `<p class="empty">Sin reseñas.</p>`;
}
$("#reviewAdmin").addEventListener("click", async e => {
  const b = e.target.closest("[data-del-review]");
  if (!b || !confirm("¿Eliminar esta reseña?")) return;
  try { await store.deleteReview(b.dataset.delReview); toast("Reseña eliminada"); }
  catch (ex) { console.error(ex); toast("No se pudo eliminar"); }
});

/* ---------- arranque ---------- */
(async () => {
  try {
    await store.init();
  } catch (ex) {
    console.error("No se pudo conectar con la base de datos", ex);
    toast("Sin conexión con el servidor de pedidos");
    MENU = DEFAULT_MENU; PROMOS = DEFAULT_PROMOS;
    renderPromos(); renderMenu(); renderCart();
    return;
  }
  store.watchContent(({ menu, promos }) => {
    MENU = menu; PROMOS = promos;
    renderPromos(); renderMenu(); renderCart();
  });
  store.watchReviews(list => { REVIEWS = list; renderReviews(); });
  store.onAuth(handleAuth);
})();

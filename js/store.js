// Capa de datos: usa Firebase si está configurado; si no, guarda en el navegador (modo demostración).
import { ADMIN_EMAIL, FIREBASE_CONFIG } from "./config.js";
import { DEFAULT_MENU, DEFAULT_PROMOS, SEED_REVIEWS } from "./defaults.js";

const FB_VERSION = "10.12.2";
const useFirebase = Boolean(FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.projectId);

export const mode = useFirebase ? "firebase" : "local";

export function makeFolio() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 5; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return "NJ-" + s;
}

/* ===================================================================
   Modo local (demostración)
   =================================================================== */
// Hash SHA-256 de "correo:contraseña" — así la contraseña no queda escrita en el código.
const LOCAL_ADMIN_HASH = "4419a443f754b8f65543d2c70acb997f97a6d33352e2acf4509e30602f471244";

function lsGet(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function lsSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* sin almacenamiento */ }
  window.dispatchEvent(new CustomEvent("nj-store", { detail: key }));
}
function ssGet(key) { try { return sessionStorage.getItem(key); } catch { return null; } }
function ssSet(key, v) { try { v == null ? sessionStorage.removeItem(key) : sessionStorage.setItem(key, v); } catch { /* */ } }

async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}

function localWatch(keys, fn) {
  const run = () => fn();
  const onLocal = e => keys.includes(e.detail) && run();
  const onStorage = e => keys.includes(e.key) && run();
  window.addEventListener("nj-store", onLocal);
  window.addEventListener("storage", onStorage);
  run();
  return () => { window.removeEventListener("nj-store", onLocal); window.removeEventListener("storage", onStorage); };
}

const localStore = {
  async init() {
    if (!lsGet("nj_reviews", null)) {
      lsSet("nj_reviews", SEED_REVIEWS.map((r, i) => ({ ...r, id: "seed-" + i })));
    }
  },
  watchContent(cb) {
    return localWatch(["nj_menu", "nj_promos"], () =>
      cb({ menu: lsGet("nj_menu", DEFAULT_MENU), promos: lsGet("nj_promos", DEFAULT_PROMOS) }));
  },
  async saveMenu(items) { lsSet("nj_menu", items); },
  async savePromos(items) { lsSet("nj_promos", items); },

  async addOrder(order) {
    const orders = lsGet("nj_orders", []);
    const id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
    orders.push({ ...order, id, createdAt: Date.now() });
    lsSet("nj_orders", orders);
  },
  watchOrders(cb) {
    return localWatch(["nj_orders"], () =>
      cb(lsGet("nj_orders", []).sort((a, b) => b.createdAt - a.createdAt)));
  },
  async setOrderStatus(id, status) {
    lsSet("nj_orders", lsGet("nj_orders", []).map(o => o.id === id ? { ...o, status } : o));
  },
  async deleteOrder(id) {
    lsSet("nj_orders", lsGet("nj_orders", []).filter(o => o.id !== id));
  },

  watchReviews(cb) {
    return localWatch(["nj_reviews"], () =>
      cb(lsGet("nj_reviews", []).sort((a, b) => b.createdAt - a.createdAt)));
  },
  async addReview(r) {
    const list = lsGet("nj_reviews", []);
    list.push({ ...r, id: String(Date.now()), createdAt: Date.now() });
    lsSet("nj_reviews", list);
  },
  async deleteReview(id) {
    lsSet("nj_reviews", lsGet("nj_reviews", []).filter(r => r.id !== id));
  },

  _authCbs: [],
  onAuth(cb) { this._authCbs.push(cb); cb(ssGet("nj_admin") === "1"); },
  async login(email, password) {
    const h = await sha256(email.trim().toLowerCase() + ":" + password);
    if (h !== LOCAL_ADMIN_HASH) throw new Error("Correo o contraseña incorrectos.");
    ssSet("nj_admin", "1");
    this._authCbs.forEach(cb => cb(true));
  },
  async logout() { ssSet("nj_admin", null); this._authCbs.forEach(cb => cb(false)); },
};

/* ===================================================================
   Modo Firebase (pedidos en línea reales)
   =================================================================== */
function firebaseStore() {
  let fs, auth, db, authMod;

  const toMs = t => (t && typeof t.toMillis === "function") ? t.toMillis() : (t || Date.now());

  return {
    async init() {
      const base = `https://www.gstatic.com/firebasejs/${FB_VERSION}`;
      const [{ initializeApp }, fsMod, aMod] = await Promise.all([
        import(`${base}/firebase-app.js`),
        import(`${base}/firebase-firestore.js`),
        import(`${base}/firebase-auth.js`),
      ]);
      const app = initializeApp(FIREBASE_CONFIG);
      fs = fsMod; authMod = aMod;
      db = fs.getFirestore(app);
      auth = aMod.getAuth(app);
    },
    watchContent(cb) {
      let menu = DEFAULT_MENU, promos = DEFAULT_PROMOS;
      const emit = () => cb({ menu, promos });
      emit();
      const u1 = fs.onSnapshot(fs.doc(db, "content", "menu"), s => { if (s.exists()) menu = s.data().items; emit(); }, console.error);
      const u2 = fs.onSnapshot(fs.doc(db, "content", "promos"), s => { if (s.exists()) promos = s.data().items; emit(); }, console.error);
      return () => { u1(); u2(); };
    },
    async saveMenu(items) { await fs.setDoc(fs.doc(db, "content", "menu"), { items }); },
    async savePromos(items) { await fs.setDoc(fs.doc(db, "content", "promos"), { items }); },

    async addOrder(order) {
      await fs.addDoc(fs.collection(db, "orders"), { ...order, createdAt: fs.serverTimestamp() });
    },
    watchOrders(cb) {
      const q = fs.query(fs.collection(db, "orders"), fs.orderBy("createdAt", "desc"), fs.limit(200));
      return fs.onSnapshot(q, s => cb(s.docs.map(d => ({ ...d.data(), id: d.id, createdAt: toMs(d.data().createdAt) }))), console.error);
    },
    async setOrderStatus(id, status) { await fs.updateDoc(fs.doc(db, "orders", id), { status }); },
    async deleteOrder(id) { await fs.deleteDoc(fs.doc(db, "orders", id)); },

    watchReviews(cb) {
      const q = fs.query(fs.collection(db, "reviews"), fs.orderBy("createdAt", "desc"), fs.limit(100));
      return fs.onSnapshot(q, s => {
        if (s.empty) return cb(SEED_REVIEWS.map((r, i) => ({ ...r, id: "seed-" + i, seed: true })));
        cb(s.docs.map(d => ({ ...d.data(), id: d.id, createdAt: toMs(d.data().createdAt) })));
      }, console.error);
    },
    async addReview(r) {
      await fs.addDoc(fs.collection(db, "reviews"), { ...r, createdAt: fs.serverTimestamp() });
    },
    async deleteReview(id) { await fs.deleteDoc(fs.doc(db, "reviews", id)); },

    onAuth(cb) {
      authMod.onAuthStateChanged(auth, async user => {
        const isAdmin = !!user && user.email?.toLowerCase() === ADMIN_EMAIL;
        if (isAdmin) await this._seedReviews();
        cb(isAdmin);
      });
    },
    async _seedReviews() {
      try {
        const s = await fs.getDocs(fs.query(fs.collection(db, "reviews"), fs.limit(1)));
        if (!s.empty) return;
        await Promise.all(SEED_REVIEWS.map(r =>
          fs.addDoc(fs.collection(db, "reviews"), { ...r, createdAt: fs.Timestamp.fromMillis(r.createdAt) })));
      } catch (e) { console.warn("No se pudieron sembrar reseñas", e); }
    },
    async login(email, password) {
      if (email.trim().toLowerCase() !== ADMIN_EMAIL) throw new Error("Correo o contraseña incorrectos.");
      try {
        await authMod.signInWithEmailAndPassword(auth, email.trim(), password);
      } catch {
        throw new Error("Correo o contraseña incorrectos.");
      }
    },
    async logout() { await authMod.signOut(auth); },
  };
}

export const store = useFirebase ? firebaseStore() : localStore;

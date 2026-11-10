// Good Noura shop server: serves the website, takes orders, and runs the admin at /admin.
// Start it with `node server.js` (or double-click start-shop.bat), then open http://localhost:5173
// Everything is stored in data/goodnoura.db (SQLite, built into Node 22.5+). Back that file up.
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { DatabaseSync } = require("node:sqlite");

const ROOT = __dirname;
const PORT = +process.env.PORT || 5173;
const STATUSES = ["Pending", "Confirmed", "Shipped", "Out for Delivery", "Attempt", "Delivered", "Cancelled", "Returned"];
const PREPAID = 0.10;

fs.mkdirSync(path.join(ROOT, "data"), { recursive: true });
fs.mkdirSync(path.join(ROOT, "img", "uploads"), { recursive: true });
const db = new DatabaseSync(path.join(ROOT, "data", "goodnoura.db"));
db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, data TEXT NOT NULL, sort INTEGER DEFAULT 0, visible INTEGER DEFAULT 1, in_stock INTEGER DEFAULT 1);
  CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, created_at TEXT, name TEXT, phone TEXT, email TEXT, address TEXT, city TEXT,
    payment TEXT, items TEXT, subtotal INTEGER, discount INTEGER, promo TEXT, total INTEGER, status TEXT, notes TEXT, timeline TEXT);
  CREATE TABLE IF NOT EXISTS carts (token TEXT PRIMARY KEY, created_at TEXT, updated_at TEXT, name TEXT, phone TEXT, email TEXT, city TEXT, items TEXT, total INTEGER);
  CREATE TABLE IF NOT EXISTS reviews (id INTEGER PRIMARY KEY AUTOINCREMENT, created_at TEXT, name TEXT, city TEXT, product TEXT, text TEXT, published INTEGER DEFAULT 0, source TEXT);
  CREATE TABLE IF NOT EXISTS promos (code TEXT PRIMARY KEY, pct INTEGER, active INTEGER DEFAULT 1, uses INTEGER DEFAULT 0, created_at TEXT);
  CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);
  CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, expires INTEGER);
`);

// Shipping column (added after launch) and default shipping settings
if (!db.prepare("PRAGMA table_info(orders)").all().some(c => c.name === "shipping")) db.exec("ALTER TABLE orders ADD COLUMN shipping INTEGER DEFAULT 0");
db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('shippingFee', '350'), ('freeShipAt', '4000')").run();

const now = () => new Date().toISOString();
const J = s => (s ? JSON.parse(s) : null);

// First run: load products, reviews and settings from catalog.js
if (!db.prepare("SELECT COUNT(*) n FROM products").get().n) {
  const seed = require("./catalog.js");
  const ins = db.prepare("INSERT INTO products (id, data, sort, visible, in_stock) VALUES (?, ?, ?, 1, 1)");
  seed.products.forEach((p, i) => { const { inStock, ...data } = p; ins.run(p.id, JSON.stringify(data), i); });
  const rev = db.prepare("INSERT INTO reviews (created_at, name, city, product, text, published, source) VALUES (?, ?, ?, ?, ?, 1, 'goodnoura.com')");
  seed.reviews.forEach(r => rev.run(now(), r.name, r.city, r.product, r.text));
  const set = db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)");
  Object.entries(seed.settings).forEach(([k, v]) => set.run(k, JSON.stringify(v)));
}

const getSettings = () => Object.fromEntries(db.prepare("SELECT key, value FROM settings").all().map(r => [r.key, J(r.value)]));
const PRIVATE_SETTINGS = ["passHash"];
const publicSettings = () => { const s = getSettings(); PRIVATE_SETTINGS.forEach(k => delete s[k]); return s; };
const setSetting = (k, v) => db.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(k, JSON.stringify(v));

const productRow = r => ({ ...J(r.data), inStock: !!r.in_stock, visible: !!r.visible, sort: r.sort });
const shopProducts = () => db.prepare("SELECT * FROM products WHERE visible = 1 ORDER BY sort, rowid").all().map(productRow)
  .map(({ visible, sort, ...p }) => p);
function catalog() {
  const products = shopProducts();
  const ids = new Set(products.map(p => p.id));
  const reviews = db.prepare("SELECT name, city, product, text FROM reviews WHERE published = 1 ORDER BY id").all()
    .map(r => ({ ...r, product: ids.has(r.product) ? r.product : "" }));
  return { products, reviews, settings: publicSettings() };
}

// ---- Pricing (always worked out here, never trusted from the browser) ----
const onlinePrice = n => Math.round(n * (1 - PREPAID));
class Bad extends Error { constructor(m, code = 400) { super(m); this.code = code; } }
function priceItems(items, products, { strict = true } = {}) {
  if (!Array.isArray(items) || !items.length) throw new Bad("Your cart is empty.");
  const out = [];
  for (const it of items.slice(0, 50)) {
    const [id, ...rest] = String(it.key || "").split("|");
    const variant = rest.join("|");
    const p = products.find(x => x.id === id);
    if (!p || p.inStock === false) { if (strict) throw new Bad(`${p ? p.name : "An item in your cart"} is no longer available.`); continue; }
    const qty = Math.min(50, Math.max(1, parseInt(it.qty, 10) || 1));
    let price, online, size = null, choice = null;
    if (p.sizes && p.sizes.length) {
      const m = variant.match(/\d+\s?g\b/i);
      const s = p.sizes.find(z => m && z[0].toLowerCase() === m[0].toLowerCase().replace(/\s/, "")) || p.sizes[0];
      size = s[0]; price = s[1]; online = onlinePrice(price);
    } else { price = p.price; online = p.onlinePrice || onlinePrice(p.price); }
    if (p.choice && p.choice.opts) choice = p.choice.opts.find(o => variant.includes(o)) || p.choice.opts[0];
    const v = [size, choice ? `${choice} peanut butter` : null].filter(Boolean).join(" · ");
    out.push({ key: `${id}|${v}`, id, name: p.name, variant: v, qty, price, onlinePrice: online, img: p.img });
  }
  return out;
}
// Shipping: a flat fee, free when the full (cash-on-delivery) price of the jars reaches the threshold.
// The online saving and promo codes come off the jars only, never the shipping.
const totals = (lines, payment, pct = 0) => {
  const subtotal = lines.reduce((n, l) => n + l.qty * (payment === "online" ? l.onlinePrice : l.price), 0);
  const fullPrice = lines.reduce((n, l) => n + l.qty * l.price, 0);
  const discount = Math.round(subtotal * pct / 100);
  const s = getSettings(), fee = +s.shippingFee || 0, freeAt = +s.freeShipAt || 0;
  const shipping = lines.length && fee && !(freeAt && fullPrice >= freeAt) ? fee : 0;
  return { subtotal, discount, shipping, total: subtotal - discount + shipping };
};
const activePromo = code => code ? db.prepare("SELECT * FROM promos WHERE code = ? AND active = 1").get(String(code).trim().toUpperCase()) : null;

// ---- Admin login ----
const hashPass = (pw, salt = crypto.randomBytes(16).toString("hex")) => salt + ":" + crypto.scryptSync(pw, salt, 64).toString("hex");
const checkPass = (pw, stored) => {
  if (!stored) return false;
  const [salt, hash] = stored.split(":");
  const a = Buffer.from(hash, "hex"), b = crypto.scryptSync(pw, salt, 64);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};
const SESSION_DAYS = 14;
function newSession(res) {
  const token = crypto.randomBytes(32).toString("hex");
  db.prepare("INSERT INTO sessions (token, expires) VALUES (?, ?)").run(token, Date.now() + SESSION_DAYS * 864e5);
  res.setHeader("Set-Cookie", `gn_admin=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_DAYS * 86400}`);
}
const cookie = (req, name) => (req.headers.cookie || "").split(/;\s*/).map(c => c.split("=")).find(([k]) => k === name)?.[1];
function isAdmin(req) {
  const t = cookie(req, "gn_admin");
  if (!t) return false;
  const s = db.prepare("SELECT expires FROM sessions WHERE token = ?").get(t);
  return !!s && s.expires > Date.now();
}
let failed = { n: 0, until: 0 };   // slow down password guessing

// ---- HTTP helpers ----
const send = (res, code, body, type = "application/json; charset=utf-8") => {
  res.writeHead(code, { "Content-Type": type, "Cache-Control": "no-store" });
  res.end(type.startsWith("application/json") ? JSON.stringify(body) : body);
};
function readJSON(req, limit = 1e6) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on("data", c => { size += c.length; if (size > limit) { reject(new Bad("That's too large.", 413)); req.destroy(); } else chunks.push(c); });
    req.on("end", () => { try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks)) : {}); } catch { reject(new Bad("Bad request.")); } });
    req.on("error", reject);
  });
}
const str = (v, max = 300) => String(v ?? "").trim().slice(0, max);
const orderRow = r => r && ({ ...r, items: J(r.items), notes: J(r.notes) || [], timeline: J(r.timeline) || [] });
const newOrderId = () => { let id; do { id = "GN-" + (1000 + crypto.randomInt(9000)); } while (db.prepare("SELECT 1 FROM orders WHERE id = ?").get(id)); return id; };
const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
const csvCell = v => { const s = String(v ?? ""); return /^[=+\-@]/.test(s) ? `"'${s.replace(/"/g, '""')}"` : `"${s.replace(/"/g, '""')}"`; };

// ---- Shop API (public) ----
async function shopApi(req, res, url) {
  const route = `${req.method} ${url.pathname}`;
  if (route === "GET /api/promo") {
    const p = activePromo(url.searchParams.get("code"));
    return p ? send(res, 200, { code: p.code, pct: p.pct }) : send(res, 404, { error: "That code isn't valid." });
  }
  if (route === "POST /api/carts") {
    const b = await readJSON(req);
    const token = str(b.token, 64);
    if (!/^[a-z0-9-]{16,64}$/i.test(token)) throw new Bad("Bad cart.");
    const phone = str(b.phone, 30), email = str(b.email, 120);
    if (!phone.replace(/\D/g, "").length && !email.includes("@")) return send(res, 200, { ok: true });
    const lines = priceItems(b.items, shopProducts(), { strict: false });
    const total = totals(lines, "cod").total;
    db.prepare(`INSERT INTO carts (token, created_at, updated_at, name, phone, email, city, items, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(token) DO UPDATE SET updated_at = excluded.updated_at, name = excluded.name, phone = excluded.phone, email = excluded.email,
      city = excluded.city, items = excluded.items, total = excluded.total`)
      .run(token, now(), now(), str(b.name, 80), phone, email, str(b.city, 60), JSON.stringify(lines), total);
    return send(res, 200, { ok: true });
  }
  if (route === "POST /api/orders") {
    const b = await readJSON(req);
    const o = { name: str(b.name, 80), phone: str(b.phone, 30), email: str(b.email, 120), address: str(b.address, 300), city: str(b.city, 60) };
    if (!o.name || !o.address || !o.city) throw new Bad("Please fill in your name, address and city.");
    if (o.phone.replace(/\D/g, "").length < 10) throw new Bad("Please enter a valid WhatsApp number.");
    const payment = b.payment === "online" ? "online" : "cod";
    const lines = priceItems(b.items, shopProducts());
    const promo = activePromo(b.promo);
    const t = totals(lines, payment, promo ? promo.pct : 0);
    const id = newOrderId();
    db.prepare(`INSERT INTO orders (id, created_at, name, phone, email, address, city, payment, items, subtotal, discount, promo, shipping, total, status, notes, timeline)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', '[]', ?)`)
      .run(id, now(), o.name, o.phone, o.email, o.address, o.city, payment, JSON.stringify(lines), t.subtotal, t.discount, promo ? promo.code : "", t.shipping, t.total,
        JSON.stringify([{ at: now(), text: "Order placed on the website" }]));
    if (promo) db.prepare("UPDATE promos SET uses = uses + 1 WHERE code = ?").run(promo.code);
    if (b.cartToken) db.prepare("DELETE FROM carts WHERE token = ?").run(str(b.cartToken, 64));
    const s = publicSettings();
    return send(res, 201, { id, total: t.total, shipping: t.shipping, payment, bank: payment === "online"
      ? { bankName: s.bankName, accountTitle: s.accountTitle, accountNumber: s.accountNumber, iban: s.iban, payNote: s.payNote } : null });
  }
  if (route === "POST /api/reviews") {
    const b = await readJSON(req);
    const r = { name: str(b.name, 60), city: str(b.city, 40), product: str(b.product, 80), text: str(b.text, 800) };
    if (!r.name || r.text.length < 10) throw new Bad("Please add your name and a few words about the product.");
    db.prepare("INSERT INTO reviews (created_at, name, city, product, text, published, source) VALUES (?, ?, ?, ?, ?, 0, 'website')")
      .run(now(), r.name, r.city, r.product, r.text);
    return send(res, 201, { ok: true });
  }
  throw new Bad("Not found.", 404);
}

// ---- Admin API ----
async function adminApi(req, res, url) {
  const p = url.pathname.replace("/api/admin/", "");
  const route = `${req.method} ${p}`;
  const hasPass = !!getSettings().passHash;

  if (route === "GET status") return send(res, 200, { setup: hasPass, loggedIn: hasPass && isAdmin(req) });
  if (req.method !== "GET" && !(req.headers["content-type"] || "").includes("application/json")) throw new Bad("Bad request.");
  if (route === "POST setup") {
    if (hasPass) throw new Bad("A password is already set.", 403);
    const { password } = await readJSON(req);
    if (String(password || "").length < 8) throw new Bad("Use at least 8 characters.");
    setSetting("passHash", hashPass(String(password)));
    newSession(res); return send(res, 200, { ok: true });
  }
  if (route === "POST login") {
    if (Date.now() < failed.until) throw new Bad("Too many tries. Wait a minute and try again.", 429);
    const { password } = await readJSON(req);
    if (!checkPass(String(password || ""), getSettings().passHash)) {
      failed.n++; if (failed.n >= 5) { failed = { n: 0, until: Date.now() + 60e3 }; }
      throw new Bad("Wrong password.", 401);
    }
    failed.n = 0; newSession(res); return send(res, 200, { ok: true });
  }
  if (!isAdmin(req)) throw new Bad("Please log in.", 401);
  if (route === "POST logout") {
    db.prepare("DELETE FROM sessions WHERE token = ?").run(cookie(req, "gn_admin"));
    res.setHeader("Set-Cookie", "gn_admin=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0"); return send(res, 200, { ok: true });
  }
  if (route === "POST password") {
    const b = await readJSON(req);
    if (!checkPass(String(b.current || ""), getSettings().passHash)) throw new Bad("Your current password is wrong.");
    if (String(b.next || "").length < 8) throw new Bad("Use at least 8 characters.");
    setSetting("passHash", hashPass(String(b.next)));
    db.prepare("DELETE FROM sessions").run(); newSession(res); return send(res, 200, { ok: true });
  }

  // Orders
  if (route === "GET orders") return send(res, 200, db.prepare("SELECT * FROM orders ORDER BY created_at DESC").all().map(orderRow));
  if (route === "GET orders.csv") {
    const ids = (url.searchParams.get("ids") || "").split(",").filter(Boolean);
    const rows = db.prepare("SELECT * FROM orders ORDER BY created_at DESC").all().map(orderRow).filter(o => !ids.length || ids.includes(o.id));
    const head = ["Order", "Date", "Status", "Name", "WhatsApp", "Email", "Address", "City", "Payment", "Items", "Subtotal", "Promo", "Discount", "Shipping", "Total", "Notes"];
    const csv = [head, ...rows.map(o => [o.id, o.created_at, o.status, o.name, o.phone, o.email, o.address, o.city, o.payment === "online" ? "Online" : "COD",
      o.items.map(l => `${l.qty} x ${l.name}${l.variant ? ` (${l.variant})` : ""}`).join("; "), o.subtotal, o.promo, o.discount, o.shipping || 0, o.total, o.notes.map(n => n.text).join(" | ")])]
      .map(r => r.map(csvCell).join(",")).join("\r\n");
    res.writeHead(200, { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="good-noura-orders-${now().slice(0, 10)}.csv"` });
    return res.end("﻿" + csv);
  }
  if (route === "POST orders/bulk") {
    const { ids, status } = await readJSON(req);
    if (!STATUSES.includes(status) || !Array.isArray(ids)) throw new Bad("Bad request.");
    ids.forEach(id => setStatus(String(id), status));
    return send(res, 200, { ok: true });
  }
  let m;
  if ((m = p.match(/^orders\/([\w-]+)$/))) {
    const o = orderRow(db.prepare("SELECT * FROM orders WHERE id = ?").get(m[1]));
    if (!o) throw new Bad("Order not found.", 404);
    if (req.method === "DELETE") { db.prepare("DELETE FROM orders WHERE id = ?").run(o.id); return send(res, 200, { ok: true }); }
    if (req.method === "PATCH") {
      const b = await readJSON(req);
      if (b.status) { if (!STATUSES.includes(b.status)) throw new Bad("Unknown status."); setStatus(o.id, b.status); }
      if (b.note) {
        o.notes.push({ at: now(), text: str(b.note, 1000) });
        db.prepare("UPDATE orders SET notes = ? WHERE id = ?").run(JSON.stringify(o.notes), o.id);
      }
      if (b.customer) {
        const c = b.customer, f = { name: str(c.name, 80), phone: str(c.phone, 30), email: str(c.email, 120), address: str(c.address, 300), city: str(c.city, 60) };
        const tl = [...orderRow(db.prepare("SELECT timeline FROM orders WHERE id = ?").get(o.id)).timeline, { at: now(), text: "Customer details edited" }];
        db.prepare("UPDATE orders SET name = ?, phone = ?, email = ?, address = ?, city = ?, timeline = ? WHERE id = ?")
          .run(f.name, f.phone, f.email, f.address, f.city, JSON.stringify(tl), o.id);
      }
      if (b.event) {
        const tl = [...orderRow(db.prepare("SELECT timeline FROM orders WHERE id = ?").get(o.id)).timeline, { at: now(), text: str(b.event, 200) }];
        db.prepare("UPDATE orders SET timeline = ? WHERE id = ?").run(JSON.stringify(tl), o.id);
      }
      return send(res, 200, orderRow(db.prepare("SELECT * FROM orders WHERE id = ?").get(o.id)));
    }
  }

  // Abandoned carts
  if (route === "GET carts") return send(res, 200, db.prepare("SELECT * FROM carts ORDER BY updated_at DESC").all().map(c => ({ ...c, items: J(c.items) })));
  if ((m = p.match(/^carts\/([\w-]+)$/)) && req.method === "DELETE") { db.prepare("DELETE FROM carts WHERE token = ?").run(m[1]); return send(res, 200, { ok: true }); }

  // Products and bundles
  if (route === "GET products") return send(res, 200, db.prepare("SELECT * FROM products ORDER BY sort, rowid").all().map(productRow));
  if (route === "POST products") {
    const b = await readJSON(req);
    const id = slug(b.id || (b.data && b.data.name) || "");
    if (!id) throw new Bad("Give it a name.");
    if (db.prepare("SELECT 1 FROM products WHERE id = ?").get(id)) throw new Bad("That URL key is already used by another product.");
    const sort = (db.prepare("SELECT MAX(sort) m FROM products").get().m || 0) + 1;
    db.prepare("INSERT INTO products (id, data, sort, visible, in_stock) VALUES (?, ?, ?, ?, ?)")
      .run(id, JSON.stringify(cleanProduct({ ...b.data, id })), sort, b.visible === false ? 0 : 1, b.inStock === false ? 0 : 1);
    return send(res, 201, { id });
  }
  if ((m = p.match(/^products\/([\w-]+)$/))) {
    const row = db.prepare("SELECT * FROM products WHERE id = ?").get(m[1]);
    if (!row) throw new Bad("Product not found.", 404);
    if (req.method === "DELETE") { db.prepare("DELETE FROM products WHERE id = ?").run(m[1]); return send(res, 200, { ok: true }); }
    if (req.method === "PATCH") {
      const b = await readJSON(req);
      const data = b.data ? JSON.stringify(cleanProduct({ ...b.data, id: m[1] })) : row.data;
      db.prepare("UPDATE products SET data = ?, visible = ?, in_stock = ?, sort = ? WHERE id = ?").run(data,
        b.visible === undefined ? row.visible : b.visible ? 1 : 0, b.inStock === undefined ? row.in_stock : b.inStock ? 1 : 0,
        b.sort === undefined ? row.sort : parseInt(b.sort, 10) || 0, m[1]);
      return send(res, 200, { ok: true });
    }
  }
  if (route === "POST upload") {
    const { name, dataUrl } = await readJSON(req, 12e6);
    const mm = String(dataUrl || "").match(/^data:image\/(png|jpeg|webp|gif);base64,(.+)$/);
    if (!mm) throw new Bad("Upload a PNG, JPG, WebP or GIF image.");
    const file = `${Date.now()}-${slug(String(name || "image").replace(/\.\w+$/, "")) || "image"}.${mm[1] === "jpeg" ? "jpg" : mm[1]}`;
    fs.writeFileSync(path.join(ROOT, "img", "uploads", file), Buffer.from(mm[2], "base64"));
    return send(res, 201, { path: `img/uploads/${file}` });
  }

  // Reviews
  if (route === "GET reviews") return send(res, 200, db.prepare("SELECT * FROM reviews ORDER BY published, id DESC").all());
  if (route === "POST reviews") {
    const b = await readJSON(req);
    if (!str(b.name) || !str(b.text)) throw new Bad("Add a name and the review.");
    db.prepare("INSERT INTO reviews (created_at, name, city, product, text, published, source) VALUES (?, ?, ?, ?, ?, 1, 'admin')")
      .run(now(), str(b.name, 60), str(b.city, 40), str(b.product, 80), str(b.text, 800));
    return send(res, 201, { ok: true });
  }
  if ((m = p.match(/^reviews\/(\d+)$/))) {
    if (req.method === "DELETE") { db.prepare("DELETE FROM reviews WHERE id = ?").run(+m[1]); return send(res, 200, { ok: true }); }
    if (req.method === "PATCH") { const b = await readJSON(req); db.prepare("UPDATE reviews SET published = ? WHERE id = ?").run(b.published ? 1 : 0, +m[1]); return send(res, 200, { ok: true }); }
  }

  // Promo codes
  if (route === "GET promos") return send(res, 200, db.prepare("SELECT * FROM promos ORDER BY created_at DESC").all());
  if (route === "POST promos") {
    const b = await readJSON(req);
    const code = str(b.code, 30).toUpperCase().replace(/\s+/g, ""), pct = parseInt(b.pct, 10);
    if (!/^[A-Z0-9_-]{3,30}$/.test(code)) throw new Bad("Use 3–30 letters or numbers for the code.");
    if (!(pct >= 1 && pct <= 90)) throw new Bad("Discount must be between 1% and 90%.");
    if (db.prepare("SELECT 1 FROM promos WHERE code = ?").get(code)) throw new Bad("That code already exists.");
    db.prepare("INSERT INTO promos (code, pct, active, uses, created_at) VALUES (?, ?, 1, 0, ?)").run(code, pct, now());
    return send(res, 201, { ok: true });
  }
  if ((m = p.match(/^promos\/([\w-]+)$/))) {
    if (req.method === "DELETE") { db.prepare("DELETE FROM promos WHERE code = ?").run(m[1]); return send(res, 200, { ok: true }); }
    if (req.method === "PATCH") { const b = await readJSON(req); db.prepare("UPDATE promos SET active = ? WHERE code = ?").run(b.active ? 1 : 0, m[1]); return send(res, 200, { ok: true }); }
  }

  // Settings and backup
  if (route === "GET settings") return send(res, 200, publicSettings());
  if (route === "PUT settings") {
    const b = await readJSON(req);
    const allowed = { phone: 30, whatsapp: 20, email: 120, bankName: 80, accountTitle: 80, accountNumber: 40, iban: 40, payNote: 300 };
    Object.entries(allowed).forEach(([k, max]) => { if (b[k] !== undefined) setSetting(k, str(b[k], max)); });
    if (b.whatsapp !== undefined) setSetting("whatsapp", str(b.whatsapp, 20).replace(/\D/g, "").replace(/^0/, "92"));
    if (b.shippingFee !== undefined) setSetting("shippingFee", Math.min(5000, Math.max(0, parseInt(b.shippingFee, 10) || 0)));
    if (b.freeShipAt !== undefined) setSetting("freeShipAt", Math.min(1e6, Math.max(0, parseInt(b.freeShipAt, 10) || 0)));
    if (b.minJars !== undefined) setSetting("minJars", Math.min(12, Math.max(1, parseInt(b.minJars, 10) || 2)));
    return send(res, 200, publicSettings());
  }
  if (route === "GET backup") {
    db.exec("PRAGMA wal_checkpoint(TRUNCATE)");
    res.writeHead(200, { "Content-Type": "application/octet-stream", "Content-Disposition": `attachment; filename="goodnoura-backup-${now().slice(0, 10)}.db"` });
    return fs.createReadStream(path.join(ROOT, "data", "goodnoura.db")).pipe(res);
  }
  throw new Bad("Not found.", 404);
}

function setStatus(id, status) {
  const o = orderRow(db.prepare("SELECT status, timeline FROM orders WHERE id = ?").get(id));
  if (!o || o.status === status) return;
  o.timeline.push({ at: now(), text: `Status changed: ${o.status} → ${status}` });
  db.prepare("UPDATE orders SET status = ?, timeline = ? WHERE id = ?").run(status, JSON.stringify(o.timeline), id);
}

// Keep only the product fields the site uses, with the right types
function cleanProduct(d) {
  const p = { id: d.id, type: d.type === "bundles" ? "bundles" : "singles", name: str(d.name, 100) };
  if (!p.name) throw new Bad("Give it a name.");
  ["sub", "desc", "badge", "ribbon", "flavour", "ingredients", "allergen", "color", "img"].forEach(k => { const v = str(d[k], 2000); if (v) p[k] = v; });
  if (d.featured) p.featured = true;
  p.lids = Array.isArray(d.lids) && d.lids.length ? d.lids.map(x => str(x, 20)).slice(0, 6) : [p.color || "#d9a566"];
  if (!p.color) p.color = p.lids[0];
  if (!p.flavour && p.type === "singles") p.flavour = p.name.split(/[ ,]/)[0];
  if (Array.isArray(d.gallery) && d.gallery.length) p.gallery = d.gallery.filter(g => g && g[1]).map(([l, s]) => [str(l, 40) || "Photo", str(s, 500)]).slice(0, 12);
  if (d.sizeGallery && typeof d.sizeGallery === "object") {
    const sg = {};
    Object.entries(d.sizeGallery).slice(0, 6).forEach(([z, g]) => { if (Array.isArray(g) && g.length) sg[str(z, 20)] = g.filter(x => x && x[1]).map(([l, s]) => [str(l, 40) || "Photo", str(s, 500)]).slice(0, 12); });
    if (Object.keys(sg).length) p.sizeGallery = sg;
  }
  if (p.type === "singles") {
    p.sizes = (d.sizes || []).filter(s => s && s[0] && +s[1] > 0).map(([z, v, img]) => img && str(img, 500) ? [str(z, 20), Math.round(+v), str(img, 500)] : [str(z, 20), Math.round(+v)]);
    if (!p.sizes.length) throw new Bad("Add at least one size with a price.");
  } else {
    p.price = Math.round(+d.price); p.onlinePrice = Math.round(+d.onlinePrice) || onlinePrice(p.price); p.separate = Math.round(+d.separate) || p.price;
    if (!(p.price > 0)) throw new Bad("Add the bundle price.");
    p.items = (d.items || []).filter(i => i && i[0]).map(([n, w]) => [str(n, 80), str(w, 20)]);
    p.contains = (d.contains || []).map(x => str(x, 80)).filter(Boolean);
    if (d.choice && d.choice.opts && d.choice.opts.length) p.choice = { label: str(d.choice.label, 60) || "Choose", opts: d.choice.opts.map(o => str(o, 40)).filter(Boolean) };
  }
  return p;
}

// ---- Static files ----
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".png": "image/png", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif", ".svg": "image/svg+xml", ".ico": "image/x-icon" };
const BLOCKED = /^\/(data|backups|server\.js|start-shop\.bat|node_modules)(\/|$)|\/\./;
function serveStatic(req, res, url) {
  let u = decodeURIComponent(url.pathname);
  if (u === "/") u = "/index.html";
  if (u === "/admin" || u === "/admin/") u = "/admin.html";
  if (u === "/catalog.js") return send(res, 200, `window.GN_CATALOG = ${JSON.stringify(catalog())};`, "text/javascript; charset=utf-8");
  const fp = path.join(ROOT, path.normalize(u));
  if (BLOCKED.test(u) || !fp.startsWith(ROOT + path.sep) || !TYPES[path.extname(fp).toLowerCase()]) return send(res, 404, "Not found", "text/plain");
  fs.readFile(fp, (e, d) => {
    if (e) return send(res, 404, "Not found", "text/plain");
    res.writeHead(200, { "Content-Type": TYPES[path.extname(fp).toLowerCase()], "Cache-Control": "no-cache" });
    res.end(d);
  });
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  try {
    if (url.pathname.startsWith("/api/admin/")) return await adminApi(req, res, url);
    if (url.pathname.startsWith("/api/")) return await shopApi(req, res, url);
    if (req.method !== "GET" && req.method !== "HEAD") return send(res, 405, { error: "Not allowed." });
    serveStatic(req, res, url);
  } catch (e) {
    if (!(e instanceof Bad)) console.error(e);
    if (!res.headersSent) send(res, e.code || 500, { error: e instanceof Bad ? e.message : "Something went wrong on the server." });
  }
}).listen(PORT, () => console.log(`Good Noura is running: shop http://localhost:${PORT}  ·  admin http://localhost:${PORT}/admin`));

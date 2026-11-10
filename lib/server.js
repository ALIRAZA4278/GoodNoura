// Shared server-side pieces: database client, errors, pricing and helpers. Used only by the API routes.
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

export const STATUSES = ["Pending", "Confirmed", "Shipped", "Out for Delivery", "Attempt", "Delivered", "Cancelled", "Returned"];
export const PREPAID = 0.10;
export const IMAGE_BUCKET = "product-images";

let client;
export function sb() {
  if (!client) {
    const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are not set.");
    client = createClient(url, key, { auth: { persistSession: false } });
  }
  return client;
}

export class Bad extends Error { constructor(m, code = 400) { super(m); this.code = code; } }

// Unwrap a Supabase response: throw on error, return the data.
export async function q(query) {
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

export const now = () => new Date().toISOString();
export const str = (v, max = 300) => String(v ?? "").trim().slice(0, max);
export const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

export function json(body, status = 200, headers = {}) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });
}
export async function readJSON(req, limit = 1e6) {
  const text = await req.text();
  if (text.length > limit) throw new Bad("That's too large.", 413);
  try { return text ? JSON.parse(text) : {}; } catch { throw new Bad("Bad request."); }
}
// Run a route handler, turning thrown errors into JSON responses.
export const handle = fn => async (req, ctx) => {
  try { return await fn(req, ctx); }
  catch (e) {
    if (!(e instanceof Bad)) console.error(e);
    return json({ error: e instanceof Bad ? e.message : "Something went wrong on the server." }, e.code || 500);
  }
};

// ---- Settings ----
export const PRIVATE_SETTINGS = ["passHash"];
export async function getSettings() {
  const rows = await q(sb().from("settings").select("key, value"));
  return Object.fromEntries(rows.map(r => [r.key, r.value]));
}
export const withoutPrivate = s => { const o = { ...s }; PRIVATE_SETTINGS.forEach(k => delete o[k]); return o; };
export async function publicSettings() { return withoutPrivate(await getSettings()); }
export const setSetting = (key, value) => q(sb().from("settings").upsert({ key, value }));

// ---- Products ----
export const productRow = r => ({ ...r.data, inStock: !!r.in_stock, visible: !!r.visible, sort: r.sort });
export const allProductRows = () => q(sb().from("products").select("*").order("sort").order("id"));
export async function shopProducts() {
  const rows = await q(sb().from("products").select("*").eq("visible", true).order("sort").order("id"));
  return rows.map(productRow).map(({ visible, sort, ...p }) => p);
}
export async function catalog() {
  const [products, reviewRows, settings] = await Promise.all([
    shopProducts(),
    q(sb().from("reviews").select("name, city, product, text").eq("published", true).order("id")),
    publicSettings(),
  ]);
  const ids = new Set(products.map(p => p.id));
  const reviews = reviewRows.map(r => ({ ...r, product: ids.has(r.product) ? r.product : "" }));
  return { products, reviews, settings };
}

// ---- Pricing (always worked out here, never trusted from the browser) ----
export const onlinePrice = n => Math.round(n * (1 - PREPAID));
export function priceItems(items, products, { strict = true } = {}) {
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
export function totals(lines, payment, settings, pct = 0) {
  const subtotal = lines.reduce((n, l) => n + l.qty * (payment === "online" ? l.onlinePrice : l.price), 0);
  const fullPrice = lines.reduce((n, l) => n + l.qty * l.price, 0);
  const discount = Math.round(subtotal * pct / 100);
  const fee = +settings.shippingFee || 0, freeAt = +settings.freeShipAt || 0;
  const shipping = lines.length && fee && !(freeAt && fullPrice >= freeAt) ? fee : 0;
  return { subtotal, discount, shipping, total: subtotal - discount + shipping };
}
export async function activePromo(code) {
  if (!code) return null;
  return q(sb().from("promos").select("*").eq("code", String(code).trim().toUpperCase()).eq("active", true).maybeSingle());
}

// ---- Admin login ----
export const hashPass = (pw, salt = crypto.randomBytes(16).toString("hex")) => salt + ":" + crypto.scryptSync(pw, salt, 64).toString("hex");
export const checkPass = (pw, stored) => {
  if (!stored) return false;
  const [salt, hash] = stored.split(":");
  const a = Buffer.from(hash, "hex"), b = crypto.scryptSync(pw, salt, 64);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};
// The admin signs in with this email plus the password. Override with the ADMIN_EMAIL environment variable.
export const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "info@goodnoura.com").trim().toLowerCase();
export const emailOk = email => {
  const a = Buffer.from(String(email || "").trim().toLowerCase()), b = Buffer.from(ADMIN_EMAIL);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};
export const SESSION_DAYS = 14;
const cookieAttrs = () => `HttpOnly; SameSite=Strict; Path=/${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
export async function newSessionCookie() {
  const token = crypto.randomBytes(32).toString("hex");
  await q(sb().from("sessions").insert({ token, expires: Date.now() + SESSION_DAYS * 864e5 }));
  return `gn_admin=${token}; ${cookieAttrs()}; Max-Age=${SESSION_DAYS * 86400}`;
}
export const clearedCookie = () => `gn_admin=; ${cookieAttrs()}; Max-Age=0`;
export const cookieOf = (req, name) => (req.headers.get("cookie") || "").split(/;\s*/).map(c => c.split("=")).find(([k]) => k === name)?.[1];
export async function isAdmin(req) {
  const t = cookieOf(req, "gn_admin");
  if (!t) return false;
  const s = await q(sb().from("sessions").select("expires").eq("token", t).maybeSingle());
  return !!s && s.expires > Date.now();
}

export const csvCell = v => { const s = String(v ?? ""); return /^[=+\-@]/.test(s) ? `"'${s.replace(/"/g, '""')}"` : `"${s.replace(/"/g, '""')}"`; };

// Keep only the product fields the site uses, with the right types
export function cleanProduct(d) {
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

// Insta World courier (one-be.instaworld.pk). Server only: the API key must never reach the browser.
// Mirrors what the Secret Hour admin does: book a shipment, track it, cancel it, download the AWB, export a bulk CSV.
import { Bad } from "@/lib/server";

const API = "https://one-be.instaworld.pk/logistics/v1";
const CITIES_URL = "https://one-be.instaworld.pk/logistics/cities";

const apiKey = () => {
  const k = process.env.INSTAWORLD_API_KEY;
  if (!k) throw new Bad("Insta World isn't set up on this server (INSTAWORLD_API_KEY is missing).", 500);
  return k;
};

// Insta World reports problems as {"field": ["message"]} or {"message": "..."}; turn that into one readable sentence.
export function readableError(r) {
  if (!r) return "Insta World didn't answer.";
  if (typeof r === "string") return r;
  if (Array.isArray(r)) return r.map(readableError).join("; ");
  if (typeof r === "object") {
    if (typeof r.message === "string") return r.message;
    if (Array.isArray(r.message) && r.message.length) return readableError(r.message);
    return Object.entries(r).map(([k, v]) => `${k.replace(/_/g, " ")}: ${Array.isArray(v) ? v.join(", ") : readableError(v)}`).join("; ") || "Insta World refused the request.";
  }
  return String(r);
}

async function call(action, body) {
  let res;
  try {
    res = await fetch(`${API}/${action}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: apiKey(), ...body }), signal: AbortSignal.timeout(20000),
    });
  } catch (e) { throw new Bad("Couldn't reach Insta World. Try again in a minute.", 502); }
  const result = await res.json().catch(() => null);
  if (!res.ok) throw new Bad(readableError(result), res.status === 400 ? 422 : 502);
  return result;
}

// ---- Cities (Insta World only accepts its own spelling of a city) ----
let cityCache = { at: 0, list: [] };
export async function getCities() {
  if (cityCache.list.length && Date.now() - cityCache.at < 6 * 36e5) return cityCache.list;
  const res = await fetch(CITIES_URL, { signal: AbortSignal.timeout(20000) }).catch(() => null);
  const data = res && res.ok ? await res.json().catch(() => null) : null;
  if (!Array.isArray(data) || !data.length) { if (cityCache.list.length) return cityCache.list; throw new Bad("Couldn't load the Insta World city list.", 502); }
  cityCache = { at: Date.now(), list: data.map(c => String(c.name || "").trim()).filter(Boolean).sort() };
  return cityCache.list;
}
const norm = s => String(s || "").toUpperCase().replace(/[^A-Z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
// The Insta World spelling for what the customer typed, or null when we can't tell
export function matchCity(input, cities) {
  const n = norm(input);
  if (!n) return null;
  const exact = cities.find(c => norm(c) === n);
  if (exact) return exact;
  const starts = cities.filter(c => norm(c).startsWith(n + " ") || norm(c) === n);
  return starts.length === 1 ? starts[0] : null;
}

// ---- Building the shipment from one of our orders ----
const gramsOf = l => { const m = String(l.variant || "").match(/(\d+)\s?g\b/i); return m ? +m[1] : 0; };
// Weight of one jar: its contents plus packaging; 0.5 kg when the size isn't known (same default Secret Hour uses)
export const itemKg = l => { const g = gramsOf(l); return g ? Math.max(0.3, Math.round((g + 150) / 10) / 100) : 0.5; };
const unitPaid = (o, l) => (o.payment === "online" ? l.onlinePrice : l.price) || 0;
const splitName = full => { const p = String(full || "").trim().split(/\s+/); return [p[0] || "", p.slice(1).join(" ")]; };

export function buildShipment(o, city) {
  const [first, last] = splitName(o.name);
  return {
    ref_no: o.id,
    consignee_first_name: first, consignee_last_name: last,
    consignee_email: o.email || "", consignee_phone: o.phone || "",
    consignee_address: o.address || "", consignee_city: city,
    amount: o.total || 0,                                   // cash to collect (the full total, as in Secret Hour)
    financial_status: o.payment === "online" ? "paid" : "cod",
    remarks: `Good Noura order ${o.id}`,
    items: (o.items || []).map(l => ({ title: `${l.name}${l.variant ? ` (${l.variant})` : ""}`, price: unitPaid(o, l), quantity: l.qty || 1, sku: l.id || "", kg: itemKg(l) })),
  };
}

export async function createShipment(shipment) {
  const r = await call("createShipment", shipment);
  if (!r || !r.tracking_number) throw new Bad(readableError(r) || "Insta World didn't return a tracking number.", 502);
  return String(r.tracking_number);
}
export const trackShipment = tracking => call("trackShipment", { tracking_number: tracking });
export async function cancelShipment(tracking) {
  const r = await call("cancelShipment", { tracking_number: tracking });
  if (!r || !r.status) throw new Bad(readableError(r), 422);
  return r;
}

// The airway bill (PDF). Insta World wants the key as a URL token, so the server fetches it and the browser never sees the key.
export async function fetchAwb(tracking) {
  const res = await fetch(`${API}/awb?tracking_number=${encodeURIComponent(tracking)}&token=${encodeURIComponent(apiKey())}`, { signal: AbortSignal.timeout(30000) }).catch(() => null);
  if (!res) throw new Bad("Couldn't reach Insta World.", 502);
  const type = res.headers.get("content-type") || "";
  if (!res.ok || /text\/html/.test(type)) throw new Bad("Insta World has no airway bill for this tracking number.", 404);
  return new Response(await res.arrayBuffer(), { headers: { "Content-Type": type || "application/pdf", "Content-Disposition": `inline; filename="awb-${tracking}.pdf"`, "Cache-Control": "no-store" } });
}

// ---- Bulk upload file (the same columns the Secret Hour export uses) ----
const cell = v => { const s = String(v ?? ""); return /^[=+\-@]/.test(s) ? `"'${s.replace(/"/g, '""')}"` : `"${s.replace(/"/g, '""')}"`; };
export function bulkCsv(orders, cities) {
  const head = ["ref_no", "consignee_first_name", "consignee_last_name", "consignee_email", "consignee_phone", "consignee_city", "consignee_address", "amount", "financial_status", "remarks", "item_title", "item_detail", "item_price", "item_quantity", "item_sku", "item_kg", "open_parcel"];
  const rows = orders.flatMap(o => {
    const [first, last] = splitName(o.name);
    const city = matchCity(o.city, cities) || norm(o.city) || "LAHORE";
    const items = o.items && o.items.length ? o.items : [{ name: "Order", variant: "", qty: 1, price: o.total, onlinePrice: o.total, id: "" }];
    return items.map((l, i) => [o.id, i ? "" : first, i ? "" : last, i ? "" : o.email || "", i ? "" : o.phone || "", i ? "" : city, i ? "" : o.address || "", i ? "" : o.total || 0,
      i ? "" : o.payment === "online" ? "paid" : "cod", i ? "" : `Good Noura order ${o.id}`, l.name, l.variant || "", unitPaid(o, l), l.qty || 1, l.id || "", itemKg(l), "no"]);
  });
  return "﻿" + [head, ...rows].map(r => r.map(cell).join(",")).join("\r\n");
}

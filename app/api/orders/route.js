import crypto from "node:crypto";
import { notifyOrder } from "@/lib/email";
import { activePromo, Bad, handle, json, now, priceItems, publicSettings, q, readJSON, sb, shopProducts, str, totals } from "@/lib/server";

export const dynamic = "force-dynamic";

async function newOrderId() {
  for (;;) {
    const id = "GN-" + (1000 + crypto.randomInt(9000));
    if (!(await q(sb().from("orders").select("id").eq("id", id).maybeSingle()))) return id;
  }
}

export const POST = handle(async req => {
  const b = await readJSON(req);
  const o = { name: str(b.name, 80), phone: str(b.phone, 30), email: str(b.email, 120), address: str(b.address, 300), city: str(b.city, 60) };
  if (!o.name || !o.address || !o.city) throw new Bad("Please fill in your name, address and city.");
  if (o.phone.replace(/\D/g, "").length < 10) throw new Bad("Please enter a valid WhatsApp number.");
  const payment = b.payment === "online" ? "online" : "cod";
  const [products, s] = await Promise.all([shopProducts(), publicSettings()]);
  const lines = priceItems(b.items, products);
  const promo = await activePromo(b.promo);
  const t = totals(lines, payment, s, promo ? promo.pct : 0);
  const id = await newOrderId();
  await q(sb().from("orders").insert({
    id, created_at: now(), ...o, payment, items: lines, subtotal: t.subtotal, discount: t.discount, promo: promo ? promo.code : "",
    shipping: t.shipping, total: t.total, status: "Pending", notes: [], timeline: [{ at: now(), text: "Order placed on the website" }],
  }));
  if (promo) await q(sb().from("promos").update({ uses: (promo.uses || 0) + 1 }).eq("code", promo.code));
  if (b.cartToken) await q(sb().from("carts").delete().eq("token", str(b.cartToken, 64)));
  // Email the shop (always) and the customer (if they gave an email). Failures are logged, never shown to the shopper.
  await notifyOrder({ id, ...o, payment, items: lines, subtotal: t.subtotal, discount: t.discount, promo: promo ? promo.code : "", shipping: t.shipping, total: t.total }, s);
  return json({
    id, total: t.total, shipping: t.shipping, payment,
    bank: payment === "online" ? { bankName: s.bankName, accountTitle: s.accountTitle, accountNumber: s.accountNumber, iban: s.iban, payNote: s.payNote } : null,
  }, 201);
});

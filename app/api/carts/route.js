import { Bad, handle, json, now, priceItems, publicSettings, q, readJSON, sb, shopProducts, str, totals } from "@/lib/server";
import { allow, clientIp } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

// Remembers a cart once the shopper has typed a phone or email, so abandoned carts can be followed up.
export const POST = handle(async req => {
  if (!allow("cart:" + clientIp(req), 120, 600000)) throw new Bad("Too many requests.", 429);
  const b = await readJSON(req);
  const token = str(b.token, 64);
  if (!/^[a-z0-9-]{16,64}$/i.test(token)) throw new Bad("Bad cart.");
  const phone = str(b.phone, 30), email = str(b.email, 120);
  if (!phone.replace(/\D/g, "").length && !email.includes("@")) return json({ ok: true });
  const lines = priceItems(b.items, await shopProducts(), { strict: false });
  const total = totals(lines, "cod", await publicSettings()).total;
  const existing = await q(sb().from("carts").select("created_at").eq("token", token).maybeSingle());
  await q(sb().from("carts").upsert({ token, created_at: existing?.created_at || now(), updated_at: now(), name: str(b.name, 80), phone, email, city: str(b.city, 60), items: lines, total }));
  return json({ ok: true });
});

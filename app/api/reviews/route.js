import { Bad, handle, json, now, q, readJSON, sb, str } from "@/lib/server";

export const dynamic = "force-dynamic";

// Customer reviews wait for approval in the admin before they show on the site.
export const POST = handle(async req => {
  const b = await readJSON(req);
  const r = { name: str(b.name, 60), city: str(b.city, 40), product: str(b.product, 80), text: str(b.text, 800) };
  if (!r.name || r.text.length < 10) throw new Bad("Please add your name and a few words about the product.");
  await q(sb().from("reviews").insert({ created_at: now(), ...r, published: false, source: "website" }));
  return json({ ok: true }, 201);
});

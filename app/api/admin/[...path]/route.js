import {
  Bad, IMAGE_BUCKET, STATUSES, allProductRows, checkPass, cleanProduct, clearedCookie, cookieOf, csvCell, emailOk, getSettings, handle, hashPass, isAdmin, json,
  newSessionCookie, now, productRow, publicSettings, q, readJSON, sb, setSetting, slug, str, withoutPrivate,
} from "@/lib/server";

export const dynamic = "force-dynamic";

let failed = { n: 0, until: 0 };   // slows down password guessing (per server instance)

const orderById = id => q(sb().from("orders").select("*").eq("id", id).maybeSingle());

async function setStatus(id, status) {
  const o = await q(sb().from("orders").select("status, timeline").eq("id", id).maybeSingle());
  if (!o || o.status === status) return;
  const timeline = [...(o.timeline || []), { at: now(), text: `Status changed: ${o.status} → ${status}` }];
  await q(sb().from("orders").update({ status, timeline }).eq("id", id));
}

async function admin(req, ctx) {
  const { path: parts } = await ctx.params;
  const p = parts.join("/");
  const url = new URL(req.url);
  const route = `${req.method} ${p}`;
  const settings = await getSettings();
  const hasPass = !!settings.passHash;
  let m;

  if (route === "GET status") return json({ setup: hasPass, loggedIn: hasPass && await isAdmin(req) });
  if (req.method !== "GET" && !(req.headers.get("content-type") || "").includes("application/json")) throw new Bad("Bad request.");
  if (route === "POST setup") {
    if (hasPass) throw new Bad("A password is already set.", 403);
    const { email, password } = await readJSON(req);
    if (!emailOk(email)) throw new Bad("Use the admin email to set up the admin.", 403);
    if (String(password || "").length < 8) throw new Bad("Use at least 8 characters.");
    await setSetting("passHash", hashPass(String(password)));
    return json({ ok: true }, 200, { "Set-Cookie": await newSessionCookie() });
  }
  if (route === "POST login") {
    if (Date.now() < failed.until) throw new Bad("Too many tries. Wait a minute and try again.", 429);
    const { email, password } = await readJSON(req);
    // Always check both, so the answer doesn't reveal which one was wrong.
    const goodPass = checkPass(String(password || ""), settings.passHash), goodEmail = emailOk(email);
    if (!goodPass || !goodEmail) {
      failed.n++; if (failed.n >= 5) failed = { n: 0, until: Date.now() + 60e3 };
      throw new Bad("Wrong email or password.", 401);
    }
    failed.n = 0;
    return json({ ok: true }, 200, { "Set-Cookie": await newSessionCookie() });
  }
  if (!(await isAdmin(req))) throw new Bad("Please log in.", 401);
  if (route === "POST logout") {
    await q(sb().from("sessions").delete().eq("token", cookieOf(req, "gn_admin")));
    return json({ ok: true }, 200, { "Set-Cookie": clearedCookie() });
  }
  if (route === "POST password") {
    const b = await readJSON(req);
    if (!checkPass(String(b.current || ""), settings.passHash)) throw new Bad("Your current password is wrong.");
    if (String(b.next || "").length < 8) throw new Bad("Use at least 8 characters.");
    await setSetting("passHash", hashPass(String(b.next)));
    await q(sb().from("sessions").delete().neq("token", ""));
    return json({ ok: true }, 200, { "Set-Cookie": await newSessionCookie() });
  }

  // Orders
  if (route === "GET orders") return json(await q(sb().from("orders").select("*").order("created_at", { ascending: false })));
  if (route === "GET orders.csv") {
    const ids = (url.searchParams.get("ids") || "").split(",").filter(Boolean);
    const rows = (await q(sb().from("orders").select("*").order("created_at", { ascending: false }))).filter(o => !ids.length || ids.includes(o.id));
    const head = ["Order", "Date", "Status", "Name", "WhatsApp", "Email", "Address", "City", "Payment", "Items", "Subtotal", "Promo", "Discount", "Shipping", "Total", "Notes"];
    const csv = [head, ...rows.map(o => [o.id, o.created_at, o.status, o.name, o.phone, o.email, o.address, o.city, o.payment === "online" ? "Online" : "COD",
      (o.items || []).map(l => `${l.qty} x ${l.name}${l.variant ? ` (${l.variant})` : ""}`).join("; "), o.subtotal, o.promo, o.discount, o.shipping || 0, o.total, (o.notes || []).map(n => n.text).join(" | ")])]
      .map(r => r.map(csvCell).join(",")).join("\r\n");
    return new Response("﻿" + csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="good-noura-orders-${now().slice(0, 10)}.csv"`, "Cache-Control": "no-store" } });
  }
  if (route === "POST orders/bulk") {
    const { ids, status } = await readJSON(req);
    if (!STATUSES.includes(status) || !Array.isArray(ids)) throw new Bad("Bad request.");
    for (const id of ids) await setStatus(String(id), status);
    return json({ ok: true });
  }
  if ((m = p.match(/^orders\/([\w-]+)$/))) {
    const o = await orderById(m[1]);
    if (!o) throw new Bad("Order not found.", 404);
    if (req.method === "DELETE") { await q(sb().from("orders").delete().eq("id", o.id)); return json({ ok: true }); }
    if (req.method === "PATCH") {
      const b = await readJSON(req);
      if (b.status) { if (!STATUSES.includes(b.status)) throw new Bad("Unknown status."); await setStatus(o.id, b.status); }
      const fresh = await orderById(o.id);
      const upd = {};
      if (b.note) upd.notes = [...(fresh.notes || []), { at: now(), text: str(b.note, 1000) }];
      const timeline = [...(fresh.timeline || [])];
      if (b.customer) {
        const c = b.customer;
        Object.assign(upd, { name: str(c.name, 80), phone: str(c.phone, 30), email: str(c.email, 120), address: str(c.address, 300), city: str(c.city, 60) });
        timeline.push({ at: now(), text: "Customer details edited" });
      }
      if (b.event) timeline.push({ at: now(), text: str(b.event, 200) });
      if (timeline.length !== (fresh.timeline || []).length) upd.timeline = timeline;
      if (Object.keys(upd).length) await q(sb().from("orders").update(upd).eq("id", o.id));
      return json(await orderById(o.id));
    }
  }

  // Abandoned carts
  if (route === "GET carts") return json(await q(sb().from("carts").select("*").order("updated_at", { ascending: false })));
  if ((m = p.match(/^carts\/([\w-]+)$/)) && req.method === "DELETE") { await q(sb().from("carts").delete().eq("token", m[1])); return json({ ok: true }); }

  // Products and bundles
  if (route === "GET products") return json((await allProductRows()).map(productRow));
  if (route === "POST products") {
    const b = await readJSON(req);
    const id = slug(b.id || (b.data && b.data.name) || "");
    if (!id) throw new Bad("Give it a name.");
    if (await q(sb().from("products").select("id").eq("id", id).maybeSingle())) throw new Bad("That URL key is already used by another product.");
    const last = await q(sb().from("products").select("sort").order("sort", { ascending: false }).limit(1));
    const sort = ((last[0] && last[0].sort) || 0) + 1;
    await q(sb().from("products").insert({ id, data: cleanProduct({ ...b.data, id }), sort, visible: b.visible !== false, in_stock: b.inStock !== false }));
    return json({ id }, 201);
  }
  if ((m = p.match(/^products\/([\w-]+)$/))) {
    const row = await q(sb().from("products").select("*").eq("id", m[1]).maybeSingle());
    if (!row) throw new Bad("Product not found.", 404);
    if (req.method === "DELETE") { await q(sb().from("products").delete().eq("id", m[1])); return json({ ok: true }); }
    if (req.method === "PATCH") {
      const b = await readJSON(req);
      await q(sb().from("products").update({
        data: b.data ? cleanProduct({ ...b.data, id: m[1] }) : row.data,
        visible: b.visible === undefined ? row.visible : !!b.visible,
        in_stock: b.inStock === undefined ? row.in_stock : !!b.inStock,
        sort: b.sort === undefined ? row.sort : parseInt(b.sort, 10) || 0,
      }).eq("id", m[1]));
      return json({ ok: true });
    }
  }
  if (route === "POST upload") {
    const { name, dataUrl } = await readJSON(req, 12e6);
    const mm = String(dataUrl || "").match(/^data:image\/(png|jpeg|webp|gif);base64,(.+)$/);
    if (!mm) throw new Bad("Upload a PNG, JPG, WebP or GIF image.");
    const file = `${Date.now()}-${slug(String(name || "image").replace(/\.\w+$/, "")) || "image"}.${mm[1] === "jpeg" ? "jpg" : mm[1]}`;
    const { error } = await sb().storage.from(IMAGE_BUCKET).upload(file, Buffer.from(mm[2], "base64"), { contentType: `image/${mm[1]}`, cacheControl: "31536000" });
    if (error) throw new Error(error.message);
    return json({ path: sb().storage.from(IMAGE_BUCKET).getPublicUrl(file).data.publicUrl }, 201);
  }

  // Reviews
  if (route === "GET reviews") return json(await q(sb().from("reviews").select("*").order("published").order("id", { ascending: false })));
  if (route === "POST reviews") {
    const b = await readJSON(req);
    if (!str(b.name) || !str(b.text)) throw new Bad("Add a name and the review.");
    await q(sb().from("reviews").insert({ created_at: now(), name: str(b.name, 60), city: str(b.city, 40), product: str(b.product, 80), text: str(b.text, 800), published: true, source: "admin" }));
    return json({ ok: true }, 201);
  }
  if ((m = p.match(/^reviews\/(\d+)$/))) {
    if (req.method === "DELETE") { await q(sb().from("reviews").delete().eq("id", +m[1])); return json({ ok: true }); }
    if (req.method === "PATCH") { const b = await readJSON(req); await q(sb().from("reviews").update({ published: !!b.published }).eq("id", +m[1])); return json({ ok: true }); }
  }

  // Promo codes
  if (route === "GET promos") return json(await q(sb().from("promos").select("*").order("created_at", { ascending: false })));
  if (route === "POST promos") {
    const b = await readJSON(req);
    const code = str(b.code, 30).toUpperCase().replace(/\s+/g, ""), pct = parseInt(b.pct, 10);
    if (!/^[A-Z0-9_-]{3,30}$/.test(code)) throw new Bad("Use 3–30 letters or numbers for the code.");
    if (!(pct >= 1 && pct <= 90)) throw new Bad("Discount must be between 1% and 90%.");
    if (await q(sb().from("promos").select("code").eq("code", code).maybeSingle())) throw new Bad("That code already exists.");
    await q(sb().from("promos").insert({ code, pct, active: true, uses: 0, created_at: now() }));
    return json({ ok: true }, 201);
  }
  if ((m = p.match(/^promos\/([\w-]+)$/))) {
    if (req.method === "DELETE") { await q(sb().from("promos").delete().eq("code", m[1])); return json({ ok: true }); }
    if (req.method === "PATCH") { const b = await readJSON(req); await q(sb().from("promos").update({ active: !!b.active }).eq("code", m[1])); return json({ ok: true }); }
  }

  // Settings and backup
  if (route === "GET settings") return json(withoutPrivate(settings));
  if (route === "PUT settings") {
    const b = await readJSON(req);
    const allowed = { phone: 30, whatsapp: 20, email: 120, bankName: 80, accountTitle: 80, accountNumber: 40, iban: 40, payNote: 300 };
    for (const [k, max] of Object.entries(allowed)) if (b[k] !== undefined) await setSetting(k, str(b[k], max));
    if (b.whatsapp !== undefined) await setSetting("whatsapp", str(b.whatsapp, 20).replace(/\D/g, "").replace(/^0/, "92"));
    if (b.shippingFee !== undefined) await setSetting("shippingFee", Math.min(5000, Math.max(0, parseInt(b.shippingFee, 10) || 0)));
    if (b.freeShipAt !== undefined) await setSetting("freeShipAt", Math.min(1e6, Math.max(0, parseInt(b.freeShipAt, 10) || 0)));
    if (b.minJars !== undefined) await setSetting("minJars", Math.min(12, Math.max(1, parseInt(b.minJars, 10) || 2)));
    return json(await publicSettings());
  }
  if (route === "GET backup") {
    const dump = { exported_at: now() };
    for (const t of ["products", "orders", "carts", "reviews", "promos"]) dump[t] = await q(sb().from(t).select("*"));
    dump.settings = withoutPrivate(settings);
    return new Response(JSON.stringify(dump, null, 2), { headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="goodnoura-backup-${now().slice(0, 10)}.json"`, "Cache-Control": "no-store" } });
  }
  throw new Bad("Not found.", 404);
}

const run = handle(admin);
export const GET = run, POST = run, PATCH = run, PUT = run, DELETE = run;

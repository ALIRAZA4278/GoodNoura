// One-time copy of the local SQLite database (data/goodnoura.db) into Supabase.
// Usage:  npm run migrate            (reads SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env.local)
// Safe to re-run: products, orders, carts, promos and settings are upserted; reviews are only copied when the table is empty.
import { DatabaseSync } from "node:sqlite";
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) { console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first."); process.exit(1); }
const file = process.argv[2] || "data/goodnoura.db";
if (!fs.existsSync(file)) { console.error(`Can't find ${file}`); process.exit(1); }

const lite = new DatabaseSync(file, { readOnly: true });
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const J = s => (s ? JSON.parse(s) : null);
const all = sql => lite.prepare(sql).all();

async function put(table, rows, conflict) {
  if (!rows.length) return console.log(`${table}: nothing to copy`);
  const { error } = await sb.from(table).upsert(rows, conflict ? { onConflict: conflict } : undefined);
  if (error) { console.error(`${table}: ${error.message}`); process.exit(1); }
  console.log(`${table}: ${rows.length} copied`);
}

await put("products", all("SELECT * FROM products").map(r => ({ id: r.id, data: J(r.data), sort: r.sort, visible: !!r.visible, in_stock: !!r.in_stock })), "id");
await put("settings", all("SELECT * FROM settings").map(r => ({ key: r.key, value: J(r.value) })), "key");
await put("promos", all("SELECT * FROM promos").map(r => ({ ...r, active: !!r.active })), "code");
await put("orders", all("SELECT * FROM orders").map(r => ({ ...r, items: J(r.items), notes: J(r.notes) || [], timeline: J(r.timeline) || [] })), "id");
await put("carts", all("SELECT * FROM carts").map(r => ({ ...r, items: J(r.items) })), "token");

const { count } = await sb.from("reviews").select("*", { count: "exact", head: true });
if (count) console.log(`reviews: Supabase already has ${count}, skipped`);
else await put("reviews", all("SELECT * FROM reviews ORDER BY id").map(({ id, ...r }) => ({ ...r, published: !!r.published })));

console.log("Done.");

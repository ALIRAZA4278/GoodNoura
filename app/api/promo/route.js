import { activePromo, handle, json } from "@/lib/server";

export const dynamic = "force-dynamic";

export const GET = handle(async req => {
  const p = await activePromo(new URL(req.url).searchParams.get("code"));
  return p ? json({ code: p.code, pct: p.pct }) : json({ error: "That code isn't valid." }, 404);
});

import { catalog, handle } from "@/lib/server";

export const dynamic = "force-dynamic";

// The shop pages load their products, reviews and contact details from here (live from the database).
export const GET = handle(async () => {
  const body = `window.GN_CATALOG = ${JSON.stringify(await catalog())};`;
  return new Response(body, { headers: { "Content-Type": "text/javascript; charset=utf-8", "Cache-Control": "no-store" } });
});

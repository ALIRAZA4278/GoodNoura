// The shop pages are kept as the original HTML (design unchanged). This reads one at build time and
// splits it into the page title, the <head> assets (fonts, css, inline styles) and the <body> markup.
import fs from "node:fs";
import path from "node:path";

export function loadPage(name) {
  const html = fs.readFileSync(path.join(process.cwd(), "legacy", `${name}.html`), "utf8");
  const head = (html.match(/<head>([\s\S]*?)<\/head>/i) || [])[1] || "";
  const body = (html.match(/<body[^>]*>([\s\S]*)<\/body>/i) || [])[1] || "";
  const title = (head.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || "Good Noura";
  const robots = /name="robots"[^>]*noindex/i.test(head);
  const assets = head.replace(/<title>[\s\S]*?<\/title>/i, "").replace(/<meta[^>]*>/gi, "");
  return { title, robots, markup: assets + body };
}

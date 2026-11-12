// A small per-visitor limit so a bot can't flood the shop with fake orders or reviews.
// It lives in memory (one counter per server process), which is plenty for a single VPS.
const buckets = new Map();

// The visitor's address as the proxy in front of the app reports it (nginx sets X-Real-IP; Netlify sets its own header).
export function clientIp(req) {
  const h = n => req.headers.get(n);
  return (h("x-nf-client-connection-ip") || h("x-real-ip") || (h("x-forwarded-for") || "").split(",").pop().trim() || "unknown").slice(0, 60);
}

// true = allowed. `key` names what's being limited (e.g. "order:1.2.3.4").
export function allow(key, max, windowMs) {
  const now = Date.now();
  const hits = (buckets.get(key) || []).filter(t => now - t < windowMs);
  if (hits.length >= max) { buckets.set(key, hits); return false; }
  hits.push(now); buckets.set(key, hits);
  if (buckets.size > 5000) for (const [k, v] of buckets) if (!v.some(t => now - t < windowMs)) buckets.delete(k);   // tidy up old visitors
  return true;
}

// Good Noura admin: orders, abandoned carts, products, bundles, reviews, promo codes and settings.
// Talks to /api/admin/* (Next.js API routes). Everything shown from orders/reviews is escaped (it comes from customers).
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const fmt = n => "Rs " + Math.round(n || 0).toLocaleString("en-US");
const STATUSES = ["Pending", "Confirmed", "Shipped", "Out for Delivery", "Attempt", "Delivered", "Cancelled", "Returned"];
const pill = s => `<span class="pill st-${esc(s.split(" ")[0])}">${esc(s)}</span>`;
const when = iso => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true });
const day = iso => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const ago = iso => { const m = (Date.now() - new Date(iso)) / 6e4; return m < 60 ? `${Math.max(1, Math.round(m))} min ago` : m < 1440 ? `${Math.round(m / 60)} hr ago` : `${Math.round(m / 1440)} days ago`; };
const waNumber = p => { let d = String(p || "").replace(/\D/g, ""); if (d.startsWith("0")) d = "92" + d.slice(1); else if (d.length === 10 && d.startsWith("3")) d = "92" + d; return d; };
const waLink = (phone, text) => `https://wa.me/${waNumber(phone)}?text=${encodeURIComponent(text)}`;

async function api(path, { method = "GET", body } = {}) {
  // Every non-GET request must say it is JSON (the server rejects anything else), even when it has no body: logout and the delete buttons.
  const write = method !== "GET";
  const r = await fetch("/api/admin/" + path, { method, headers: write ? { "Content-Type": "application/json" } : {}, body: body ? JSON.stringify(body) : write ? "{}" : undefined });
  const d = await r.json().catch(() => ({}));
  if (r.status === 401 && path !== "login") { showLogin(); throw new Error("Please log in again."); }
  if (!r.ok) throw new Error(d.error || "Something went wrong.");
  return d;
}
function toast(msg, err) {
  const t = $("#toast"); t.textContent = msg; t.className = "toast show" + (err ? " err" : "");
  clearTimeout(toast.t); toast.t = setTimeout(() => t.className = "toast", 2600);
}
const run = fn => async (...a) => { try { await fn(...a); } catch (e) { if (e.message !== "Please log in again.") toast(e.message, true); } };

// ---------- Login ----------
async function boot() {
  try {
    const s = await api("status");
    if (s.loggedIn) return showApp();
    showLogin(!s.setup);
  } catch (e) { $("#app").innerHTML = `<p class="boot">Can't reach the shop server. Check your internet connection and reload. If it keeps happening, the site's server or database is down.</p>`; }
}
// Puts a show/hide (eye) button on every password field inside `root`
const EYE = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z"/><circle cx="12" cy="12" r="3"/></svg>`;
const EYE_OFF = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17.9 17.9A10.6 10.6 0 0 1 12 19C5.5 19 1.5 12 1.5 12a18.5 18.5 0 0 1 4.6-5.4M9.9 5.2A9.7 9.7 0 0 1 12 5c6.5 0 10.5 7 10.5 7a18.6 18.6 0 0 1-2.2 3.2M1 1l22 22"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>`;
function addEyes(root) {
  root.querySelectorAll("input[type=password]").forEach(input => {
    const wrap = document.createElement("span");
    wrap.className = "pw";
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);
    const btn = document.createElement("button");
    btn.type = "button"; btn.className = "eye"; btn.setAttribute("aria-label", "Show password"); btn.innerHTML = EYE;
    btn.onclick = () => {
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      btn.innerHTML = show ? EYE_OFF : EYE;
      btn.setAttribute("aria-label", show ? "Hide password" : "Show password");
      input.focus();
    };
    wrap.appendChild(btn);
  });
}
function showLogin(firstTime) {
  closeDrawer();
  $("#app").innerHTML = `<div class="login"><form class="card form" id="loginForm"><img class="login-logo" src="/img/logo-squirrel.png" alt="Good Noura">
    <h1>${firstTime ? "Create your admin password" : "Good Noura admin"}</h1>
    <p>${firstTime ? "This is the first time the admin has been opened. Choose a password (8+ characters) — you'll use it to log in from now on." : "Log in to manage orders and products."}</p>
    <label>Email<input type="email" name="email" required autocomplete="username" autofocus></label>
    <label>Password<input type="password" name="password" required minlength="${firstTime ? 8 : 1}" autocomplete="${firstTime ? "new-password" : "current-password"}"></label>
    ${firstTime ? `<label>Type it again<input type="password" name="again" required autocomplete="new-password"></label>` : ""}
    <p class="err" id="loginErr"></p>
    <button class="b primary" type="submit">${firstTime ? "Create password and open admin" : "Log in"}</button></form></div>`;
  addEyes($("#loginForm"));
  $("#loginForm").onsubmit = async e => {
    e.preventDefault();
    const f = new FormData(e.target);
    try {
      if (firstTime && f.get("password") !== f.get("again")) throw new Error("The two passwords don't match.");
      await api(firstTime ? "setup" : "login", { method: "POST", body: { email: f.get("email"), password: f.get("password") } });
      showApp();
    } catch (x) { $("#loginErr").textContent = x.message; }
  };
}

// ---------- Shell ----------
const TABS = ["Dashboard", "Orders", "Abandoned", "Products", "Bundles", "Reviews", "Promos", "Settings"];
let tab = (location.hash.slice(1) || "Dashboard");
if (!TABS.includes(tab)) tab = "Dashboard";
const state = { orders: [], carts: [], products: [], reviews: [], promos: [], settings: {} };

function showApp() {
  $("#app").innerHTML = `<header class="top"><div class="in">
      <div class="brand"><img src="/img/logo-squirrel.png" alt=""><span>GOOD NOURA</span> <small>ADMIN</small></div>
      <nav class="tabs" role="tablist">${TABS.map(t => `<button role="tab" data-tab="${t}">${t}<span class="count" data-count="${t}" hidden></span></button>`).join("")}</nav>
      <div class="right"><a href="/" target="_blank" rel="noopener">View shop ↗</a><button id="logout">Log out</button></div></div></header>
    <main class="page" id="page"></main>`;
  $$(".tabs button").forEach(b => b.onclick = () => go(b.dataset.tab));
  $("#logout").onclick = run(async () => { await api("logout", { method: "POST" }); showLogin(false); });
  go(tab);
  refreshCounts();
}
function go(t) {
  tab = t; history.replaceState(null, "", "#" + t);
  $$(".tabs button").forEach(b => b.setAttribute("aria-selected", b.dataset.tab === t));
  $("#page").innerHTML = `<p class="muted">Loading…</p>`;
  run(VIEWS[t])();
}
const refreshCounts = run(async () => {
  const [orders, reviews] = await Promise.all([api("orders"), api("reviews")]);
  state.orders = orders; state.reviews = reviews;
  setCount("Orders", orders.filter(o => o.status === "Pending").length);
  setCount("Reviews", reviews.filter(r => !r.published).length);
});
function setCount(t, n) { const c = $(`[data-count="${t}"]`); if (c) { c.hidden = !n; c.textContent = n; } }

// ---------- Dashboard ----------
let range = "30", metric = "orders";
const RANGES = [["7", "7 days"], ["30", "30 days"], ["90", "3 months"], ["365", "1 year"], ["all", "All time"]];
const counted = o => !["Cancelled", "Returned"].includes(o.status);
async function dashboard() {
  state.orders = await api("orders");
  const since = range === "all" ? 0 : Date.now() - +range * 864e5;
  const list = state.orders.filter(o => new Date(o.created_at) >= since);
  const live = list.filter(counted);
  const revenue = live.reduce((n, o) => n + o.total, 0);
  const delivered = list.filter(o => o.status === "Delivered").length, returned = list.filter(o => o.status === "Returned").length;
  const online = list.filter(o => o.payment === "online").length;
  const days = range === "all" ? Math.max(7, Math.ceil((Date.now() - Math.min(...list.map(o => +new Date(o.created_at)), Date.now())) / 864e5) + 1) : +range;
  const products = {};
  live.forEach(o => o.items.forEach(l => { products[l.name] = (products[l.name] || 0) + l.qty; }));
  const top = Object.entries(products).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxTop = top.length ? top[0][1] : 1;
  const byStatus = STATUSES.map(s => [s, list.filter(o => o.status === s).length]);
  const maxStatus = Math.max(1, ...byStatus.map(x => x[1]));
  const colors = { Pending: "#d79a1e", Confirmed: "#2c6aa0", Shipped: "#6a4bb5", "Out for Delivery": "#6a4bb5", Attempt: "#c8641f", Delivered: "#2f8a43", Cancelled: "#9a8a7e", Returned: "#b8452a" };

  $("#page").innerHTML = `
    <div class="page-head"><div><h1>Dashboard</h1><p>How the shop is doing.</p></div>
      <div class="seg" id="ranges">${RANGES.map(([v, l]) => `<button data-r="${v}" aria-pressed="${v === range}">${l}</button>`).join("")}</div></div>
    <div class="stats">
      <div class="card stat"><span>Orders</span><b>${list.length}</b><small>${list.filter(o => o.status === "Pending").length} pending</small></div>
      <div class="card stat"><span>Revenue</span><b>${fmt(revenue)}</b><small>Excludes cancelled &amp; returned</small></div>
      <div class="card stat"><span>Average order</span><b>${fmt(live.length ? revenue / live.length : 0)}</b><small>${online} paid online · ${list.length - online} COD</small></div>
      <div class="card stat"><span>Delivery rate</span><b>${delivered + returned ? Math.round(delivered / (delivered + returned) * 100) : 0}%</b><small>${delivered} delivered · ${returned} returned</small></div>
    </div>
    <div class="grid2">
      <div class="card box"><h2>${range === "all" ? "All time" : RANGES.find(r => r[0] === range)[1]}
        <span class="seg" id="metric"><button data-m="orders" aria-pressed="${metric === "orders"}">Orders</button><button data-m="revenue" aria-pressed="${metric === "revenue"}">Revenue</button></span></h2>
        ${chart(live, Math.min(days, 365))}</div>
      <div class="card box"><h2>Order status</h2><div class="bars">${byStatus.map(([s, n]) => `
        <div class="bar-row"><span>${s}</span><div class="bar-track"><div class="bar-fill" style="width:${n / maxStatus * 100}%;background:${colors[s]}"></div></div><b>${n}</b></div>`).join("")}</div></div>
    </div>
    <div class="grid2">
      <div class="card box"><h2>Recent orders <button class="b sm" onclick="go('Orders')">All orders →</button></h2>${list.length ? `<div class="table-wrap"><table class="table"><tbody>
        ${list.slice(0, 6).map(o => `<tr class="click" data-order="${esc(o.id)}"><td class="oid">${esc(o.id)}</td><td>${esc(o.name)}<div class="sub">${esc(o.city)}</div></td>
          <td>${pill(o.status)}</td><td class="num">${fmt(o.total)}</td></tr>`).join("")}</tbody></table></div>` : `<p class="muted">No orders in this period yet.</p>`}</div>
      <div class="card box"><h2>Best sellers</h2>${top.length ? `<div class="bars">${top.map(([n, q]) => `
        <div class="bar-row"><span title="${esc(n)}" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(n)}</span><div class="bar-track"><div class="bar-fill" style="width:${q / maxTop * 100}%;background:var(--rust)"></div></div><b>${q}</b></div>`).join("")}</div>`
        : `<p class="muted">Sales will show here.</p>`}</div>
    </div>`;
  $$("#ranges button").forEach(b => b.onclick = () => { range = b.dataset.r; dashboard(); });
  $$("#metric button").forEach(b => b.onclick = () => { metric = b.dataset.m; dashboard(); });
  $$("[data-order]").forEach(r => r.onclick = () => openOrder(r.dataset.order));
}
// Bars per day (or per week for long ranges), drawn as SVG
function chart(list, days) {
  if (!list.length) return `<div class="chart-empty">No orders in this period yet.</div>`;
  const step = days > 120 ? 7 : 1, n = Math.ceil(days / step), start = new Date(); start.setHours(0, 0, 0, 0);
  const buckets = Array.from({ length: n }, (_, i) => ({ t: +start - (n - 1 - i) * step * 864e5, v: 0 }));
  list.forEach(o => { const t = new Date(o.created_at); t.setHours(0, 0, 0, 0); const i = n - 1 - Math.floor((+start - +t) / (step * 864e5)); if (buckets[i]) buckets[i].v += metric === "orders" ? 1 : o.total; });
  const max = Math.max(1, ...buckets.map(b => b.v)), W = 600, H = 200, pad = 26, bw = (W - pad) / n;
  const label = t => new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const every = Math.ceil(n / 6);
  return `<svg class="chart" viewBox="0 0 ${W} ${H + 20}" role="img" aria-label="${metric} over time">
    <line x1="${pad}" y1="${H}" x2="${W}" y2="${H}" stroke="#e4d6c2"/>
    <text x="0" y="12">${metric === "orders" ? max : (max >= 1000 ? Math.round(max / 1000) + "k" : max)}</text>
    ${buckets.map((b, i) => { const h = b.v / max * (H - 16); return `<rect x="${pad + i * bw + bw * .15}" y="${H - h}" width="${Math.max(1, bw * .7)}" height="${h}" rx="2" fill="${b.v ? "#8e3c19" : "transparent"}"><title>${label(b.t)}: ${metric === "orders" ? b.v + " orders" : fmt(b.v)}</title></rect>`; }).join("")}
    ${buckets.map((b, i) => i % every === 0 ? `<text x="${pad + i * bw}" y="${H + 16}">${label(b.t)}</text>` : "").join("")}</svg>`;
}

// ---------- Orders ----------
let oq = "", ostatus = "", selected = new Set();
async function orders() {
  state.orders = await api("orders");
  const all = state.orders;
  const revenue = all.filter(counted).reduce((n, o) => n + o.total, 0);
  const delivered = all.filter(o => o.status === "Delivered").length, returned = all.filter(o => o.status === "Returned").length;
  $("#page").innerHTML = `
    <div class="page-head"><div><h1>Orders</h1><p>Every order placed on the website.</p></div>
      <div class="actions"><a class="b" href="/api/admin/orders.csv" download>⬇ Export all (CSV)</a><button class="b" id="refresh">↻ Refresh</button></div></div>
    <div class="stats">
      <div class="card stat"><span>Total orders</span><b>${all.length}</b></div>
      <div class="card stat"><span>Revenue</span><b>${fmt(revenue)}</b><small>Excludes cancelled &amp; returned</small></div>
      <div class="card stat"><span>Pending</span><b>${all.filter(o => o.status === "Pending").length}</b><small>Need confirming</small></div>
      <div class="card stat"><span>Delivery rate</span><b>${delivered + returned ? Math.round(delivered / (delivered + returned) * 100) : 0}%</b></div>
    </div>
    <div class="toolbar"><input type="search" id="oq" placeholder="Search by order number, name, WhatsApp, email or city…" value="${esc(oq)}">
      <select id="ostatus"><option value="">All statuses</option>${STATUSES.map(s => `<option${s === ostatus ? " selected" : ""}>${s}</option>`).join("")}</select></div>
    <div id="bulk"></div>
    <div class="card table-wrap" id="olist"></div>`;
  $("#refresh").onclick = () => go("Orders");
  $("#oq").oninput = e => { oq = e.target.value; renderOrderList(); };
  $("#ostatus").onchange = e => { ostatus = e.target.value; renderOrderList(); };
  renderOrderList();
  refreshCounts();
}
function filteredOrders() {
  const q = oq.trim().toLowerCase(), qd = q.replace(/\D/g, "");
  return state.orders.filter(o => (!ostatus || o.status === ostatus) && (!q ||
    [o.id, o.name, o.email, o.city].some(v => String(v || "").toLowerCase().includes(q)) || (qd.length >= 4 && String(o.phone).replace(/\D/g, "").includes(qd))));
}
function renderOrderList() {
  const list = filteredOrders();
  selected = new Set([...selected].filter(id => state.orders.some(o => o.id === id)));
  $("#olist").innerHTML = list.length ? `<table class="table"><thead><tr>
      <th><input type="checkbox" id="selAll" aria-label="Select all"></th><th>Order</th><th>Customer</th><th class="hide-sm">Items</th><th>Status</th><th class="num">Total</th><th class="hide-sm">Date</th></tr></thead><tbody>
    ${list.map(o => `<tr class="click" data-id="${esc(o.id)}">
      <td><input type="checkbox" data-sel="${esc(o.id)}" ${selected.has(o.id) ? "checked" : ""} aria-label="Select ${esc(o.id)}"></td>
      <td class="oid">${esc(o.id)}</td>
      <td>${esc(o.name)}<div class="sub">${esc(o.city)} · ${esc(o.phone)}</div>${o.notes.length ? `<div class="note-preview">📝 ${esc(o.notes[o.notes.length - 1].text.slice(0, 80))}</div>` : ""}</td>
      <td class="hide-sm sub">${o.items.map(l => `${l.qty}× ${esc(l.name)}`).join("<br>")}</td>
      <td>${pill(o.status)}</td>
      <td class="num"><b>${fmt(o.total)}</b><div><span class="pill ${o.payment}">${o.payment === "online" ? "Online" : "COD"}</span></div></td>
      <td class="hide-sm sub">${when(o.created_at)}</td></tr>`).join("")}</tbody></table>`
    : `<div class="empty">${state.orders.length ? "No orders match." : "No orders yet. When customers check out on the website, their orders appear here."}</div>`;
  $$("#olist tr.click").forEach(tr => tr.onclick = e => { if (!e.target.closest("input")) openOrder(tr.dataset.id); });
  $$("[data-sel]").forEach(c => c.onchange = () => { c.checked ? selected.add(c.dataset.sel) : selected.delete(c.dataset.sel); renderBulk(); });
  const all = $("#selAll");
  if (all) all.onchange = () => { list.forEach(o => all.checked ? selected.add(o.id) : selected.delete(o.id)); renderOrderList(); };
  renderBulk();
}
function renderBulk() {
  const el = $("#bulk"); if (!el) return;
  el.innerHTML = selected.size ? `<div class="bulk"><b>${selected.size} selected</b>
    <select id="bulkStatus"><option value="">Change status to…</option>${STATUSES.map(s => `<option>${s}</option>`).join("")}</select>
    <button class="b sm gold" id="bulkApply">Apply</button>
    <a class="b sm" href="/api/admin/orders.csv?ids=${encodeURIComponent([...selected].join(","))}" download>⬇ Export selected</a>
    <button class="b sm" id="bulkClear">Clear</button></div>` : "";
  if (!selected.size) return;
  $("#bulkClear").onclick = () => { selected.clear(); renderOrderList(); };
  $("#bulkApply").onclick = run(async () => {
    const status = $("#bulkStatus").value; if (!status) return toast("Pick a status first.", true);
    await api("orders/bulk", { method: "POST", body: { ids: [...selected], status } });
    toast(`${selected.size} orders marked ${status}.`); selected.clear(); orders();
  });
}

const WA_TEXT = {
  Pending: o => `Hi ${o.name}, thank you for your Good Noura order ${o.id} (${fmt(o.total)}). Please reply YES to confirm it.`,
  Confirmed: o => `Hi ${o.name}, your Good Noura order ${o.id} is confirmed! We'll send it out soon.`,
  Shipped: o => `Hi ${o.name}, your Good Noura order ${o.id} has been shipped and is on its way to you.`,
  "Out for Delivery": o => `Hi ${o.name}, your Good Noura order ${o.id} is out for delivery today.${o.payment === "cod" ? ` Please keep ${fmt(o.total)} ready.` : ""}`,
  Attempt: o => `Hi ${o.name}, our rider tried to deliver your Good Noura order ${o.id} but couldn't reach you. When is a good time?`,
  Delivered: o => `Hi ${o.name}, your Good Noura order ${o.id} has been delivered. Enjoy! We'd love to hear what you think.`,
  Cancelled: o => `Hi ${o.name}, your Good Noura order ${o.id} has been cancelled. Message us if this is a mistake.`,
  Returned: o => `Hi ${o.name}, your Good Noura order ${o.id} came back to us. Would you like us to send it again?`,
};
async function openOrder(id, editing = false) {
  let o = state.orders.find(x => x.id === id);
  if (!o) { state.orders = await api("orders"); o = state.orders.find(x => x.id === id); }
  if (!o) return toast("Order not found.", true);
  const others = state.orders.filter(x => x.id !== o.id && waNumber(x.phone) === waNumber(o.phone));
  openDrawer(`<div class="dh"><h2>${esc(o.id)} ${pill(o.status)}</h2><button data-close>Close ✕</button></div>
    <div class="db">
      <div class="card sec"><h3>Customer ${editing ? "" : `<button class="b sm" id="editCust">Edit</button>`}</h3>
        ${editing ? `<form class="form" id="custForm">
          <label>Name<input name="name" value="${esc(o.name)}" required></label>
          <div class="row"><label>WhatsApp<input name="phone" value="${esc(o.phone)}" required></label><label>Email<input name="email" value="${esc(o.email)}"></label></div>
          <label>Address<textarea name="address">${esc(o.address)}</textarea></label><label>City<input name="city" value="${esc(o.city)}"></label>
          <div class="actions"><button class="b primary" type="submit">Save</button><button class="b" type="button" id="cancelEdit">Cancel</button></div></form>`
        : `<div class="kv"><span>Name</span><b>${esc(o.name)}</b><span>WhatsApp</span><a href="${waLink(o.phone, "")}" target="_blank" rel="noopener">${esc(o.phone)}</a>
          <span>Email</span><span style="color:inherit">${o.email ? `<a href="mailto:${esc(o.email)}">${esc(o.email)}</a>` : "—"}</span>
          <span>Address</span><span style="color:inherit">${esc(o.address)}</span><span>City</span><span style="color:inherit">${esc(o.city)}</span>
          <span>Placed</span><span style="color:inherit">${when(o.created_at)}</span></div>
          ${others.length ? `<p style="margin:10px 0 0"><button class="b sm" id="custOrders">View all ${others.length + 1} orders from this customer →</button></p>` : ""}`}</div>
      <div class="card sec"><h3>Items</h3><div class="items-list">${o.items.map(l => `<div class="item"><img src="${esc(l.img)}" alt="">
          <div><b>${l.qty} × ${esc(l.name)}</b><div class="muted" style="font-size:12px">${esc(l.variant)}</div></div>
          <b>${fmt(l.qty * (o.payment === "online" ? l.onlinePrice : l.price))}</b></div>`).join("")}</div>
        <div style="margin-top:12px"><div class="tot"><span>Subtotal${o.payment === "online" ? " (online prices)" : ""}</span><span>${fmt(o.subtotal)}</span></div>
          ${o.discount ? `<div class="tot"><span>Promo ${esc(o.promo)}</span><span>− ${fmt(o.discount)}</span></div>` : ""}
          <div class="tot"><span>Delivery</span><span>${o.shipping ? fmt(o.shipping) : "Free"}</span></div>
          <div class="tot big"><span>Total · ${o.payment === "online" ? "Paid online (bank transfer)" : "Cash on delivery"}</span><span>${fmt(o.total)}</span></div></div></div>
      <div class="card sec"><h3>Update status</h3><div class="status-grid">${STATUSES.map(s => `<button data-status="${s}" aria-pressed="${s === o.status}">${s}</button>`).join("")}</div>
        <p style="margin:12px 0 0"><a class="b wa" id="waBtn" target="_blank" rel="noopener" href="${waLink(o.phone, WA_TEXT[o.status](o))}">💬 Send WhatsApp update</a>
        <span class="muted" style="font-size:12px;margin-left:6px">Opens WhatsApp with a message for "${esc(o.status)}"</span></p></div>
      <div class="card sec"><h3>Notes</h3><div style="display:grid;gap:8px">${o.notes.map(n => `<div class="note"><time>${when(n.at)}</time>${esc(n.text)}</div>`).join("") || `<p class="muted" style="margin:0">No notes yet.</p>`}</div>
        <form id="noteForm" style="display:grid;gap:8px;margin-top:10px"><textarea name="note" placeholder="e.g. Called customer, order confirmed" style="min-height:60px"></textarea>
          <button class="b" type="submit" style="justify-self:start">+ Add note</button></form></div>
      <div class="card sec"><h3>Activity</h3><ul class="timeline">${[...o.timeline].reverse().map(t => `<li><time>${when(t.at)}</time><span>${esc(t.text)}</span></li>`).join("")}</ul></div>
      <button class="b danger" id="delOrder" style="justify-self:start">Delete order</button>
    </div>`);
  const update = async body => {
    const u = await api("orders/" + encodeURIComponent(o.id), { method: "PATCH", body });
    Object.assign(o, u);
    const i = state.orders.findIndex(x => x.id === u.id);   // state.orders may have been reloaded meanwhile
    if (i >= 0) state.orders[i] = u; else state.orders.unshift(u);
    return u;
  };
  $$("[data-status]").forEach(b => b.onclick = run(async () => { await update({ status: b.dataset.status }); toast(`${o.id} marked ${b.dataset.status}.`); openOrder(o.id); afterOrderChange(); }));
  $("#waBtn").onclick = () => update({ event: `WhatsApp update sent (${o.status})` }).then(() => openOrder(o.id)).catch(() => {});
  $("#noteForm").onsubmit = run(async e => { e.preventDefault(); const note = new FormData(e.target).get("note").trim(); if (!note) return; await update({ note }); openOrder(o.id); afterOrderChange(); });
  $("#delOrder").onclick = run(async () => {
    if (!confirm(`Delete order ${o.id} for ${o.name}? This can't be undone.`)) return;
    await api("orders/" + encodeURIComponent(o.id), { method: "DELETE" }); closeDrawer(); toast(`${o.id} deleted.`); afterOrderChange(true);
  });
  if (editing) {
    $("#cancelEdit").onclick = () => openOrder(o.id);
    $("#custForm").onsubmit = run(async e => { e.preventDefault(); await update({ customer: Object.fromEntries(new FormData(e.target)) }); toast("Customer details saved."); openOrder(o.id); afterOrderChange(); });
  } else {
    $("#editCust").onclick = () => openOrder(o.id, true);
    const co = $("#custOrders"); if (co) co.onclick = () => { closeDrawer(); oq = o.phone; ostatus = ""; go("Orders"); };
  }
}
function afterOrderChange(reload) {
  if (tab === "Orders") { if (reload) orders(); else { renderOrderList(); refreshCounts(); } }
  else if (tab === "Dashboard") dashboard();
}

// ---------- Abandoned carts ----------
async function abandoned() {
  state.carts = await api("carts");
  { const st = await api("settings"); state.ship = { fee: st.shippingFee, at: st.freeShipAt }; }
  const list = state.carts;
  $("#page").innerHTML = `
    <div class="page-head"><div><h1>Abandoned carts</h1><p>People who typed their WhatsApp number or email at checkout but didn't place the order.</p></div>
      <div class="actions"><button class="b" onclick="go('Abandoned')">↻ Refresh</button></div></div>
    <div class="card table-wrap">${list.length ? `<table class="table"><thead><tr><th>Customer</th><th class="hide-sm">Cart</th><th class="num">Value</th><th class="hide-sm">Last seen</th><th></th></tr></thead><tbody>
      ${list.map(c => `<tr><td><b>${esc(c.name || "No name")}</b><div class="sub">${[c.city, c.phone, c.email].filter(Boolean).map(esc).join(" · ")}</div></td>
        <td class="hide-sm sub">${c.items.map(l => `${l.qty}× ${esc(l.name)}${l.variant ? ` (${esc(l.variant)})` : ""}`).join("<br>")}</td>
        <td class="num"><b>${fmt(c.total)}</b></td><td class="hide-sm sub">${ago(c.updated_at)}</td>
        <td class="num"><div class="actions" style="justify-content:flex-end">
          ${c.phone ? `<a class="b sm wa" target="_blank" rel="noopener" href="${waLink(c.phone, `Hi ${c.name || "there"}, you left ${c.items.map(l => l.name).join(", ")} in your Good Noura cart. Can we help you complete your order? ${+state.ship?.fee && +state.ship?.at ? `Delivery is free on orders of ${fmt(+state.ship.at)} or more, and you` : "You"} save 10% when you pay online.`)}">💬 WhatsApp</a>` : ""}
          ${c.email ? `<a class="b sm" href="mailto:${esc(c.email)}?subject=${encodeURIComponent("Your Good Noura cart")}&body=${encodeURIComponent(`Hi ${c.name || "there"},\n\nYou left some nut butter in your cart. Reply to this email or message us on WhatsApp and we'll get your order sorted.\n\nGood Noura`)}">✉ Email</a>` : ""}
          <button class="b sm danger" data-del="${esc(c.token)}">Delete</button></div></td></tr>`).join("")}</tbody></table>`
      : `<div class="empty">No abandoned carts. When someone starts checkout and leaves, they'll show here so you can follow up.</div>`}</div>`;
  $$("[data-del]").forEach(b => b.onclick = run(async () => { await api("carts/" + b.dataset.del, { method: "DELETE" }); toast("Cart removed."); abandoned(); }));
}

// ---------- Products & bundles ----------
async function productList(type) {
  state.products = await api("products");
  const list = state.products.filter(p => p.type === type);
  const isB = type === "bundles";
  $("#page").innerHTML = `
    <div class="page-head"><div><h1>${isB ? "Bundles" : "Products"}</h1><p>${isB ? "Ready-made boxes, and the Make Your Own Bundle rule." : "Single jars sold on the site."} Changes show on the website straight away.</p></div>
      <div class="actions"><button class="b primary" id="addP">+ Add ${isB ? "bundle" : "product"}</button></div></div>
    <div class="card plist">${list.length ? `<div class="plist-head"><span></span><span>${isB ? "Bundle" : "Product"}</span><span>Price</span><span>Status</span><span style="text-align:right">Actions</span></div>
      ${list.map(p => `<div class="prow${p.visible ? "" : " off"}"><img class="pimg" src="${esc(p.img)}" alt="">
        <div class="pname"><b>${esc(p.name)}</b><span>${esc(p.sub || "")}</span></div>
        <div class="pprice">${isB ? `<b>${fmt(p.price)}</b> <small>cash on delivery</small><br><small>${fmt(p.onlinePrice)} online · ${fmt(p.separate)} separately</small>`
          : p.sizes.map(([z, v]) => `${esc(z)} · <b>${fmt(v)}</b>`).join("<br>")}</div>
        <div class="pstatus"><span class="pill ${p.visible ? "on" : "off"}">${p.visible ? "Visible" : "Hidden"}</span>${p.inStock ? `<span class="pill on">In stock</span>` : `<span class="pill warn">Sold out</span>`}</div>
        <div class="pactions">
          <button class="b sm" data-stock="${esc(p.id)}">${p.inStock ? "Mark sold out" : "Back in stock"}</button>
          <button class="b sm" data-vis="${esc(p.id)}">${p.visible ? "Hide" : "Show"}</button>
          <a class="b sm" href="/product.html?p=${encodeURIComponent(p.id)}" target="_blank" rel="noopener">View</a>
          <button class="b sm primary" data-edit="${esc(p.id)}">Edit</button></div></div>`).join("")}`
      : `<div class="empty">Nothing here yet.</div>`}</div>
    ${isB ? `<div class="card box" style="margin-top:14px;max-width:560px"><h2>Make Your Own Bundle</h2>
      <form class="form" id="myob"><label>Minimum jars per custom bundle<input type="number" name="minJars" min="1" max="12" value="${esc(state.settings.minJars || 2)}"></label>
      <p class="muted" style="margin:0;font-size:12.5px">Custom bundles use normal jar prices (plus the 10% online saving). Ready-made bundles above are the discounted ones.</p>
      <button class="b primary" type="submit" style="justify-self:start">Save</button></form></div>` : ""}`;
  const patch = async (id, body, msg) => { await api("products/" + id, { method: "PATCH", body }); toast(msg); productList(type); };
  $$("[data-stock]").forEach(b => b.onclick = run(() => { const p = state.products.find(x => x.id === b.dataset.stock); return patch(p.id, { inStock: !p.inStock }, `${p.name} ${p.inStock ? "marked sold out" : "back in stock"}.`); }));
  $$("[data-vis]").forEach(b => b.onclick = run(() => { const p = state.products.find(x => x.id === b.dataset.vis); return patch(p.id, { visible: !p.visible }, `${p.name} ${p.visible ? "hidden from" : "shown on"} the shop.`); }));
  $$("[data-edit]").forEach(b => b.onclick = () => editProduct(state.products.find(x => x.id === b.dataset.edit)));
  $("#addP").onclick = () => editProduct({ type, name: "", visible: true, inStock: true, sizes: [["", ""]], items: [["", ""]], gallery: [], contains: [] });
  if (isB) {
    state.settings = await api("settings");
    $("#myob [name=minJars]").value = state.settings.minJars || 2;
    $("#myob").onsubmit = run(async e => { e.preventDefault(); await api("settings", { method: "PUT", body: { minJars: e.target.minJars.value } }); toast("Saved."); });
  }
}
const products = () => productList("singles");
const bundles = () => productList("bundles");

// One size row: size, price and an optional photo that shows whenever that size is selected in the shop.
const szThumb = src => src ? `<img src="${esc(src)}" alt=""><span>Change</span>` : `<span class="none">+ Photo<small>optional</small></span>`;
const sizeRow = r => `<div class="r size"><input data-size="0" value="${esc(r[0])}" placeholder="Size (e.g. 340g)"><input data-size="1" type="number" min="1" value="${esc(r[1])}" placeholder="Price (Rs)">
  <div class="sz-photo"><button type="button" class="sz-btn" data-szpick title="Choose the photo shown for this size">${szThumb(r[2])}</button><input type="hidden" data-size="2" value="${esc(r[2] || "")}"></div>
  <button type="button" class="b sm danger" data-rm>✕</button><div class="sz-panel" hidden></div></div>`;
const rowsHTML = (name, rows, ph) => name === "size" ? rows.map(sizeRow).join("") : rows.map(r => `<div class="r"><input data-${name}="0" value="${esc(r[0])}" placeholder="${ph[0]}"><input data-${name}="1" value="${esc(r[1])}" placeholder="${ph[1]}"><button type="button" class="b sm danger" data-rm>✕</button></div>`).join("");

// The photo chooser under a size row: the product's own photos, an upload, or "no special photo"
function openSizePanel(row, form) {
  const panel = $(".sz-panel", row), cur = $('[data-size="2"]', row).value;
  if (!panel.hidden) { panel.hidden = true; return; }
  $$(".sz-panel", form).forEach(x => x.hidden = true);
  const photos = [];
  const add = (label, src) => { if (src && !photos.some(p => p[1] === src)) photos.push([label, src]); };
  add("Main photo", form.elements.img.value.trim());
  $$("#gallery .r", form).forEach(g => add($('[data-gal="0"]', g).value.trim() || "Photo", $('[data-gal="1"]', g).value.trim()));
  if (cur) add("Current", cur);
  const size = $('[data-size="0"]', row).value.trim();
  panel.innerHTML = `<p class="muted" style="margin:0 0 8px;font-size:12.5px">Photo to show when <b>${esc(size || "this size")}</b> is selected. If you don't pick one, the main photo is used.</p>
    <div class="sz-grid">
      <button type="button" class="sz-opt${cur ? "" : " on"}" data-szset=""><span class="blank">Main photo<br><small>(default)</small></span></button>
      ${photos.map(([l, s]) => `<button type="button" class="sz-opt${s === cur ? " on" : ""}" data-szset="${esc(s)}" title="${esc(l)}"><img src="${esc(s)}" alt=""><small>${esc(l)}</small></button>`).join("")}
      <label class="sz-opt sz-up"><span class="blank">+ Upload<br>new photo</span><input type="file" accept="image/*" class="sz-file" hidden></label>
    </div>`;
  panel.hidden = false;
}
function setSizePhoto(row, src) {
  $('[data-size="2"]', row).value = src;
  $(".sz-btn", row).innerHTML = szThumb(src);
  $(".sz-panel", row).hidden = true;
}
const galHTML = g => g.map(([l, s]) => `<div class="r gal"><img src="${esc(s)}" alt=""><input data-gal="0" value="${esc(l)}" placeholder="Label (e.g. Nutrition)"><input data-gal="1" value="${esc(s)}" placeholder="Image path or URL"><button type="button" class="b sm danger" data-rm>✕</button></div>`).join("");
function editProduct(p) {
  const isB = p.type === "bundles", isNew = !p.id;
  const singles = state.products.filter(x => x.type === "singles");
  openDrawer(`<div class="dh"><h2>${isNew ? `New ${isB ? "bundle" : "product"}` : esc(p.name)}</h2><button data-close>Close ✕</button></div>
    <div class="db"><form class="form" id="pForm">
      <label>Name *<input name="name" value="${esc(p.name)}" required></label>
      <label>URL key <small>${isNew ? "(made from the name if left blank — can't be changed later)" : "(can't be changed)"}</small><input name="id" value="${esc(p.id || "")}" ${isNew ? 'placeholder="e.g. honey-peanut-butter"' : "disabled"}></label>
      <div class="row"><label>Short line <small>(under the name on cards)</small><input name="sub" value="${esc(p.sub || "")}"></label>
        <label>Badge <small>(e.g. Best seller)</small><input name="badge" value="${esc(p.badge || "")}"></label></div>
      <label>Description<textarea name="desc">${esc(p.desc || "")}</textarea></label>
      ${isB ? `
        <div class="row3"><label>Price (cash on delivery) *<input name="price" type="number" min="1" value="${esc(p.price || "")}" required></label>
          <label>Online price <small>(blank = 10% off)</small><input name="onlinePrice" type="number" min="1" value="${esc(p.onlinePrice || "")}"></label>
          <label>Price if bought separately<input name="separate" type="number" min="1" value="${esc(p.separate || "")}"></label></div>
        <fieldset><legend>What's inside (shown on the page)</legend><div class="rows" id="items">${rowsHTML("item", p.items && p.items.length ? p.items : [["", ""]], ["Jar name", "Size (e.g. 510g)"])}</div>
          <button type="button" class="b sm" data-addrow="items" style="justify-self:start">+ Add row</button></fieldset>
        <fieldset><legend>Jars in this bundle (used for "Also in" and cart suggestions)</legend><div class="chips">${singles.map(s => `<label class="check"><input type="checkbox" name="contains" value="${esc(s.id)}" ${(p.contains || []).includes(s.id) ? "checked" : ""}> ${esc(s.name)}</label>`).join("")}</div></fieldset>
        <fieldset><legend>Customer choice (optional)</legend>
          <div class="row"><label>Question<input name="choiceLabel" value="${esc(p.choice ? p.choice.label : "")}" placeholder="e.g. Choose your peanut butter"></label>
          <label>Options <small>(comma separated)</small><input name="choiceOpts" value="${esc(p.choice ? p.choice.opts.join(", ") : "")}" placeholder="Creamy, Crunchy, Chocolate"></label></div></fieldset>
        <div class="row"><label>Ribbon <small>(e.g. Most complete)</small><input name="ribbon" value="${esc(p.ribbon || "")}"></label>
          <label class="check" style="align-self:end"><input type="checkbox" name="featured" ${p.featured ? "checked" : ""}> Highlight this bundle</label></div>`
      : `
        <fieldset><legend>Sizes and prices *</legend><div class="rows" id="sizes">${rowsHTML("size", p.sizes && p.sizes.length ? p.sizes : [["", ""]], ["Size (e.g. 340g)", "Price (Rs)"])}</div>
          <button type="button" class="b sm" data-addrow="sizes" style="justify-self:start">+ Add size</button>
          <p class="muted" style="margin:0;font-size:12px">The online price is worked out automatically (10% off).</p></fieldset>
        <div class="row"><label>Flavour <small>(short name, e.g. Almond)</small><input name="flavour" value="${esc(p.flavour || "")}"></label>
          <label>Card colour<input name="color" type="color" value="${esc(p.color || "#d9a566")}" style="height:40px;padding:3px"></label></div>
        <label>Ingredients<input name="ingredients" value="${esc(p.ingredients || "")}" placeholder="e.g. 100% roasted peanuts"></label>
        <label>Allergen information<input name="allergen" value="${esc(p.allergen || "")}" placeholder="e.g. Contains peanuts"></label>`}
      <fieldset><legend>Main photo *</legend><div class="img-pick"><img id="imgPrev" src="${esc(p.img || "")}" alt="">
        <div style="display:grid;gap:6px"><input name="img" value="${esc(p.img || "")}" placeholder="Image path or URL" required><input type="file" accept="image/*" id="imgFile"></div></div></fieldset>
      <fieldset><legend>Photo gallery (product page)</legend><div class="rows" id="gallery">${galHTML(p.gallery || [])}</div>
        <label class="b sm" style="justify-self:start;display:inline-flex">+ Upload photos<input type="file" accept="image/*" multiple id="galFile" hidden></label>
        <p class="muted" style="margin:0;font-size:12px">Leave empty to use the main photo plus placeholder slides.</p></fieldset>
      <div class="row"><label class="check"><input type="checkbox" name="visible" ${p.visible !== false ? "checked" : ""}> Visible in shop</label>
        <label class="check"><input type="checkbox" name="inStock" ${p.inStock !== false ? "checked" : ""}> In stock</label></div>
      <label>Display order <small>(lower shows first)</small><input name="sort" type="number" value="${esc(p.sort ?? "")}"></label>
      <p class="err" id="pErr"></p>
      <div class="sticky-save"><button class="b primary" type="submit">${isNew ? "Create" : "Save changes"}</button><button class="b" type="button" data-close>Cancel</button>
        ${isNew ? "" : `<button class="b danger" type="button" id="delP" style="margin-left:auto">Delete</button>`}</div>
    </form></div>`);
  const form = $("#pForm");
  form.addEventListener("click", e => {
    const pick = e.target.closest("[data-szpick]");
    if (pick) { openSizePanel(pick.closest(".r"), form); return; }
    const set = e.target.closest("[data-szset]");
    if (set) { setSizePhoto(set.closest(".r"), set.dataset.szset); return; }
    if (e.target.closest("[data-rm]")) e.target.closest(".r").remove();
    const add = e.target.closest("[data-addrow]");
    if (add) $("#" + add.dataset.addrow).insertAdjacentHTML("beforeend", add.dataset.addrow === "sizes" ? rowsHTML("size", [["", ""]], ["Size (e.g. 340g)", "Price (Rs)"]) : rowsHTML("item", [["", ""]], ["Jar name", "Size (e.g. 510g)"]));
  });
  // Uploading a new photo straight from a size's chooser
  form.addEventListener("change", run(async e => {
    const input = e.target.closest(".sz-file");
    if (!input || !input.files[0]) return;
    const row = input.closest(".r");
    setSizePhoto(row, await upload(input.files[0]));
    toast("Photo uploaded and set for this size.");
  }));
  form.elements.img.oninput = () => $("#imgPrev").src = form.elements.img.value;
  $("#imgFile").onchange = run(async e => { const f = e.target.files[0]; if (!f) return; const path = await upload(f); form.elements.img.value = path; $("#imgPrev").src = path; toast("Photo uploaded."); });
  $("#galFile").onchange = run(async e => { for (const f of e.target.files) { const path = await upload(f); $("#gallery").insertAdjacentHTML("beforeend", galHTML([[f.name.replace(/\.\w+$/, "").replace(/[-_]/g, " "), path]])); } toast("Photos uploaded."); });
  form.onsubmit = run(async e => {
    e.preventDefault();
    const f = new FormData(form), rows = (sel, k) => $$(sel + " .r").map(r => { const x = [$(`[data-${k}="0"]`, r).value.trim(), $(`[data-${k}="1"]`, r).value.trim()]; const ph = $(`[data-${k}="2"]`, r); if (ph && ph.value.trim()) x.push(ph.value.trim()); return x; }).filter(r => r[0] || r[1]);
    const data = { type: p.type, name: f.get("name"), sub: f.get("sub"), badge: f.get("badge"), desc: f.get("desc"), img: f.get("img"),
      gallery: rows("#gallery", "gal"), lids: p.lids, sizeGallery: p.sizeGallery };
    if (isB) Object.assign(data, { price: f.get("price"), onlinePrice: f.get("onlinePrice"), separate: f.get("separate"), items: rows("#items", "item"), contains: f.getAll("contains"),
      ribbon: f.get("ribbon"), featured: !!f.get("featured"), color: p.color,
      choice: f.get("choiceOpts").trim() ? { label: f.get("choiceLabel"), opts: f.get("choiceOpts").split(",").map(s => s.trim()).filter(Boolean) } : null });
    else Object.assign(data, { sizes: rows("#sizes", "size"), flavour: f.get("flavour"), color: f.get("color"), ingredients: f.get("ingredients"), allergen: f.get("allergen"),
      lids: p.color === f.get("color") && p.lids ? p.lids : [f.get("color")] });
    const body = { data, visible: !!f.get("visible"), inStock: !!f.get("inStock"), ...(f.get("sort") !== "" ? { sort: f.get("sort") } : {}) };
    try {
      if (isNew) await api("products", { method: "POST", body: { ...body, id: f.get("id") } });
      else await api("products/" + p.id, { method: "PATCH", body });
    } catch (x) { $("#pErr").textContent = x.message; return; }
    closeDrawer(); toast(isNew ? "Created." : "Saved."); productList(p.type);
  });
  const del = $("#delP");
  if (del) del.onclick = run(async () => {
    if (!confirm(`Delete ${p.name}? It will disappear from the shop. (To take it off sale for a while, use Hide instead.)`)) return;
    await api("products/" + p.id, { method: "DELETE" }); closeDrawer(); toast("Deleted."); productList(p.type);
  });
}
function upload(file) {
  if (file.size > 8e6) throw new Error("That photo is over 8 MB. Please use a smaller one.");
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => api("upload", { method: "POST", body: { name: file.name, dataUrl: r.result } }).then(d => resolve(d.path), reject);
    r.onerror = () => reject(new Error("Couldn't read that file."));
    r.readAsDataURL(file);
  });
}

// ---------- Reviews ----------
async function reviews() {
  const [list, prods] = await Promise.all([api("reviews"), api("products")]);
  state.reviews = list; state.products = prods;
  const name = id => (prods.find(p => p.id === id) || {}).name || "";
  const pending = list.filter(r => !r.published), live = list.filter(r => r.published);
  const card = r => `<div class="card rev"><div><b>${esc(r.name)}</b> <span class="meta">${[r.city, name(r.product), day(r.created_at), r.source === "website" ? "from the website" : ""].filter(Boolean).map(esc).join(" · ")}</span>
      <p>“${esc(r.text)}”</p></div>
    <div class="actions">${r.published ? `<button class="b sm" data-pub="${r.id}" data-v="0">Unpublish</button>` : `<button class="b sm primary" data-pub="${r.id}" data-v="1">Publish</button>`}
      <button class="b sm danger" data-delr="${r.id}">Delete</button></div></div>`;
  $("#page").innerHTML = `
    <div class="page-head"><div><h1>Reviews</h1><p>${live.length} published · ${pending.length} waiting for approval</p></div>
      <div class="actions"><button class="b primary" id="addR">+ Add review</button></div></div>
    <div id="addRBox"></div>
    <h2 style="font-size:20px">Waiting for approval</h2>
    <div class="reviews-list">${pending.map(card).join("") || `<div class="card empty" style="padding:22px">No new reviews. Reviews customers write on product pages show here first.</div>`}</div>
    <h2 style="font-size:20px;margin-top:26px">Published on the website</h2>
    <div class="reviews-list">${live.map(card).join("") || `<div class="card empty" style="padding:22px">None yet.</div>`}</div>`;
  $$("[data-pub]").forEach(b => b.onclick = run(async () => { await api("reviews/" + b.dataset.pub, { method: "PATCH", body: { published: b.dataset.v === "1" } }); toast(b.dataset.v === "1" ? "Published." : "Unpublished."); reviews(); refreshCounts(); }));
  $$("[data-delr]").forEach(b => b.onclick = run(async () => { if (!confirm("Delete this review?")) return; await api("reviews/" + b.dataset.delr, { method: "DELETE" }); toast("Deleted."); reviews(); refreshCounts(); }));
  $("#addR").onclick = () => {
    $("#addRBox").innerHTML = `<form class="card box form" id="rForm" style="margin-bottom:18px;max-width:680px">
      <div class="row"><label>Customer name *<input name="name" required></label><label>City<input name="city"></label></div>
      <label>Product<select name="product"><option value="">—</option>${prods.map(p => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join("")}</select></label>
      <label>Review *<textarea name="text" required></textarea></label>
      <div class="actions"><button class="b primary" type="submit">Publish review</button><button class="b" type="button" onclick="this.closest('form').remove()">Cancel</button></div></form>`;
    $("#rForm").onsubmit = run(async e => { e.preventDefault(); await api("reviews", { method: "POST", body: Object.fromEntries(new FormData(e.target)) }); toast("Review published."); reviews(); });
  };
}

// ---------- Promo codes ----------
async function promos() {
  state.promos = await api("promos");
  $("#page").innerHTML = `
    <div class="page-head"><div><h1>Promo codes</h1><p>Customers type these at checkout. The % comes off the order total (after the online saving, if they pay online).</p></div></div>
    <form class="card box form" id="promoForm" style="max-width:640px;margin-bottom:16px"><div class="row3" style="align-items:end">
      <label>Code<input name="code" required placeholder="e.g. NOURA10" style="text-transform:uppercase"></label>
      <label>Discount %<input name="pct" type="number" min="1" max="90" required placeholder="10"></label>
      <button class="b primary" type="submit" style="height:40px;justify-content:center">Add code</button></div></form>
    <div class="card table-wrap">${state.promos.length ? `<table class="table"><thead><tr><th>Code</th><th>Discount</th><th>Used</th><th>Status</th><th class="num">Actions</th></tr></thead><tbody>
      ${state.promos.map(p => `<tr><td class="oid">${esc(p.code)}</td><td>${p.pct}%</td><td>${p.uses} ${p.uses === 1 ? "order" : "orders"}</td>
        <td><span class="pill ${p.active ? "on" : "off"}">${p.active ? "Active" : "Off"}</span></td>
        <td class="num"><div class="actions" style="justify-content:flex-end"><button class="b sm" data-tog="${esc(p.code)}" data-v="${p.active ? 0 : 1}">${p.active ? "Turn off" : "Turn on"}</button>
          <button class="b sm danger" data-delp="${esc(p.code)}">Delete</button></div></td></tr>`).join("")}</tbody></table>` : `<div class="empty">No promo codes yet.</div>`}</div>`;
  $("#promoForm").onsubmit = run(async e => { e.preventDefault(); await api("promos", { method: "POST", body: Object.fromEntries(new FormData(e.target)) }); toast("Code added."); promos(); });
  $$("[data-tog]").forEach(b => b.onclick = run(async () => { await api("promos/" + encodeURIComponent(b.dataset.tog), { method: "PATCH", body: { active: b.dataset.v === "1" } }); promos(); }));
  $$("[data-delp]").forEach(b => b.onclick = run(async () => { if (!confirm(`Delete ${b.dataset.delp}?`)) return; await api("promos/" + encodeURIComponent(b.dataset.delp), { method: "DELETE" }); toast("Deleted."); promos(); }));
}

// ---------- Settings ----------
async function settings() {
  const s = state.settings = await api("settings");
  const v = k => esc(s[k] || "");
  $("#page").innerHTML = `
    <div class="page-head"><div><h1>Settings</h1><p>Contact details and payment info used across the website.</p></div></div>
    <div class="settings-grid">
      <form class="card box form" id="contactForm"><h2>Shop contact details</h2>
        <label>Phone (as shown on the site)<input name="phone" value="${v("phone")}"></label>
        <label>WhatsApp number <small>(orders and chat buttons go here)</small><input name="whatsapp" value="${v("whatsapp")}" placeholder="923xxxxxxxxx"></label>
        <label>Email<input name="email" type="email" value="${v("email")}"></label>
        <button class="b primary" type="submit" style="justify-self:start">Save</button></form>
      <form class="card box form" id="bankForm"><h2>Online payment (bank transfer)</h2>
        <p class="muted" style="margin:-4px 0 0;font-size:12.5px">Shown to customers who choose "Pay online" after they place their order.</p>
        <label>Bank<input name="bankName" value="${v("bankName")}" placeholder="e.g. Meezan Bank"></label>
        <label>Account title<input name="accountTitle" value="${v("accountTitle")}"></label>
        <div class="row"><label>Account number<input name="accountNumber" value="${v("accountNumber")}"></label><label>IBAN<input name="iban" value="${v("iban")}"></label></div>
        <label>Instructions<textarea name="payNote" style="min-height:60px">${v("payNote")}</textarea></label>
        <button class="b primary" type="submit" style="justify-self:start">Save</button></form>
      <form class="card box form" id="shipForm"><h2>Delivery charges</h2>
        <p class="muted" style="margin:-4px 0 0;font-size:12.5px">Added at checkout. Orders whose full price (before the online saving) reaches the free-delivery amount ship free. Put 0 as the fee to make delivery free on every order.</p>
        <div class="row"><label>Delivery fee (Rs)<input name="shippingFee" type="number" min="0" max="5000" value="${esc(s.shippingFee ?? 0)}"></label>
        <label>Free delivery from (Rs) <small>(0 = never)</small><input name="freeShipAt" type="number" min="0" value="${esc(s.freeShipAt ?? 0)}"></label></div>
        <button class="b primary" type="submit" style="justify-self:start">Save</button></form>
      <form class="card box form" id="passForm"><h2>Change password</h2>
        <label>Current password<input name="current" type="password" required autocomplete="current-password"></label>
        <label>New password <small>(8+ characters)</small><input name="next" type="password" required minlength="8" autocomplete="new-password"></label>
        <button class="b primary" type="submit" style="justify-self:start">Change password</button></form>
      <div class="card box"><h2>Backup</h2><p class="muted" style="margin-top:0">Download a copy of everything (orders, products, reviews, settings) as one file. Keep it somewhere safe, e.g. Google Drive.</p>
        <a class="b" href="/api/admin/backup" download>⬇ Download backup</a></div>
    </div>`;
  const save = id => $(id).onsubmit = run(async e => { e.preventDefault(); state.settings = await api("settings", { method: "PUT", body: Object.fromEntries(new FormData(e.target)) }); toast("Saved."); settings(); });
  save("#contactForm"); save("#bankForm"); save("#shipForm");
  addEyes($("#passForm"));
  $("#passForm").onsubmit = run(async e => { e.preventDefault(); await api("password", { method: "POST", body: Object.fromEntries(new FormData(e.target)) }); e.target.reset(); toast("Password changed."); });
}

// ---------- Drawer ----------
function openDrawer(html) {
  const d = $("#drawer"); d.innerHTML = html; d.scrollTop = 0;
  document.body.classList.add("drawer-open");
  $$("[data-close]", d).forEach(b => b.onclick = closeDrawer);
}
function closeDrawer() { document.body.classList.remove("drawer-open"); }
$("#scrim").onclick = closeDrawer;
document.addEventListener("keydown", e => { if (e.key === "Escape") closeDrawer(); });

const VIEWS = { Dashboard: dashboard, Orders: orders, Abandoned: abandoned, Products: products, Bundles: bundles, Reviews: reviews, Promos: promos, Settings: settings };
boot();

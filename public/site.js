// Good Noura — header/footer, product cards and cart for every page.
// Products, reviews and contact details come from /catalog.js (live from the database). Pay online = 10% off.
const GN = (() => {
  const PREPAID = 0.10;
  const CAT = window.GN_CATALOG;
  const S = CAT.settings;
  const PHONE = S.phone;
  const TEL = "tel:" + S.phone.replace(/D/g, "");
  const WHATSAPP = "https://wa.me/" + S.whatsapp;
  const EMAIL = S.email;
  const fmt = n => "Rs " + n.toLocaleString("en-US");
  // Photo for the chosen size (a sizes row can carry its own photo as a 3rd value), else the main photo
  const imgOf = (p, size) => { const z = p.sizes && p.sizes.find(r => r[0] === (size || (sel[p.id] || {}).size)); const g = z && p.sizeGallery && p.sizeGallery[z[0]]; return (g && g[0] && g[0][1]) || (z && z[2]) || p.img; };
  // Shipping: flat fee, free once the full (cash-on-delivery) price of the jars reaches FREE_AT. Set in Admin → Settings.
  const SHIP_FEE = +S.shippingFee || 0, FREE_AT = +S.freeShipAt || 0;
  const shipFor = fullPrice => !fullPrice || !SHIP_FEE || (FREE_AT && fullPrice >= FREE_AT) ? 0 : SHIP_FEE;
  const shipShort = !SHIP_FEE ? "Free delivery all over Pakistan" : FREE_AT ? `Free delivery on orders of ${fmt(FREE_AT)}+` : `Delivery ${fmt(SHIP_FEE)} all over Pakistan`;
  const shipLong = !SHIP_FEE ? "Delivery is free on every order, all over Pakistan."
    : FREE_AT ? `Free delivery all over Pakistan on orders of ${fmt(FREE_AT)} or more. Below that, delivery is ${fmt(SHIP_FEE)}.`
    : `Delivery is ${fmt(SHIP_FEE)} on every order, all over Pakistan.`;
  const online = n => Math.round(n * (1 - PREPAID));

  const products = CAT.products;
  const reviews = CAT.reviews;
  // Which jars each bundle contains (set per bundle in the admin)
  const contains = Object.fromEntries(products.filter(p => p.contains).map(p => [p.id, p.contains]));
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  const byId = id => products.find(p => p.id === id);
  const bundlesWith = id => products.filter(b => contains[b.id] && contains[b.id].includes(id));
  // Reviews for this product (or the jars in this bundle) first, then the rest
  const reviewsFor = p => {
    const ids = contains[p.id] || [p.id];
    return [...reviews.filter(r => ids.includes(r.product)), ...reviews.filter(r => !ids.includes(r.product))];
  };
  const reviewHTML = r => `<div class="review"><span class="avatar">${esc(r.name.split(" ").map(w => w[0]).join("").slice(0, 2))}</span>
    <div><b>${esc(r.name)}</b><p>“${esc(r.text)}”</p><span class="review-meta">${[r.city, (byId(r.product) || {}).name].filter(Boolean).map(esc).join(" · ")}</span></div></div>`;
  const url = p => `product.html?p=${p.id}`;

  // Selected size / peanut-butter choice per product, shared by every card on the page
  const sel = {};
  products.forEach(p => sel[p.id] = { size: p.sizes ? p.sizes[0][0] : null, choice: p.choice ? p.choice.opts[0] : null });
  const priceOf = p => p.sizes ? p.sizes.find(s => s[0] === sel[p.id].size)[1] : p.price;
  const onlineOf = p => p.sizes ? online(priceOf(p)) : p.onlinePrice;
  const savePct = p => Math.round((p.separate - p.price) / p.separate * 100);

  // Icons
  const ico = {
    bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M6 8h12l-1 12H7L6 8z"/><path d="M9 8V6.5a3 3 0 016 0V8"/></svg>',
    truck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="17.5" r="1.6"/><circle cx="17" cy="17.5" r="1.6"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21s-6-5.6-6-10.5a6 6 0 0112 0C18 15.4 12 21 12 21z"/><circle cx="12" cy="10.5" r="2.2"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
    leaf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14z"/><path d="M5 19l7-7"/></svg>',
    flask: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M9 3h6M10 3v6l-5 9a2 2 0 002 3h10a2 2 0 002-3l-5-9V3"/></svg>',
    jar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="6" y="3" width="12" height="4" rx="1"/><path d="M7 7h10v12a2 2 0 01-2 2H9a2 2 0 01-2-2z"/></svg>',
    cup: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 9h13v5a5 5 0 01-5 5H9a5 5 0 01-5-5z"/><path d="M17 11h1.5a2.5 2.5 0 010 5H17M8 3v3M12 3v3"/></svg>',
    toast: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M6 20V11a4 4 0 01-1-7h14a4 4 0 01-1 7v9z"/><path d="M9 14c1.5-1 4.5-1 6 0"/></svg>',
    bowl: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 11h18a9 9 0 01-18 0z"/><path d="M9 7c0-2 2-2 2-4M14 7c0-2 2-2 2-4"/></svg>',
    blender: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M7 3h10l-2 11H9z"/><rect x="7" y="14" width="10" height="7" rx="1.5"/></svg>',
    cake: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4 12h16v8H4z"/><path d="M4 15c2 1.5 4 1.5 6 0s4-1.5 6 0 4 1.5 4 0M12 12V8M12 5v.5"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a1 1 0 01-1 1A16 16 0 014 5a1 1 0 011-1z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4 20l1.5-4A8 8 0 1112 20a8 8 0 01-4-1z"/></svg>',
    gift: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="3" y="8" width="18" height="4"/><path d="M5 12v8h14v-8M12 8v12M12 8c-2-4-6-3-5 0M12 8c2-4 6-3 5 0"/></svg>',
  };

  // Simple jar drawing (used for the make-your-own-bundle slots)
  const jar = (lid, w = 90) => `<svg width="${w}" height="${w * 1.25}" viewBox="0 0 80 100" aria-hidden="true">
    <rect x="14" y="4" width="52" height="16" rx="4" fill="${lid}" stroke="rgba(0,0,0,.18)"/>
    <rect x="10" y="18" width="60" height="78" rx="10" fill="#f4ead9"/>
    <circle cx="40" cy="50" r="15" fill="${lid}" stroke="rgba(0,0,0,.12)"/>
    <rect x="22" y="72" width="36" height="4" rx="2" fill="#c8b8a0"/><rect x="28" y="80" width="24" height="3" rx="1.5" fill="#d8cab4"/></svg>`;

  // Product photo set: main photo, then generated pictures for each product (img/gen/<id>-<kind>.jpg)
  const pic = (src, alt) => `<img src="${src}" alt="${esc(alt)}" loading="lazy">`;
  const GEN = "img/gen/";
  function photos(p) {
    if (p.gallery) return p.gallery.map(([label, src]) => ({ label, html: pic(src, p.name + ": " + label) }));
    const hero = { label: "Main photo", html: pic(p.img, p.name) };
    if (p.type === "bundles") return [hero,
      { label: "What's inside", html: pic(GEN + p.id + "-inside.jpg", p.name + ": every jar in the box") },
      { label: "Savings", html: `<div class="ph" style="background:#f4ead9;flex-direction:column;text-align:center">
          <div><div style="font:600 18px var(--serif);color:#5a3220">Bundle &amp; save</div>
          <div style="font:700 54px/1 var(--serif);color:#8e3c19">${fmt(p.separate - p.price)}</div>
          <div style="font-size:13px;color:#5a3220;margin-top:6px">vs. buying each jar separately</div>
          <div style="font-size:13px;color:#5a3220;margin-top:14px">Pay online for <b>${fmt(p.onlinePrice)}</b></div></div></div>` },
      { label: "Lifestyle", html: pic(GEN + p.id + "-life.jpg", p.name + " on a breakfast table") },
    ];
    const dark = ["#5a3220", "#b7773d"].includes(p.color);
    return [hero,
      { label: "Flavour", html: pic(GEN + p.id + "-flavour.jpg", p.name + ": flavour") },
      { label: "Why you'll love it", html: `<div class="ph" style="background:${p.color}">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;width:80%;color:${dark ? "#f4ead9" : "#3a2116"};font-size:13px;font-weight:600;text-align:center">
          ${[[ico.leaf, "Natural ingredients"], [ico.heart, "No preservatives"], [ico.flask, "Small-batch made"], [ico.bowl, "Rich in protein"]].map(([i, t]) => `<div><div style="width:52px;height:52px;border-radius:50%;background:${dark ? "#f4ead9" : "#5a3220"};color:${dark ? "#5a3220" : "#f4ead9"};display:grid;place-items:center;margin:0 auto 8px;padding:13px">${i}</div>${t}</div>`).join("")}</div></div>` },
      { label: "Lifestyle", html: pic(GEN + p.id + "-life.jpg", p.name + " spread on toast") },
    ];
  }

  // Header / footer / cart drawer
  const NAV = [["index.html", "Home"], ["bundles.html", "Shop all"], ["bundles.html?filter=bundles", "Bundles"],
    ["make-your-own-bundle.html", "Make your own bundle"], ["our-story.html", "Our story"], ["contact.html", "Contact"]];
  function header(active) {
    return `<div class="announce"><div class="wrap">
        <span>Pay online &amp; <b>save 10%</b> on every order</span>
        <span>${shipShort} · Karachi in 24–48 hrs</span></div></div>
      <header class="site"><div class="wrap">
        <div style="display:flex;align-items:center;gap:14px">
          <button class="icon-btn menu-btn" aria-label="Menu" onclick="document.body.classList.toggle('menu-open')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
          <nav class="nav">${NAV.slice(1).map(([h, t]) => `<a href="${h}"${t === active ? ' class="active"' : ""}>${t}</a>`).join("")}</nav>
        </div>
        <a class="logo" href="index.html" aria-label="Good Noura home"><img src="img/logo-squirrel.png" alt="" width="64" height="64"><span>GOOD NOURA<small>Honest nut butters</small></span></a>
        <div class="tools">
          <a class="phone" href="${TEL}">${PHONE}</a>
          <a class="icon-btn hide-sm" aria-label="WhatsApp" href="${WHATSAPP}">${ico.chat}</a>
          <button class="icon-btn" aria-label="Cart" onclick="GN.openCart()">${ico.bag}<span class="cart-count" id="cartCount">0</span></button>
        </div></div></header>`;
  }
  function footer() {
    return `<footer class="site"><div class="wrap"><div class="cols">
        <div><h3>Rooted in care. Made to be loved.</h3><p>Honest nut butters, delivered free all over Pakistan.</p></div>
        <div><h4>Quick links</h4><ul>
          <li><a href="bundles.html">Shop all</a></li><li><a href="make-your-own-bundle.html">Make Your Own Bundle</a></li>
          <li><a href="our-story.html">Our Story</a></li><li><a href="contact.html">Contact Us</a></li>
          <li><a href="https://goodnoura.com/pages/privacy-policy">Privacy Policy</a></li><li><a href="https://goodnoura.com/pages/terms-and-conditions">Terms and Conditions</a></li></ul></div>
        <div><h4>Contact us</h4><ul>
          <li>Phone / WhatsApp: <a href="${TEL}">${PHONE}</a></li>
          <li>Email: <a href="mailto:${EMAIL}">${EMAIL}</a></li>
          <li><a href="https://www.facebook.com/Goodnoura">Facebook</a> &nbsp; <a href="https://www.instagram.com/good.noura">Instagram</a></li></ul></div>
      </div><div class="copy">© 2026 Good Noura</div></div></footer>
      <div class="scrim" onclick="GN.closeCart()"></div>
      <aside class="drawer" aria-label="Cart">
        <header><h2>Your cart</h2><button class="icon-btn" aria-label="Close cart" onclick="GN.closeCart()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></header>
        <div class="lines" id="lines"></div><footer id="cartFoot"></footer></aside>`;
  }
  const delivery = () => `<div class="delivery">
      <p><span class="gold" style="display:inline-flex;width:18px">${ico.clock}</span> <span>${shipLong}</span></p>
      <div class="steps">
        <div class="step"><i>${ico.bag}</i><b>Ordered</b><span>Today</span></div>
        <div class="step"><i>${ico.truck}</i><b>Karachi</b><span>24–48 hrs</span></div>
        <div class="step"><i>${ico.pin}</i><b>Other cities</b><span>4–6 business days</span></div></div></div>`;

  // Product card (collection, homepage, upsells)
  function card(p) {
    const s = sel[p.id], price = priceOf(p);
    const badges = p.type === "bundles"
      ? `<div class="badges">${p.badge ? `<span class="badge">${p.badge}</span>` : ""}<span class="badge dark">Save ${savePct(p)}%</span></div>` : "";
    const contents = p.items ? `<ul class="contents">${p.items.map(([n, w]) => `<li><span>${n}</span><span>${w}</span></li>`).join("")}</ul>` : "";
    const choice = p.choice ? `<p class="opt-label">${p.choice.label}</p><div class="opts">${p.choice.opts.map(o =>
      `<button class="opt" data-id="${p.id}" data-choice="${o}" aria-pressed="${o === s.choice}">${o}</button>`).join("")}</div>` : "";
    const sizes = p.sizes && p.sizes.length > 1
      ? `<div class="opts">${p.sizes.map(([z, v]) => `<button class="opt" data-id="${p.id}" data-size="${z}" aria-pressed="${z === s.size}">${z}<small>${fmt(v)}</small></button>`).join("")}</div>`
      : p.sizes ? `<div class="opts"><span class="opt" aria-pressed="true" style="flex:none">${p.sizes[0][0]}<small>Jar</small></span></div>` : "";
    const was = p.separate ? `<span class="was">${fmt(p.separate)}</span><span class="save">Save ${fmt(p.separate - price)}</span>` : "";
    return `<article class="card${p.featured ? " featured" : ""}">
      ${p.ribbon ? `<span class="ribbon">${p.ribbon}</span>` : ""}
      <a class="media" href="${url(p)}"><img src="${imgOf(p)}" alt="${p.name}" loading="lazy">${badges}</a>
      <div class="body">
        <h3 class="title"><a href="${url(p)}">${p.name}</a></h3>
        <p class="sub">${p.sub}</p>
        ${contents}${choice}${sizes}
        <div class="price-row"><span class="price">${fmt(price)}</span>${was}</div>
        <p class="online"><b>${fmt(onlineOf(p))}</b> when you pay online</p>
        <div class="card-actions">
          ${p.inStock === false ? `<button class="add sm" disabled>Sold out</button>` : `<button class="add sm" data-add="${p.id}">${ico.bag} Add to cart</button>`}
          <a class="shop-now" href="${url(p)}">Shop now</a>
        </div>
      </div></article>`;
  }

  // Containers registered here re-render when a size/choice changes
  const mounts = [];
  function mount(el, list) { mounts.push({ el, list }); el.innerHTML = list().map(card).join(""); }
  const rerender = () => { mounts.forEach(m => m.el.innerHTML = m.list().map(card).join("")); document.dispatchEvent(new Event("gn:select")); };

  // Cart, kept in this browser so it follows the shopper between pages
  let cart = [];
  try { cart = JSON.parse(localStorage.getItem("gn-cart") || "[]"); } catch (e) { cart = []; }
  const save = () => { try { localStorage.setItem("gn-cart", JSON.stringify(cart)); } catch (e) {} };
  function variantOf(p) { const s = sel[p.id]; return [s.size, s.choice ? `${s.choice} peanut butter` : null].filter(Boolean).join(" · "); }
  function addLine({ key, name, img, variant, price, onlinePrice }, qty = 1) {
    const line = cart.find(l => l.key === key);
    if (line) line.qty += qty; else cart.push({ key, name, img, variant, price, onlinePrice, qty });
    save(); renderCart();
  }
  function add(id, qty = 1, btn) {
    const p = byId(id);
    if (!p || p.inStock === false) return;
    const variant = variantOf(p);
    addLine({ key: id + "|" + variant, name: p.name, img: imgOf(p, variant), variant, price: priceOf(p), onlinePrice: onlineOf(p) }, qty);
    if (btn && !btn.closest(".drawer")) {
      const html = btn.innerHTML;
      btn.classList.add("added"); btn.innerHTML = "Added ✓";
      setTimeout(() => { btn.classList.remove("added"); btn.innerHTML = html; }, 1200);
      openCart();   // show the cart with its upsell suggestions
    }
  }

  // Cart upsell: bundles that contain what's in the cart, then jars that complete it
  function suggestions() {
    const inCart = new Set(cart.map(l => l.key.split("|")[0]));
    const score = p => {
      if (inCart.has(p.id)) return -1;
      let s = 0;
      if (p.inStock === false) return -1;
      if (p.type === "bundles") s += (contains[p.id] || []).filter(id => inCart.has(id)).length * 3 + 1;
      else s += bundlesWith(p.id).some(b => inCart.has(b.id)) ? 0 : 2;
      return s;
    };
    return products.map(p => [p, score(p)]).filter(([, s]) => s >= 0)
      .sort((a, b) => b[1] - a[1]).slice(0, 3).map(([p]) => p);
  }
  function upsellHTML() {
    const list = suggestions();
    if (!list.length) return "";
    return `<div class="upsell"><h3>${cart.length ? "Complete your order" : "Popular picks"}</h3>
      ${list.map(p => {
        const save = p.separate ? `<span class="save">Save ${fmt(p.separate - p.price)}</span>` : "";
        return `<div class="up-item"><a href="${url(p)}"><img src="${p.img}" alt=""></a>
          <div><a class="n" href="${url(p)}">${p.name}</a><div class="v">${fmt(priceOf(p))} ${save}</div></div>
          <button class="up-add" data-add="${p.id}" aria-label="Add ${p.name}">+ Add</button></div>`;
      }).join("")}</div>`;
  }
  function renderCart() {
    const count = cart.reduce((n, l) => n + l.qty, 0);
    const total = cart.reduce((n, l) => n + l.qty * l.price, 0);
    const totalOnline = cart.reduce((n, l) => n + l.qty * l.onlinePrice, 0);
    const ship = shipFor(total);
    const c = document.getElementById("cartCount"); if (c) c.textContent = count;
    const lines = document.getElementById("lines"); if (!lines) return;
    lines.innerHTML = cart.length ? cart.map((l, i) => `
      <div class="line"><img src="${l.img}" alt="">
        <div><div class="n">${l.name}</div><div class="v">${l.variant || "&nbsp;"}</div>
          <div class="qty"><button data-q="${i}" data-d="-1" aria-label="Decrease">−</button><span>${l.qty}</span><button data-q="${i}" data-d="1" aria-label="Increase">+</button></div></div>
        <div class="lp">${fmt(l.price * l.qty)}</div></div>`).join("") + upsellHTML()
      : `<p class="empty">Your cart is empty.</p>` + upsellHTML();
    document.getElementById("cartFoot").innerHTML = cart.length ? `
      <p class="ship">${ship && FREE_AT ? `Add <b>${fmt(FREE_AT - total)}</b> more for <b>free delivery</b>` : ship ? "Delivery all over Pakistan" : "<b>Free delivery</b> on this order"}</p>
      <div class="tot sm"><span>Delivery</span><span>${ship ? fmt(ship) : "Free"}</span></div>
      <div class="tot"><span>Total (cash on delivery)</span><span>${fmt(total + ship)}</span></div>
      <div class="tot sm"><span>Pay online</span><b>${fmt(totalOnline + ship)}</b></div>
      <a class="add" href="checkout.html">Check out</a>` : "";
  }
  const openCart = () => document.body.classList.add("cart-open");
  const closeCart = () => document.body.classList.remove("cart-open");
  const clearCart = () => { cart = []; save(); renderCart(); };

  function init(active) {
    document.getElementById("site-header").outerHTML = header(active);
    if (!document.querySelector("link[rel=icon]")) document.head.insertAdjacentHTML("beforeend", '<link rel="icon" href="img/logo-squirrel.png">');
    document.getElementById("site-footer").outerHTML = footer();
    document.addEventListener("click", e => {
      const opt = e.target.closest(".opt[data-id]");
      if (opt) {
        const s = sel[opt.dataset.id];
        if (opt.dataset.size) s.size = opt.dataset.size;
        if (opt.dataset.choice) s.choice = opt.dataset.choice;
        rerender(); return;
      }
      const a = e.target.closest("[data-add]");
      if (a) { add(a.dataset.add, 1, a); return; }
      const q = e.target.closest("[data-q]");
      if (q) { const l = cart[q.dataset.q]; l.qty += +q.dataset.d; if (l.qty <= 0) cart.splice(q.dataset.q, 1); save(); renderCart(); }
    });
    document.addEventListener("keydown", e => { if (e.key === "Escape") closeCart(); });
    renderCart();
  }

  return { products, byId, url, reviews, reviewsFor, reviewHTML, bundlesWith, sel, priceOf, onlineOf, savePct, fmt, online, ico, jar, photos, imgOf, delivery, shipFor, shipShort, shipLong, SHIP_FEE, FREE_AT, card, mount, rerender,
    add, addLine, openCart, closeCart, clearCart, cart: () => cart, esc, init, settings: S, PHONE, WHATSAPP, EMAIL };
})();

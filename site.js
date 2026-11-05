// Good Noura — shared data, header/footer, product cards and cart for every page.
// Prices come from Good_Noura_Pricing.xlsx (Revised Prices + Bundles tabs). Pay online = 10% off.
const GN = (() => {
  const PREPAID = 0.10;
  const PHONE = "0339 4888776";
  const WHATSAPP = "https://wa.me/923394888776";
  const EMAIL = "Goodnoura6@gmail.com";
  const IMG = f => `https://goodnoura.com/cdn/shop/files/${f}&width=800`;
  const fmt = n => "Rs " + n.toLocaleString("en-US");
  const online = n => Math.round(n * (1 - PREPAID));

  const products = [
    // Bundles
    { id: "good-noura-collection", type: "bundles", name: "The Good Noura Collection", featured: true, ribbon: "Most complete",
      sub: "One of every butter — the full Good Noura experience.",
      desc: "Almond, cashew and your favourite peanut butter in one box. The easiest way to try everything we make — or to gift it.",
      img: IMG("9.png?v=1793342684"), color: "#c9923f", lids: ["#e7d3b1", "#efe4c8", "#b7773d"],
      price: 6499, onlinePrice: 5849, separate: 7297,
      items: [["Almond Butter", "210g"], ["Cashew Butter", "210g"], ["Peanut Butter (your pick)", "510g"]],
      choice: { label: "Choose your peanut butter", opts: ["Creamy", "Crunchy", "Chocolate"] } },
    { id: "peanut-family-pack", type: "bundles", name: "Peanut Family Pack", badge: "Best seller",
      sub: "All three peanut butters in the big family jar.",
      desc: "Creamy, crunchy and chocolate — three 510g jars so everyone at home gets their favourite.",
      img: IMG("10.png?v=1793342723"), color: "#b7773d", lids: ["#d9a566", "#b7773d", "#5a3220"],
      price: 4599, onlinePrice: 4139, separate: 5097,
      items: [["Peanut Butter, Creamy", "510g"], ["Peanut Butter, Crunchy", "510g"], ["Peanut Butter, Chocolate", "510g"]] },
    { id: "almond-cashew-duo", type: "bundles", name: "Almond + Cashew Duo", badge: "Premium",
      sub: "Our two premium nut butters, side by side.",
      desc: "Silky almond butter and rich cashew butter. A premium pair for breakfast bowls, smoothies and baking.",
      img: IMG("7_2407298a-658f-4847-baa0-c2909dd6fe77.png?v=1793342598"), color: "#d8bf94", lids: ["#e7d3b1", "#efe4c8"],
      price: 4999, onlinePrice: 4499, separate: 5598,
      items: [["Almond Butter", "210g"], ["Cashew Butter", "210g"]] },
    // Single jars
    { id: "creamy-peanut-butter", type: "singles", name: "Peanut Butter, Creamy", flavour: "Creamy", sub: "Smooth, everyday spread.",
      desc: "Slow-roasted peanuts ground until silky smooth. Made for toast, parathas, apples and a spoon straight from the jar.",
      img: IMG("1_5abb56eb-77a4-4250-9613-587657da051a.png?v=1791733226"), color: "#d9a566", lids: ["#d9a566"],
      sizes: [["340g", 1349], ["510g", 1699]] },
    { id: "crunchy-peanut-butter", type: "singles", name: "Peanut Butter, Crunchy", flavour: "Crunchy", sub: "Real roasted peanut bits.",
      desc: "All the smoothness, with real roasted peanut pieces in every spoon. For people who like a bit of bite.",
      img: IMG("1_4eaec112-bbe3-426d-bda4-8c2e80568356.png?v=1791734896"), color: "#b7773d", lids: ["#b7773d"],
      sizes: [["340g", 1349], ["510g", 1699]] },
    { id: "chocolate-peanut-butter", type: "singles", name: "Peanut Butter, Chocolate", flavour: "Chocolate", sub: "Peanut butter meets cocoa.",
      desc: "Our peanut butter blended with cocoa. A dessert-worthy spread you can still have at breakfast.",
      img: IMG("1_c5d4d60c-ee6d-4963-a580-91d7075cdb87.png?v=1791735330"), color: "#5a3220", lids: ["#5a3220"],
      sizes: [["340g", 1349], ["510g", 1699]] },
    { id: "almond-butter", type: "singles", name: "Almond Butter", flavour: "Almond", sub: "Pure roasted almonds.",
      desc: "Roasted almonds ground into a smooth, mild butter. Lovely in smoothies, oats and on fruit.",
      img: "img/almond-1-main.webp", color: "#e7d3b1", lids: ["#e7d3b1"],
      gallery: [["Main photo", "img/almond-1-main.webp"], ["Flavour", "img/almond-2-flavour.webp"], ["Benefits", "img/almond-3-benefits.png"],
        ["How to use", "img/almond-4-uses.webp"], ["Nutrition", "img/almond-5-nutrition.png"]],
      ingredients: "100% roasted almonds. No additives, no preservatives.", allergen: "Contains tree nuts (almonds).",
      sizes: [["210g", 2799]] },
    { id: "cashew-butter", type: "singles", name: "Cashew Butter", flavour: "Cashew", sub: "Rich, creamy cashews.",
      desc: "Naturally sweet and creamy. Spread it, drizzle it, or stir it into curries and desserts.",
      img: IMG("1_ee49cee9-47ff-4176-b330-8d4a99a4417b.png?v=1791735966"), color: "#efe4c8", lids: ["#efe4c8"],
      sizes: [["210g", 2799]] },
  ];
  // Which jars each bundle contains (Collection lets the shopper pick any peanut butter)
  const PB = ["creamy-peanut-butter", "crunchy-peanut-butter", "chocolate-peanut-butter"];
  const contains = {
    "good-noura-collection": ["almond-butter", "cashew-butter", ...PB],
    "peanut-family-pack": PB,
    "almond-cashew-duo": ["almond-butter", "cashew-butter"],
  };

  // Customer reviews as published on goodnoura.com
  const reviews = [
    { name: "Ayesha Khan", city: "Lahore", product: "creamy-peanut-butter", text: "The creamy peanut butter is so smooth and delicious. It goes perfectly with my morning toast, and the packaging looks beautiful too!" },
    { name: "Hassan Raza", city: "Karachi", product: "crunchy-peanut-butter", text: "Really enjoyed the crunchy peanut butter. Great texture, rich peanut flavor, and something I would happily order again." },
    { name: "Zainab Malik", city: "Rawalpindi", product: "chocolate-peanut-butter", text: "A delicious chocolatey treat with my pancakes. I love how indulgent it feels." },
    { name: "Bilal Siddiqui", city: "Lahore", product: "almond-butter", text: "The almond butter is lovely on toast and in my breakfast oats. The presentation is beautiful." },
  ];

  const byId = id => products.find(p => p.id === id);
  const bundlesWith = id => products.filter(b => contains[b.id] && contains[b.id].includes(id));
  // Reviews for this product (or the jars in this bundle) first, then the rest
  const reviewsFor = p => {
    const ids = contains[p.id] || [p.id];
    return [...reviews.filter(r => ids.includes(r.product)), ...reviews.filter(r => !ids.includes(r.product))];
  };
  const reviewHTML = r => `<div class="review"><span class="avatar">${r.name.split(" ").map(w => w[0]).join("")}</span>
    <div><b>${r.name}</b><p>“${r.text}”</p><span class="review-meta">${r.city} · ${byId(r.product).name}</span></div></div>`;
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

  // Simple jar drawing for photo placeholders
  const jar = (lid, w = 90) => `<svg width="${w}" height="${w * 1.25}" viewBox="0 0 80 100" aria-hidden="true">
    <rect x="14" y="4" width="52" height="16" rx="4" fill="${lid}" stroke="rgba(0,0,0,.18)"/>
    <rect x="10" y="18" width="60" height="78" rx="10" fill="#f4ead9"/>
    <circle cx="40" cy="50" r="15" fill="${lid}" stroke="rgba(0,0,0,.12)"/>
    <rect x="22" y="72" width="36" height="4" rx="2" fill="#c8b8a0"/><rect x="28" y="80" width="24" height="3" rx="1.5" fill="#d8cab4"/></svg>`;
  const tag = (kind, text) => `<span class="ph-tag"><b>${kind}</b> · ${text}</span>`;

  // Product photo set, following the Potencia-style photo brief
  function photos(p) {
    if (p.gallery) return p.gallery.map(([label, src]) => ({ label, html: `<img src="${src}" alt="${p.name}: ${label}">` }));
    const hero = { label: "Main photo", html: `<img src="${p.img}" alt="${p.name}">`,
      note: "Current photo. Reshoot: jar on a clean light background with ingredients flying around it." };
    if (p.type === "bundles") return [hero,
      { label: "What's inside", html: `<div class="ph" style="background:${p.color}">
          <div style="display:flex;gap:6px;align-items:flex-end">${p.lids.map(l => jar(l, 70)).join("")}</div>
          ${tag("Photo to shoot", "every jar in the box, lined up, on a solid colour")}</div>` },
      { label: "Savings", html: `<div class="ph" style="background:#f4ead9;flex-direction:column;text-align:center">
          <div><div style="font:600 18px var(--serif);color:#5a3220">Bundle &amp; save</div>
          <div style="font:700 54px/1 var(--serif);color:#8e3c19">${fmt(p.separate - p.price)}</div>
          <div style="font-size:13px;color:#5a3220;margin-top:6px">vs. buying each jar separately</div></div>
          ${tag("Graphic", "savings tile with the new prices (replaces old stickers)")}</div>` },
      { label: "Lifestyle", html: `<div class="ph" style="background:linear-gradient(160deg,#4a2e1d,#2c1d14)">${jar(p.lids[0], 80)}
          ${tag("Photo to shoot", "the box opened on a breakfast table, family hands reaching in")}</div>` },
    ];
    return [hero,
      { label: "Flavour tile", html: `<div class="ph" style="background:${p.color};flex-direction:column">
          <div style="text-align:center"><div style="font:700 44px/1 var(--serif);color:${["#e7d3b1", "#efe4c8", "#d9a566"].includes(p.color) ? "#4a2e1d" : "#f4ead9"};margin-bottom:12px">${p.flavour}</div>${jar(p.flavour === "Chocolate" ? "#e8b04b" : "#8e3c19", 90)}</div>
          ${tag("Photo to shoot", `jar on a ${p.flavour.toLowerCase()}-coloured background, flavour name in big type`)}</div>` },
      { label: "Benefits", html: `<div class="ph" style="background:#f4ead9">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;width:78%;color:#5a3220;font-size:12px;font-weight:600;text-align:center">
          ${["[Protein per 100g]", "[Key ingredient %]", "[Free from …]", "[Energy / fibre]"].map(t => `<div><div style="width:46px;height:46px;border-radius:50%;background:#8e3c19;color:#f4ead9;display:grid;place-items:center;margin:0 auto 6px">${ico.leaf}</div>${t}</div>`).join("")}</div>
          ${tag("Graphic", "4 big benefit icons — fill in the real claims")}</div>` },
      { label: "Lifestyle", html: `<div class="ph" style="background:linear-gradient(160deg,#4a2e1d,#2c1d14)"><div style="display:flex;align-items:center;gap:10px;color:var(--gold)">${jar(p.lids[0], 80)}<span style="width:70px;display:block">${ico.toast}</span></div>
          ${tag("Photo to shoot", "hand spreading it on toast, paratha or a rice cake")}</div>` },
      { label: "Nutrition", html: `<div class="ph" style="background:#efe4c8">
          <div style="background:#fff;border:2px solid #4a2e1d;padding:12px 14px;width:62%;color:#2a1a0f;font-size:12px">
          <div style="font:700 15px var(--serif);border-bottom:6px solid #4a2e1d;padding-bottom:4px;margin-bottom:6px">Nutrition per 100g</div>
          ${["Energy", "Protein", "Carbohydrates", "Sugar", "Fat", "Fibre"].map(r => `<div style="display:flex;justify-content:space-between;border-bottom:1px solid #ccc;padding:3px 0"><span>${r}</span><span>[—]</span></div>`).join("")}</div>
          ${tag("Graphic", "nutrition table next to the jar — add real values")}</div>` },
    ];
  }

  // Header / footer / cart drawer
  const NAV = [["index.html", "Home"], ["bundles.html", "Shop all"], ["bundles.html?filter=bundles", "Bundles"],
    ["make-your-own-bundle.html", "Make your own bundle"], ["our-story.html", "Our story"], ["contact.html", "Contact"]];
  function header(active) {
    return `<div class="announce"><div class="wrap">
        <span>Pay online &amp; <b>save 10%</b> on every order</span>
        <span>Free delivery all over Pakistan · Karachi in 24–48 hrs</span></div></div>
      <header class="site"><div class="wrap">
        <div style="display:flex;align-items:center;gap:14px">
          <button class="icon-btn menu-btn" aria-label="Menu" onclick="document.body.classList.toggle('menu-open')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
          <nav class="nav">${NAV.slice(1).map(([h, t]) => `<a href="${h}"${t === active ? ' class="active"' : ""}>${t}</a>`).join("")}</nav>
        </div>
        <a class="logo" href="index.html"><img src="https://goodnoura.com/cdn/shop/files/fav_icon_circle.png?v=1789566538&width=120" alt=""><span>GOOD NOURA</span></a>
        <div class="tools">
          <a class="phone" href="tel:03394888776">${PHONE}</a>
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
          <li>Phone / WhatsApp: <a href="tel:03394888776">${PHONE}</a></li>
          <li>Email: <a href="mailto:${EMAIL}">${EMAIL}</a></li>
          <li><a href="https://www.facebook.com/Goodnoura">Facebook</a> &nbsp; <a href="https://www.instagram.com/good.noura">Instagram</a></li></ul></div>
      </div><div class="copy">© 2026 Good Noura</div></div></footer>
      <div class="scrim" onclick="GN.closeCart()"></div>
      <aside class="drawer" aria-label="Cart">
        <header><h2>Your cart</h2><button class="icon-btn" aria-label="Close cart" onclick="GN.closeCart()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></header>
        <div class="lines" id="lines"></div><footer id="cartFoot"></footer></aside>`;
  }
  const delivery = () => `<div class="delivery">
      <p><span class="gold" style="display:inline-flex;width:18px">${ico.clock}</span> <span><b>Free delivery</b> on every order, all over Pakistan</span></p>
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
      <a class="media" href="${url(p)}"><img src="${p.img}" alt="${p.name}" loading="lazy">${badges}</a>
      <div class="body">
        <h3 class="title"><a href="${url(p)}">${p.name}</a></h3>
        <p class="sub">${p.sub}</p>
        ${contents}${choice}${sizes}
        <div class="price-row"><span class="price">${fmt(price)}</span>${was}</div>
        <p class="online"><b>${fmt(onlineOf(p))}</b> when you pay online</p>
        <div class="card-actions">
          <button class="add sm" data-add="${p.id}">${ico.bag} Add to cart</button>
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
    const p = byId(id), variant = variantOf(p);
    addLine({ key: id + "|" + variant, name: p.name, img: p.img, variant, price: priceOf(p), onlinePrice: onlineOf(p) }, qty);
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
      if (p.type === "bundles") s += contains[p.id].filter(id => inCart.has(id)).length * 3 + 1;
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
    const c = document.getElementById("cartCount"); if (c) c.textContent = count;
    const lines = document.getElementById("lines"); if (!lines) return;
    lines.innerHTML = cart.length ? cart.map((l, i) => `
      <div class="line"><img src="${l.img}" alt="">
        <div><div class="n">${l.name}</div><div class="v">${l.variant || "&nbsp;"}</div>
          <div class="qty"><button data-q="${i}" data-d="-1" aria-label="Decrease">−</button><span>${l.qty}</span><button data-q="${i}" data-d="1" aria-label="Increase">+</button></div></div>
        <div class="lp">${fmt(l.price * l.qty)}</div></div>`).join("") + upsellHTML()
      : `<p class="empty">Your cart is empty.</p>` + upsellHTML();
    document.getElementById("cartFoot").innerHTML = cart.length ? `
      <p class="ship"><b>Free delivery</b> all over Pakistan</p>
      <div class="tot"><span>Total (cash on delivery)</span><span>${fmt(total)}</span></div>
      <div class="tot sm"><span>Pay online</span><b>${fmt(totalOnline)}</b></div>
      <button class="add">Check out</button>` : "";
  }
  const openCart = () => document.body.classList.add("cart-open");
  const closeCart = () => document.body.classList.remove("cart-open");

  function init(active) {
    document.getElementById("site-header").outerHTML = header(active);
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

  return { products, byId, url, reviews, reviewsFor, reviewHTML, bundlesWith, sel, priceOf, onlineOf, savePct, fmt, online, ico, jar, photos, delivery, card, mount, rerender,
    add, addLine, openCart, closeCart, init, PHONE, WHATSAPP, EMAIL };
})();

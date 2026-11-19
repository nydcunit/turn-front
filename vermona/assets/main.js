/* ==========================================================================
   Vermona — shared site script
   Renders shared header/footer/cart, handles cart state, sliders, accordions.
   ========================================================================== */
(function () {
  "use strict";

  /* ------------------------------------------------------------------
     CONFIG — edit product data, pricing and copy here
     ------------------------------------------------------------------ */
  const PRODUCT = {
    id: "vermona-30ml",
    name: "Vermona Advanced Dark Spot Corrector",
    size: "30 ml / 1.0 fl oz",
    price: 129,
    compareAt: 159,
  };

  const BUNDLES = {
    single: { label: "1 Bottle", supply: "8-week supply", units: 1, total: 129 },
    duo: { label: "2 Bottles", supply: "16-week supply", units: 2, total: 229 },
    trio: { label: "3 Bottles", supply: "24-week supply", units: 3, total: 309 },
  };
  const SUBSCRIBE_DISCOUNT = 0.15; // 15% off subscribe & save
  const FREE_SHIPPING_AT = 100;

  /* SAMPLE REVIEWS — placeholder copy for layout only.
     Replace with real, verified customer reviews (e.g. from Judge.me,
     Yotpo, Okendo, Trustpilot) before launch. Publishing invented reviews
     violates FTC rules (16 CFR Part 465) and similar laws elsewhere. */
  const RATING = { average: 4.8, count: 0 /* set from your review platform */ };
  const REVIEWS = [
    { name: "Customer A", initials: "A", rating: 5, concern: "Sun spots", weeks: 6,
      title: "Spots on my cheeks visibly lighter", body: "Sample review text. Replace with a real verified customer review describing their experience, routine and timeline." },
    { name: "Customer B", initials: "B", rating: 5, concern: "Post-acne marks", weeks: 4,
      title: "Gentle and absorbs fast", body: "Sample review text. Replace with a real verified customer review describing their experience, routine and timeline." },
    { name: "Customer C", initials: "C", rating: 5, concern: "Melasma", weeks: 10,
      title: "Finally something that doesn't irritate", body: "Sample review text. Replace with a real verified customer review describing their experience, routine and timeline." },
    { name: "Customer D", initials: "D", rating: 4, concern: "Uneven tone", weeks: 8,
      title: "Glowier, more even skin", body: "Sample review text. Replace with a real verified customer review describing their experience, routine and timeline." },
    { name: "Customer E", initials: "E", rating: 5, concern: "Dark spots", weeks: 6,
      title: "Worth it", body: "Sample review text. Replace with a real verified customer review describing their experience, routine and timeline." },
    { name: "Customer F", initials: "F", rating: 5, concern: "Post-inflammatory marks", weeks: 5,
      title: "Works on deeper skin tones", body: "Sample review text. Replace with a real verified customer review describing their experience, routine and timeline." },
  ];

  /* ------------------------------------------------------------------
     Helpers
     ------------------------------------------------------------------ */
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const money = (n) => "$" + n.toFixed(n % 1 ? 2 : 0);
  const page = document.body.dataset.page || "";

  const ICONS = {
    cart: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 7h12l-1 13H7L6 7z"/><path d="M9 7V5a3 3 0 0 1 6 0v2"/></svg>',
    menu: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    close: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    check: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>',
  };

  /* Product bottle illustration (inline SVG) */
  let bottleId = 0;
  function bottleSVG(cls = "bottle") {
    const u = "v" + ++bottleId;
    return `<svg class="${cls}" viewBox="0 0 200 420" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Vermona serum bottle">
      <defs>
        <linearGradient id="${u}glass" x1="0" x2="1">
          <stop offset="0" stop-color="#2a1e2e"/><stop offset=".35" stop-color="#4b3650"/>
          <stop offset=".6" stop-color="#3a2a3f"/><stop offset="1" stop-color="#1e1522"/>
        </linearGradient>
        <linearGradient id="${u}cap" x1="0" x2="1">
          <stop offset="0" stop-color="#8f6a4f"/><stop offset=".45" stop-color="#e3c39a"/>
          <stop offset=".7" stop-color="#c9a46a"/><stop offset="1" stop-color="#7d5a40"/>
        </linearGradient>
        <linearGradient id="${u}bulb" x1="0" x2="1">
          <stop offset="0" stop-color="#1b141e"/><stop offset=".4" stop-color="#3d2f42"/><stop offset="1" stop-color="#140e16"/>
        </linearGradient>
      </defs>
      <ellipse cx="100" cy="40" rx="30" ry="36" fill="url(#${u}bulb)"/>
      <rect x="68" y="66" width="64" height="70" rx="6" fill="url(#${u}cap)"/>
      <rect x="68" y="128" width="64" height="6" fill="#6b4c37" opacity=".5"/>
      <path d="M40 160 Q40 136 66 136 H134 Q160 136 160 160 V392 Q160 414 138 414 H62 Q40 414 40 392 Z" fill="url(#${u}glass)"/>
      <path d="M52 166 V384" stroke="#fff" stroke-opacity=".18" stroke-width="6" stroke-linecap="round"/>
      <rect x="52" y="218" width="96" height="140" rx="4" fill="#f6efe7"/>
      <circle cx="100" cy="246" r="10" fill="none" stroke="#b5806a" stroke-width="1.5"/>
      <circle cx="100" cy="246" r="4" fill="#b5806a"/>
      <text x="100" y="282" text-anchor="middle" font-family="Georgia, serif" font-size="14" letter-spacing="2.4" fill="#261b2a">VERMONA</text>
      <line x1="76" y1="292" x2="124" y2="292" stroke="#b5806a" stroke-width=".8"/>
      <text x="100" y="308" text-anchor="middle" font-family="Arial, sans-serif" font-size="5.6" letter-spacing=".8" fill="#4a4351">ADVANCED DARK SPOT</text>
      <text x="100" y="318" text-anchor="middle" font-family="Arial, sans-serif" font-size="5.6" letter-spacing=".8" fill="#4a4351">CORRECTOR</text>
      <text x="100" y="342" text-anchor="middle" font-family="Arial, sans-serif" font-size="5.6" letter-spacing="1" fill="#7a7180">30 ml · 1.0 fl oz</text>
    </svg>`;
  }

  /* Illustrative skin close-up for the before/after slider.
     tone: base colour, spots: [x,y,r], strength: 0..1 spot visibility.
     Replace with real (consented, unretouched) customer photos via
     data-before / data-after image URLs on the .ba-slider element. */
  let skinId = 0;
  function skinSVG(tone, shade, spots, strength, glow) {
    const u = "s" + ++skinId;
    const spotEls = spots
      .map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.82}" fill="${shade}" opacity="${(0.8 * strength).toFixed(2)}" filter="url(#${u}b)"/>`)
      .join("");
    const pores = Array.from({ length: 70 }, (_, i) => {
      const x = (i * 53) % 400, y = (i * 97) % 440;
      return `<circle cx="${x}" cy="${y}" r="1.1" fill="#000" opacity=".05"/>`;
    }).join("");
    return `<svg viewBox="0 0 400 440" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="${u}b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="7"/></filter>
        <radialGradient id="${u}l" cx=".35" cy=".3" r=".9">
          <stop offset="0" stop-color="#fff" stop-opacity="${glow}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="${u}s" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${tone}"/><stop offset="1" stop-color="${shade}" stop-opacity=".55"/>
        </linearGradient>
      </defs>
      <rect width="400" height="440" fill="${tone}"/>
      <rect width="400" height="440" fill="url(#${u}s)" opacity=".5"/>
      ${spotEls}${pores}
      <rect width="400" height="440" fill="url(#${u}l)"/>
    </svg>`;
  }

  const BA_CASES = {
    deep: { tone: "#8a5a3c", shade: "#3e2214",
      spots: [[110, 140, 30], [250, 110, 22], [300, 230, 36], [150, 290, 26], [220, 350, 18], [90, 380, 20], [330, 360, 16]] },
    medium: { tone: "#c99673", shade: "#6e4027",
      spots: [[130, 120, 22], [270, 150, 28], [180, 230, 18], [320, 290, 24], [110, 310, 30], [240, 380, 20]] },
    light: { tone: "#f0cdb4", shade: "#a8684a",
      spots: [[90, 110, 14], [160, 150, 10], [230, 120, 12], [300, 170, 16], [140, 250, 18], [260, 270, 13], [200, 340, 15], [320, 350, 10], [100, 380, 12]] },
  };

  /* ------------------------------------------------------------------
     Shared layout: header, footer, cart drawer
     ------------------------------------------------------------------ */
  function renderLayout() {
    const header = $("#site-header");
    if (header) {
      const link = (href, label, key) =>
        `<li><a href="${href}" class="${page === key ? "active" : ""}">${label}</a></li>`;
      header.outerHTML = `
        <div class="announce">Free shipping on all orders over $${FREE_SHIPPING_AT} &nbsp;·&nbsp; <strong>60-day money-back guarantee</strong></div>
        <header class="site-header">
          <nav class="container nav" aria-label="Main">
            <button class="menu-toggle" aria-label="Open menu" aria-expanded="false">${ICONS.menu}</button>
            <a class="logo" href="index.html"><span class="logo-mark" aria-hidden="true"></span>VERMONA</a>
            <ul class="nav-links">
              ${link("index.html#science", "The Science", "")}
              ${link("index.html#results", "Results", "")}
              ${link("index.html#reviews", "Reviews", "")}
              ${link("product.html", "Shop", "product")}
              ${link("faq.html", "FAQ", "faq")}
            </ul>
            <div class="nav-actions">
              <a href="product.html" class="btn btn-primary" style="padding:11px 22px">Shop Now</a>
              <button class="cart-btn" aria-label="Open cart">${ICONS.cart}<span class="cart-count" data-count="0">0</span></button>
            </div>
          </nav>
        </header>`;
    }

    const footer = $("#site-footer");
    if (footer) {
      footer.outerHTML = `
        <footer class="site-footer">
          <div class="container">
            <div class="footer-grid">
              <div>
                <a class="logo" href="index.html"><span class="logo-mark" aria-hidden="true"></span>VERMONA</a>
                <p>Dermatologist-guided formulas for clearer, more even-looking skin, made for every skin tone.</p>
              </div>
              <div>
                <h5>Shop</h5>
                <ul>
                  <li><a href="product.html">Dark Spot Corrector</a></li>
                  <li><a href="product.html#bundles">Bundles &amp; Save</a></li>
                  <li><a href="product.html#subscribe">Subscribe &amp; Save</a></li>
                </ul>
              </div>
              <div>
                <h5>Help</h5>
                <ul>
                  <li><a href="faq.html">FAQ</a></li>
                  <li><a href="faq.html#shipping">Shipping &amp; Returns</a></li>
                  <li><a href="faq.html#contact">Contact Us</a></li>
                </ul>
              </div>
              <div>
                <h5>Join the list</h5>
                <p>Skincare tips and early access to offers.</p>
                <form class="newsletter" data-newsletter>
                  <label class="visually-hidden" for="nl-email">Email address</label>
                  <input id="nl-email" type="email" placeholder="Your email" required />
                  <button class="btn btn-accent" type="submit">Join</button>
                </form>
              </div>
            </div>
            <p class="disclaimer">
              *These statements have not been evaluated by the Food and Drug Administration. This product is a cosmetic and is not
              intended to diagnose, treat, cure or prevent any disease. Individual results vary. Before-and-after images are illustrative.
              Always patch test before first use and use daily broad-spectrum SPF 30+ while using brightening products.
              Consult a dermatologist about persistent, changing or unusual skin pigmentation.
            </p>
            <div class="footer-bottom">
              <span>© ${new Date().getFullYear()} Vermona Skincare. All rights reserved.</span>
              <span><a href="#">Privacy</a> &nbsp;·&nbsp; <a href="#">Terms</a> &nbsp;·&nbsp; <a href="#">Accessibility</a></span>
            </div>
          </div>
        </footer>`;
    }

    document.body.insertAdjacentHTML(
      "beforeend",
      `<div class="overlay" data-close-cart></div>
       <aside class="drawer" aria-label="Shopping cart" aria-hidden="true">
         <div class="drawer-head"><h3>Your Cart</h3><button class="icon-btn" data-close-cart aria-label="Close cart">${ICONS.close}</button></div>
         <div class="drawer-body"></div>
         <div class="drawer-foot"></div>
       </aside>
       <div class="toast" role="status" aria-live="polite"></div>`
    );

    $$("[data-bottle]").forEach((el) => (el.outerHTML = bottleSVG(el.dataset.bottle || "bottle")));
  }

  /* ------------------------------------------------------------------
     Cart (localStorage-backed)
     ------------------------------------------------------------------ */
  const CART_KEY = "vermona_cart_v1";
  const cart = {
    items: [],
    load() {
      try { this.items = JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch (e) { this.items = []; }
    },
    save() {
      try { localStorage.setItem(CART_KEY, JSON.stringify(this.items)); } catch (e) { /* storage unavailable */ }
      renderCart();
    },
    add(item) {
      const existing = this.items.find((i) => i.key === item.key);
      if (existing) existing.qty += item.qty;
      else this.items.push(item);
      this.save();
    },
    setQty(key, qty) {
      const it = this.items.find((i) => i.key === key);
      if (!it) return;
      it.qty = Math.max(1, Math.min(10, qty));
      this.save();
    },
    remove(key) { this.items = this.items.filter((i) => i.key !== key); this.save(); },
    count() { return this.items.reduce((n, i) => n + i.qty, 0); },
    subtotal() { return this.items.reduce((n, i) => n + i.unitPrice * i.qty, 0); },
  };

  function lineFor(bundleKey, subscribe) {
    const b = BUNDLES[bundleKey];
    const unitPrice = subscribe ? +(b.total * (1 - SUBSCRIBE_DISCOUNT)).toFixed(2) : b.total;
    return {
      key: `${bundleKey}-${subscribe ? "sub" : "once"}`,
      title: `${PRODUCT.name.replace("Vermona ", "")}`,
      variant: `${b.label} · ${b.supply}${subscribe ? " · Subscribe & Save" : ""}`,
      unitPrice,
    };
  }

  function renderCart() {
    $$(".cart-count").forEach((el) => { el.textContent = cart.count(); el.dataset.count = cart.count(); });
    const body = $(".drawer-body"), foot = $(".drawer-foot");
    if (!body) return;
    if (!cart.items.length) {
      body.innerHTML = `<div class="drawer-empty"><p>Your cart is empty.</p><a href="product.html" class="btn btn-primary">Shop Vermona</a></div>`;
      foot.innerHTML = "";
      return;
    }
    body.innerHTML = cart.items.map((i) => `
      <div class="cart-item">
        <div class="cart-thumb">${bottleSVG("")}</div>
        <div>
          <h4>${i.title}</h4>
          <small>${i.variant}</small>
          <small>${money(i.unitPrice)} ×
            <button class="icon-btn" data-dec="${i.key}" aria-label="Decrease quantity">−</button>
            ${i.qty}
            <button class="icon-btn" data-inc="${i.key}" aria-label="Increase quantity">+</button>
          </small>
          <button class="remove" data-remove="${i.key}">Remove</button>
        </div>
        <strong>${money(i.unitPrice * i.qty)}</strong>
      </div>`).join("");
    const sub = cart.subtotal();
    const remaining = Math.max(0, FREE_SHIPPING_AT - sub);
    foot.innerHTML = `
      <div class="ship-progress">${remaining > 0 ? `You're ${money(remaining)} away from free shipping` : "🎉 You've unlocked free shipping"}
        <div class="ship-bar"><span style="width:${Math.min(100, (sub / FREE_SHIPPING_AT) * 100)}%"></span></div></div>
      <div class="drawer-row"><span>Subtotal</span><span>${money(sub)}</span></div>
      <div class="drawer-row"><span>Shipping</span><span>${remaining > 0 ? "Calculated at checkout" : "Free"}</span></div>
      <div class="drawer-row total"><span>Total</span><span>${money(sub)}</span></div>
      <button class="btn btn-primary btn-block btn-lg" data-checkout>Secure Checkout</button>
      <p class="footnote center">60-day money-back guarantee</p>`;
  }

  function openCart() {
    $(".drawer").classList.add("open"); $(".overlay").classList.add("open");
    $(".drawer").setAttribute("aria-hidden", "false");
  }
  function closeCart() {
    $(".drawer").classList.remove("open"); $(".overlay").classList.remove("open");
    $(".drawer").setAttribute("aria-hidden", "true");
  }

  let toastTimer;
  function toast(msg) {
    const t = $(".toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 2800);
  }

  /* ------------------------------------------------------------------
     Global events
     ------------------------------------------------------------------ */
  function bindGlobal() {
    document.addEventListener("click", (e) => {
      const t = e.target.closest("button, a, [data-close-cart]");
      if (!t) return;
      if (t.matches(".cart-btn")) openCart();
      else if (t.matches("[data-close-cart]")) closeCart();
      else if (t.dataset.inc) cart.setQty(t.dataset.inc, cart.items.find((i) => i.key === t.dataset.inc).qty + 1);
      else if (t.dataset.dec) cart.setQty(t.dataset.dec, cart.items.find((i) => i.key === t.dataset.dec).qty - 1);
      else if (t.dataset.remove) cart.remove(t.dataset.remove);
      else if (t.matches("[data-checkout]")) {
        // TODO: connect to Stripe Checkout / Shopify Buy SDK / your payment provider here.
        toast("Checkout isn't connected yet — hook up your payment provider in main.js");
      } else if (t.matches("[data-quick-add]")) {
        e.preventDefault();
        const l = lineFor("single", false);
        cart.add({ ...l, qty: 1 });
        toast("Added to cart"); openCart();
      } else if (t.matches(".menu-toggle")) {
        const links = $(".nav-links"); const open = links.classList.toggle("open");
        t.setAttribute("aria-expanded", open);
      }
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeCart(); });
    $$("[data-newsletter]").forEach((f) => f.addEventListener("submit", (e) => {
      e.preventDefault(); f.reset(); toast("Thanks — you're on the list.");
    }));
  }

  /* ------------------------------------------------------------------
     Components
     ------------------------------------------------------------------ */
  function initAccordions() {
    $$(".accordion-trigger").forEach((btn) => {
      const panel = btn.nextElementSibling;
      if (btn.getAttribute("aria-expanded") === "true") panel.style.maxHeight = panel.scrollHeight + "px";
      btn.addEventListener("click", () => {
        const open = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", !open);
        panel.style.maxHeight = open ? 0 : panel.scrollHeight + "px";
      });
    });
  }

  function initBeforeAfter() {
    $$(".ba-slider").forEach((slider) => {
      const c = BA_CASES[slider.dataset.case];
      const before = slider.dataset.before, after = slider.dataset.after;
      const layerB = $(".ba-before", slider), layerA = $(".ba-after", slider);
      if (before && after) {
        layerB.innerHTML = `<img src="${before}" alt="Before" loading="lazy">`;
        layerA.innerHTML = `<img src="${after}" alt="After" loading="lazy">`;
      } else if (c) {
        layerB.innerHTML = skinSVG(c.tone, c.shade, c.spots, 1, 0.12);
        layerA.innerHTML = skinSVG(c.tone, c.shade, c.spots, 0.22, 0.28);
      }
      const range = $(".ba-range", slider), handle = $(".ba-handle", slider);
      const set = (v) => { layerA.style.clipPath = `inset(0 0 0 ${v}%)`; handle.style.left = v + "%"; };
      range.addEventListener("input", () => set(range.value));
      set(range.value);
    });
  }

  function stars(n) { return "★★★★★".slice(0, Math.round(n)) + "☆☆☆☆☆".slice(0, 5 - Math.round(n)); }

  function initReviews() {
    $$("[data-reviews]").forEach((wrap) => {
      const limit = +wrap.dataset.reviews || REVIEWS.length;
      wrap.innerHTML = REVIEWS.slice(0, limit).map((r) => `
        <article class="review reveal">
          <div class="stars" aria-label="${r.rating} out of 5 stars">${stars(r.rating)}</div>
          <h4>${r.title}</h4>
          <p>${r.body}</p>
          <div class="reviewer">
            <div class="avatar">${r.initials}</div>
            <div>
              <div><strong>${r.name}</strong> <span class="verified">${ICONS.check} Verified buyer</span></div>
              <div class="review-concern">${r.concern} · used for ${r.weeks} weeks</div>
            </div>
          </div>
        </article>`).join("");
    });
    $$("[data-rating-avg]").forEach((el) => (el.textContent = RATING.average.toFixed(1)));
    $$("[data-rating-count]").forEach((el) => (el.textContent = RATING.count ? RATING.count.toLocaleString() + " reviews" : "Customer reviews"));
  }

  function initReveal() {
    const els = $$(".reveal");
    if (!("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("in")); return; }
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
    }), { threshold: 0.12 });
    els.forEach((e) => io.observe(e));
  }

  /* ---------- Product page ---------- */
  function initProductPage() {
    const form = $("#buy-form");
    if (!form) return;

    // Gallery
    $$(".thumb").forEach((th, i) => th.addEventListener("click", () => {
      $$(".thumb").forEach((t) => t.classList.remove("active"));
      $$(".gallery-main .slide").forEach((s) => s.classList.remove("active"));
      th.classList.add("active"); $$(".gallery-main .slide")[i].classList.add("active");
    }));

    const priceEl = $("#pdp-price"), wasEl = $("#pdp-was"), saveEl = $("#pdp-save"), mobilePrice = $("#mobile-price");
    const qtyInput = $("#qty");

    function current() {
      const bundle = form.bundle.value;
      const subscribe = form.ptype.value === "subscribe";
      return { bundle, subscribe, line: lineFor(bundle, subscribe) };
    }

    function update() {
      const { bundle, subscribe, line } = current();
      const b = BUNDLES[bundle];
      const was = PRODUCT.compareAt * b.units;
      priceEl.textContent = money(line.unitPrice);
      mobilePrice.textContent = money(line.unitPrice);
      wasEl.textContent = money(was);
      const pct = Math.round((1 - line.unitPrice / was) * 100);
      saveEl.textContent = `Save ${pct}%`;
      $$(".bundle").forEach((el) => {
        const key = el.querySelector("input").value, bb = BUNDLES[key];
        const p = subscribe ? bb.total * (1 - SUBSCRIBE_DISCOUNT) : bb.total;
        el.querySelector("[data-bundle-price]").textContent = money(+p.toFixed(2));
        el.querySelector("[data-bundle-each]").textContent = money(+(p / bb.units).toFixed(2)) + " / bottle";
      });
    }

    form.addEventListener("change", update);
    $$("[data-qty]").forEach((b) => b.addEventListener("click", () => {
      qtyInput.value = Math.max(1, Math.min(10, (+qtyInput.value || 1) + +b.dataset.qty));
    }));
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const { line } = current();
      cart.add({ ...line, qty: Math.max(1, Math.min(10, +qtyInput.value || 1)) });
      toast("Added to cart"); openCart();
    });
    $("#mobile-add").addEventListener("click", () => form.requestSubmit());

    // Mobile sticky bar visible after scrolling past the buy button
    const mobileBar = $(".mobile-buy"), buyBtn = $("#add-to-cart");
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([en]) => mobileBar.classList.toggle("show", !en.isIntersecting && en.boundingClientRect.top < 0))
        .observe(buyBtn);
    }
    update();
  }

  /* ---------- FAQ page ---------- */
  function initFaq() {
    const search = $("#faq-search");
    if (!search) return;
    const items = $$(".faq-group .accordion-item");
    search.addEventListener("input", () => {
      const q = search.value.trim().toLowerCase();
      let shown = 0;
      items.forEach((it) => {
        const match = !q || it.textContent.toLowerCase().includes(q);
        it.style.display = match ? "" : "none";
        if (match) shown++;
      });
      $$(".faq-group").forEach((g) => {
        const any = $$(".accordion-item", g).some((it) => it.style.display !== "none");
        g.style.display = any ? "" : "none";
      });
      $(".faq-empty").style.display = shown ? "none" : "block";
    });

    const links = $$(".faq-nav a");
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => entries.forEach((en) => {
        if (en.isIntersecting) {
          links.forEach((l) => l.classList.toggle("active", l.getAttribute("href") === "#" + en.target.id));
        }
      }), { rootMargin: "-30% 0px -60% 0px" });
      $$(".faq-group").forEach((g) => io.observe(g));
    }
  }

  /* ------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------ */
  document.addEventListener("DOMContentLoaded", () => {
    renderLayout();
    cart.load();
    renderCart();
    bindGlobal();
    initAccordions();
    initBeforeAfter();
    initReviews();
    initProductPage();
    initFaq();
    initReveal();
  });
})();

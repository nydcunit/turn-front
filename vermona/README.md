# Vermona: product website

A static marketing and storefront site for **Vermona Advanced Dark Spot Corrector** ($129). It has no build step or dependencies.

| Page | Purpose |
|---|---|
| `index.html` | Landing page: hero, science, benefits, before/after sliders, ingredients, timeline, how-to, reviews, CTA |
| `product.html` | Purchase page: gallery, bundles (1/2/3 bottles), subscribe & save, quantity, cart drawer, details accordion |
| `faq.html` | Searchable FAQ grouped by topic |
| `assets/styles.css` | All styles (design tokens at the top) |
| `assets/main.js` | Shared header/footer, cart (localStorage), sliders, accordions, product logic |

## Run locally
```bash
cd vermona && python3 -m http.server 8080   # open http://localhost:8080
```

## Before launch: things you must replace
- **Reviews**: `REVIEWS` and `RATING` in `assets/main.js` are placeholders. Use real, verified reviews (Judge.me, Yotpo, Okendo…). Fake reviews are illegal in the US (FTC 16 CFR 465), the UK and the EU.
- **Before/after images**: the sliders show generated illustrations. Add real, consented, unretouched photos with `data-before="…" data-after="…"` on each `.ba-slider`.
- **Claims**: you need evidence for "2 weeks", "8 weeks", "dermatologist tested", the ingredient percentages and the INCI list. Match them to your formula and your testing.
- **Checkout**: the `[data-checkout]` handler in `main.js` is a stub. Connect Stripe Checkout, the Shopify Buy SDK or similar.
- **Support email**: `support@example.com` in `faq.html`.

## Versions
- `index.html`, `product.html`, `faq.html`: first version (warm plum/cream, multi-page).
- `v2/index.html`: current version. Clinical design inspired by telehealth dermatology brands: conditions, pigment science, results, skin assessment, and separate Treatment (product) and FAQ pages. Also published as a Claude artifact.
- `v3/index.html`: latest. Reimagined from scratch: live-rendered skin hero with a week-12 lens, 16-week course scrubber, formula, skin-tone spectrum, comparison table, assessment, Treatment and FAQ pages. Published as the Claude artifact.
- `v4/index.html`: latest. Rebuilt on the Musely site pattern (promo bar, centred wordmark header, dark hero, shop by concern, before/after carousel, comparison table, guarantee band, steps, community teaser, blush footer). Published as the Claude artifact.

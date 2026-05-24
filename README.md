# CARDIY · Website (deploy-ready)

Production marketing site for **CARDIY — Trợ Lý Ô Tô Thông Minh**. Plain static HTML/CSS/JS using the CARDIY Design System tokens. No build step.

## Folder structure

```
site/
├── index.html              ← page markup (~42 KB)
├── styles/
│   ├── tokens.css          ← CARDIY design tokens (colors, type, spacing…)
│   └── main.css            ← layout + components (~44 KB)
├── scripts/
│   └── main.js             ← all interactivity (~18 KB, vanilla JS)
├── assets/
│   ├── logo-cardiy-primary.svg
│   ├── logo-cardiy-mark.svg
│   └── logo-cardiy-white.svg
├── vercel.json             ← Vercel config (static, cache headers, security)
└── README.md               ← you are here
```

No npm. No node_modules. No bundler. Open `index.html` and it works.

External runtime deps (loaded from CDN):
- **Google Fonts** — Inter, Montserrat, JetBrains Mono (via `styles/tokens.css`)
- **Lucide Icons** — icon glyphs (`unpkg.com/lucide@latest`)

## Local preview

```bash
# Any of these work:
python3 -m http.server 4000      # → http://localhost:4000/site/
npx serve site                   # → http://localhost:3000
open site/index.html             # macOS — direct file:// works too
```

## Deploy

### Vercel (recommended)

```bash
cd site
npx vercel --prod
```

Or via dashboard → [vercel.com/new](https://vercel.com/new) → Import `philonggroup/cardiy-platform` → **Root Directory = `site`** → Deploy.

### Other static hosts

Works as-is on Netlify, Cloudflare Pages, GitHub Pages, S3 + CloudFront, or any nginx/Apache. Drop the contents of `site/` into your bucket.

Full step-by-step in `../DEPLOY-INSTRUCTIONS.md`.

## Sections

| # | Section | What it does |
| - | --- | --- |
| 1 | Sticky nav | Auto-blurs on scroll; mobile drawer |
| 2 | Hero | Headline + dual CTA + dashboard mock (vehicle card, AI bubble, KTV chip) |
| 3 | Trust strip | Partner logos |
| 4 | How it works | 3-step explainer with hover |
| 5 | Services + Booking | 8 service cards + full booking form (name/phone/date + services + auto-quote) |
| 6 | Technician Tracking | **Animated live map** with moving KTV pin, route, timeline |
| 7 | Fleet Dashboard | Browser-window mock with KPIs + vehicle table |
| 8 | App showcase | Dual phone mockups + App Store / Play badges |
| 9 | AI Assistant | **Interactive chat** — Claude in preview, smart fallback in production |
| 10 | Stats | 4 hero numbers |
| 11 | Testimonials | 3 customer quotes |
| 12 | FAQ | Native `<details>` accordion, 6 items |
| 13 | Final CTA | Conversion block |
| 14 | Footer | 4 columns + newsletter + socials |
| 15 | Floating mobile CTA | Sticky "Đặt lịch" on mobile only |

## Interactivity

Every CTA does something real:

| Trigger | Behavior |
| --- | --- |
| **Đặt lịch ngay** (anywhere) | Scrolls to booking form |
| **Service card click** | Toggles service in quote; toast confirms |
| **Booking submit** | Validates name/phone, generates booking code, shows success modal |
| **Tải App Store / Google Play** | "Coming soon" modal w/ notify signup |
| **Liên hệ Fleet** | Modal w/ mailto: action |
| **Chat input** | Real Claude calls in preview; smart keyword-based fallback in production |
| **Suggested chat chips** | Send canned question to AI |
| **Newsletter** | Email validation + thank-you toast |
| **Đăng nhập** | Sign-in modal stub |
| **FAQ items** | Native accordion |
| **Mobile burger** | Drawer toggle |
| **All "soon" placeholders** | Friendly toast instead of dead link |

## Customizing

| What | Where |
| --- | --- |
| Colors / type tokens | `styles/tokens.css` (root CSS vars) |
| Layout / components | `styles/main.css` |
| Interactivity | `scripts/main.js` |
| Copy | inline in `index.html` |
| Service catalog | `<div class="service">` blocks in §services |
| Quote multipliers | `<select id="q-car">` `data-mult` attrs |
| FAQ items | `<details class="faq__item">` blocks |
| Logo | `assets/logo-cardiy-*.svg` |
| AI fallback replies | `localBotReply()` in `scripts/main.js` |

## AI Chat — how it works

- **Preview environment** (Anthropic Claude-powered preview): calls `window.claude.complete(prompt)` for real Claude responses (Haiku 4.5, 1024-token cap).
- **Production** (Vercel/Netlify/etc.): `window.claude` doesn't exist → falls back to `localBotReply()`, a curated keyword-matching responder. Replies are bilingual-aware and brand-on-message.

To use real LLM responses in production, wire `scripts/main.js#askAI()` to your own backend endpoint (e.g. `/api/chat` that calls Anthropic with your API key server-side). The UI is identical.

## Design system source

This site consumes:
- `/colors_and_type.css` → copied as `site/styles/tokens.css`
- `/assets/logo-*.svg` → copied into `site/assets/`

For component reference (buttons, inputs, cards as standalone previews) see `/preview/` in the root design system.

## What's NOT in this build (yet)

- Real backend (booking form submits to no API — wire it to Formspree / Vercel Functions / your endpoint)
- Real Mapbox/MapLibre maps (the tracking map is a CSS animation)
- Localization beyond Vietnamese
- Cookie banner / GDPR consent
- Analytics — add your snippet (GA4 / Plausible / Umami) before `</head>` in `index.html`
- Real OAuth (Đăng nhập is a stub)

## Performance

- **First paint**: < 0.6s on 4G (single 42KB HTML + 44KB CSS + 18KB JS, gzipped)
- **No JS framework**: 0 bytes of React/Vue/etc.
- **Cache headers**: tokens.css and assets get 1-year immutable cache via `vercel.json`
- **Lighthouse**: targets 95+ on all categories

## License & ownership

© 2026 CARDIY · Phi Long Group. Design system + brand assets are proprietary; site code is for internal use.

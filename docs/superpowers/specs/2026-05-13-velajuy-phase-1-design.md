# Velajuy Pelucas — Phase 1 Design Spec

**Date**: 2026-05-13
**Owner**: André Vital
**Status**: Draft, pending user approval
**Phase**: 1 — Storefront MVP

---

## 1. Overview

Velajuy Pelucas is a Colombian direct-to-consumer wig brand currently selling via Instagram DMs, WhatsApp, and Facebook Marketplace. This spec describes Phase 1 of a fully bespoke e-commerce platform that replaces those manual sales channels with a self-serve storefront and a custom admin used by the owner.

The site is built as a single Next.js application (storefront + admin in the same codebase), backed by Postgres via Drizzle ORM, and integrated with Colombian payment gateways (Wompi, Mercado Pago) plus PayPal for legacy/international buyers.

**Brand**: kawaii / Y2K / sticker-art aesthetic. Light pink + deep burgundy palette. Mascot-led (chibi character + cat mascot "Oliver"). Sweet, Spanish-Colombia voice ("tú" form, peso formatting `$50.000`).

---

## 2. Phase decomposition

Phase 1 is what this spec covers. Other phases are sketched only.

| Phase | Scope |
|---|---|
| **1 — Storefront MVP (this spec)** | Catalog, product pages, cart, checkout, payments (Wompi + MP + PayPal sandbox/live), zone-based shipping, order management, custom admin, educational pages, DIAN-ready data model |
| 2 — DIAN factura electrónica | Integrate a DIAN provider (Alegra / Siigo) once owner formalizes (RUT). Wires the hooks Phase 1 prepared |
| 3 — Inventory intelligence | Low-stock alert tuning, sales analytics, supplier auto-reorder |
| 4 — International expansion | Multi-currency display, country-specific payment methods, international shipping zones. The Phase 1 schema already supports this |

---

## 3. Phase 1 scope

### In scope

- Public storefront: Inicio, Catálogo (PLP), Producto (PDP), Carrito, Checkout, Confirmación / Estado del pedido, Cuenta, Páginas educativas (Cuidado, Cómo colocar, FAQ, Envíos, Sobre Velajuy)
- Vista rápida (quick-view modal) from catalog
- Custom admin: Dashboard, Pedidos, Productos, Inventario, Zonas de envío, Páginas, Suscripciones back-in-stock, Configuración
- Payments: Wompi (cards, PSE, Nequi, Bancolombia, Daviplata), Mercado Pago, PayPal, Contra entrega (Bucaramanga AMB only)
- Zone-based shipping with quantity-threshold free shipping (≥3 wigs)
- Stock tracking with movement audit log, low-stock alerts, back-in-stock subscriptions
- Wishlist (logged-in users)
- DIAN-ready order/product schema, including `tax_breakdown` computed on every order even while informal
- Transactional emails (Resend): order received, payment confirmed, shipped, delivered, back-in-stock, low-stock-to-owner
- Configurable notification settings (per-event toggles and frequency)
- Sentry error tracking, Vercel Analytics

### Explicitly out of scope (deferred to later phases or cut)

- Live DIAN integration (Phase 2)
- Refunds workflow — wigs are personal-use items, non-refundable by policy
- Customer reviews / ratings
- Product comparison
- Blog / editorial content
- Live chat
- Referral program
- Multi-language (only ES-CO)
- Multi-currency checkout (display selector hidden until Phase 4)
- Real-time courier API integration (flat zone rates)
- One-click admin refund UI
- Variants per product (each wig is its own SKU)
- Categories (single category implicit)
- Discount codes
- Guía de tallas page (wigs are adjustable)
- "Cómo elegir tu peluca" content block on homepage
- Testimonials block on homepage

---

## 4. Stack & deployment

### Application

- **Next.js 16** (App Router) — single app, storefront under `/`, admin under `/admin` route group
- **TypeScript**
- **Tailwind CSS v4** — utility-first; CSS variables (`var(--color-...)`) instead of deprecated `theme()`; never hard-coded values when a Tailwind utility exists (`p-4` not `p-[16px]`)
- **React Hook Form + Zod** for all forms
- **Sonner** for toasts, **Lucide** for icons, **Framer Motion** for kawaii micro-interactions
- **better-auth** for customer + admin auth (magic-link first, email/password optional)

### Data

- **Neon Postgres** — main branch in prod, branch per Vercel preview deploy
- **Drizzle ORM** — migrations via Drizzle Kit
- **Cloudflare R2** — public bucket for product images and assets

### Integrations

- **Wompi** — cards, PSE, Nequi, Bancolombia, Daviplata
- **Mercado Pago Colombia** — wallet + cards
- **PayPal** — international / legacy buyers
- **Resend** — transactional email from `noreply@velajuy.com`
- **Sentry** — error tracking
- **Vercel Analytics** — pageviews + Core Web Vitals

### Hosting

- **Vercel** — production + preview deploys, custom domain `velajuy.com`
- **Neon** Postgres
- **R2** for static assets
- Vercel Cron for Phase 3+ (FX refresh, alert batching) — not used in Phase 1

### Locale & money

- Locale **ES-CO** ("tú" form, dates via `Intl.DateTimeFormat('es-CO')`, money via `Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' })`)
- All monetary values stored as integer minor units + ISO 4217 currency code. Never floats. Example: `5000000 COP` = `$50.000`

---

## 5. Data model

All tables in Postgres via Drizzle. Field lists below; not exhaustive DDL (timestamps + soft-delete fields implied where useful).

### `users` (managed by better-auth)

- `id, email, name, phone, role ('customer' | 'staff' | 'owner'), email_verified_at, created_at, updated_at`
- One table for all human accounts. `role` separates storefront customers from admin users.

### `addresses`

- `id, user_id (nullable), recipient_name, phone, country, department, city, line1, line2, neighborhood, postal_code, notes, is_default, created_at`
- Guest-checkout addresses have `user_id = NULL` and are owned only by the order they were used for.

### `products`

- `id, slug, name, short_description, description (rich text), status ('draft' | 'active' | 'archived'), price_amount, price_currency (default 'COP'), weight_grams, primary_image_id, low_stock_threshold (default 2), stock_quantity, sku_code, dian_tax_rate (default 19), dian_classification (nullable), created_at, updated_at`
- Each product is one SKU. No variants.
- `stock_quantity` lives on the product (single-location). Promoted to a separate `stock_levels` table only when warehouses are added.

### `product_images`

- `id, product_id, url (R2), alt_text, sort_order, width, height, created_at`

### `attributes` / `attribute_values` / `product_attribute_values`

- `attributes`: `id, name, slug, sort_order` — e.g., "Color", "Largo", "Estilo", "Fibra"
- `attribute_values`: `id, attribute_id, name, slug, sort_order` — e.g., "Rosa pastel", "50cm", "Bob"
- `product_attribute_values`: composite PK `(product_id, attribute_value_id)`

### `carts` / `cart_items`

- `carts: id, user_id (nullable), session_token, currency_code, created_at, expires_at`
- `cart_items: cart_id, product_id, quantity, unit_price_snapshot, currency_code`
- Guests use `session_token`; logged-in users use `user_id`. Carts merge on login.

### `orders`

- `id, order_number ('VLJ-0001' ever-incrementing), user_id (nullable), guest_email, guest_phone, status ('pending_payment' | 'paid' | 'preparing' | 'shipped' | 'delivered' | 'cancelled' | 'failed'), currency_code, subtotal_amount, shipping_amount, tax_amount, discount_amount, total_amount, payment_method ('wompi_card' | 'wompi_pse' | 'wompi_nequi' | 'wompi_bancolombia' | 'wompi_daviplata' | 'mp' | 'paypal' | 'contraentrega'), payment_status ('pending' | 'authorized' | 'paid' | 'pending_on_delivery' | 'failed'), shipping_address_id, billing_address_id (nullable), shipping_courier ('inter' | 'servientrega' | 'envia' | null), shipping_zone_id, tracking_number, notes, placed_at, paid_at, shipped_at, delivered_at, cancelled_at, dian_invoice_id (nullable), dian_status (nullable, future), dian_provider (nullable, future), dian_payload (jsonb, nullable, future), tax_breakdown (jsonb)`
- `tax_breakdown` computed and stored on every order even while informal:
  ```json
  {
    "rates": [{ "rate": 19, "base": 4201700, "tax": 798300 }],
    "total_tax": 798300,
    "currency": "COP"
  }
  ```

### `order_items`

- `id, order_id, product_id, name_snapshot, image_snapshot_url, quantity, unit_price_amount, currency_code, line_total_amount, dian_tax_rate_snapshot`
- Snapshots prevent retroactive price changes from breaking historical orders.

### `stock_movements` (audit log)

- `id, product_id, delta (+/-), reason ('sale' | 'cancellation' | 'restock' | 'adjustment' | 'return'), order_id (nullable), staff_id (nullable), notes, created_at`
- Every change to `stock_quantity` writes a row here.

### `shipping_zones`

- `id, name, country ('CO'), department, cities (jsonb array, null = whole department), base_rate_amount, currency_code, courier_default (nullable), allows_cod (default false), is_active, sort_order, created_at, updated_at`
- Free shipping is not per-zone (handled globally — see `settings`).
- Lookup at checkout: exact city match within department → first match by `sort_order`; fallback to department-wide zone (cities = null); no match → block.
- Seed zones:
  - "Bucaramanga" — Santander, cities `["Bucaramanga"]`, base $10.000, `allows_cod = true`
  - "Floridablanca / Piedecuesta / Girón" — Santander, cities `["Floridablanca", "Piedecuesta", "Girón"]`, owner-defined rate, `allows_cod = true`
  - Additional zones across Colombia — owner-defined, `allows_cod = false`

### `payments`

- `id, order_id, provider, provider_ref (unique per provider), status ('pending' | 'authorized' | 'paid' | 'failed'), amount_amount, currency_code, raw_payload (jsonb), created_at`
- Stores every payment attempt.

### `webhook_events` (idempotency)

- `id, provider, event_id (unique per provider), type, payload, received_at, processed_at, status ('received' | 'processed' | 'failed')`
- Unique constraint on `(provider, event_id)` makes duplicate webhooks no-ops.

### `wishlist_items`

- Composite PK `(user_id, product_id)`, plus `added_at`
- Logged-in users only; drives sign-up value.

### `back_in_stock_subscriptions`

- `id, product_id, email, user_id (nullable for guests), notified_at (nullable), unsubscribe_token, created_at`
- Batched send when `products.stock_quantity` flips 0 → positive.

### `pages` (lightweight CMS)

- `id, slug, title, body (rich text JSON), meta_description, og_image_url, published_at, updated_at`
- Used for Cuidado, Cómo colocar, FAQ, Envíos, Sobre Velajuy.

### `settings` (single-row k/v)

- Shop name, contact info, social links, `free_shipping_min_quantity` (default 3), `low_stock_threshold_default`, `iva_default_rate` (19), admin notification config (per-event toggle + frequency + target email).

### `fx_rates` (empty in Phase 1)

- `base_currency, quote_currency, rate, effective_at, source`
- Schema only — populated in Phase 4.

---

## 6. Storefront pages & buyer journey

### Pages

1. **Inicio (Homepage)** — hero (mascot + tagline + CTA), pelucas destacadas carousel, newsletter signup + IG embed, footer
2. **Catálogo (PLP)** — filter sidebar (Color, Largo, Estilo, Disponible), sort (Nuevas, Más vendidas), grid of product cards, vista rápida modal trigger
3. **Producto (PDP)** — image gallery, name, price, stock badge, attributes, "Agregar al carrito", ♥ Wishlist, "Avisarme cuando vuelva", tabs (Descripción / Cuidado / Envío / No-devoluciones), pelucas relacionadas
4. **Vista rápida modal** — invoked from PLP: primary image, name, price, key attributes, "Agregar al carrito" — never navigates away
5. **Carrito** — drawer on mobile, page on desktop. Lines, subtotal, envío estimado (once address known via geolocation/IP), total, CTA to checkout
6. **Checkout** — single page, three sections (Contacto / Envío / Pago) with live right-rail summary
7. **Confirmación / Estado del pedido** — accessible without login via email + `order_number`; status timeline, summary, tracking link when shipped
8. **Cuenta** — Mis pedidos, Direcciones guardadas, Wishlist, Datos personales
9. **Páginas educativas** — Cuidado, Cómo colocar, FAQ, Envíos, Sobre Velajuy (all CMS-driven via `pages` table)

### Buyer journey (typical)

1. Arrives from Instagram → Inicio or directly to PDP
2. Explores Catálogo, filters by color/largo
3. Opens PDP (or vista rápida) → adds to cart (no account)
4. Carrito → Checkout
5. Selects payment method → redirects to Wompi/MP/PayPal or confirms COD
6. Returns to confirmation, receives "Pedido recibido" email
7. Receives "Enviado" email with tracking
8. Receives "Entregado" email

---

## 7. Checkout & payments

### Checkout layout

Single page, three sections all visible:

1. **Contacto** — email, teléfono (both required, guest-OK)
2. **Envío** — recipient, departamento, ciudad, dirección, barrio, notas. Zone lookup fires on departamento+ciudad change → shipping cost displays inline. No zone match → block with contact CTA.
3. **Pago** — radio list with provider logos. Selecting determines: embedded Wompi widget (cards) or "Serás redirigido a [provider]" + button.

Right-rail (mobile: stacked above CTA): live order summary.

### Payment methods

| Method | UX | Flow |
|---|---|---|
| Wompi card | Embedded Wompi widget (tokenized) | Tokenize → charge → webhook → mark paid |
| Wompi PSE | Bank picker → redirect | Redirect → return URL → webhook → mark paid |
| Wompi Nequi | Phone input → push to Nequi app | Customer approves → webhook |
| Wompi Bancolombia / Daviplata | Same redirect pattern as PSE | Provider redirect → return URL → webhook |
| Mercado Pago | Redirect to MP checkout | MP handles → return URL → webhook |
| PayPal | PayPal SDK popup | Approve → capture → webhook |
| Contra entrega | No external call (Bucaramanga AMB only) | Order placed with `payment_status = pending_on_delivery`, ships normally, owner marks paid after courier remit |

### Order state machine

```
draft (cart) → pending_payment → paid → preparing → shipped → delivered
                  ↓               ↓        ↓
            failed/expired    cancelled (pre-shipment only)
```

COD orders skip `pending_payment` → go directly to `preparing`; `payment_status` tracked separately.

### Stock reservation strategy

**Decrement on payment success** (chosen for simplicity and scale). On payment webhook:

1. Open transaction.
2. `SELECT product FOR UPDATE` (row-lock).
3. If `stock_quantity > 0`: decrement, write `stock_movements` (reason: `sale`), flip order to `paid`.
4. If `stock_quantity = 0`: flip order to `failed`, refund authorization (Wompi/MP auto-voids on no-capture; PayPal capture is the moment of decision — for PayPal we hold the authorization until stock-check succeeds, then capture).
5. Commit.

If we later see oversells in practice, promote to reserve-on-placement.

### COD specifics

- Stock decrements at order creation (no later payment event).
- Order ships normally.
- Shipping label note: "COBRAR $XXX al cliente".
- Admin manually flips `payment_status` to `paid` after courier remits cash.

### Webhooks

- Endpoints: `/api/webhooks/wompi`, `/api/webhooks/mp`, `/api/webhooks/paypal`.
- Each verifies provider signature (HMAC for Wompi, X-Signature for MP, PayPal-Transmission-Sig).
- Upsert into `webhook_events` keyed by `(provider, event_id)` — duplicates ignored.
- On first successful payment event: stock decrement transaction (above), then enqueue confirmation email.

### Order expiry

- `pending_payment` orders auto-cancel after **30 minutes** for instant-confirm methods (Wompi card, MP, PayPal, Nequi).
- **24 hours** for bank-transfer-based methods (Wompi PSE, Bancolombia, Daviplata).
- Cron sweeps expired orders, flips status to `failed`, no stock change (since Phase 1 doesn't reserve).

### Emails (via Resend)

| Trigger | Recipient | Content |
|---|---|---|
| Order placed | Customer | "Pedido VLJ-XXXX recibido" + summary |
| Payment paid | Customer | "Pago confirmado" |
| Marked shipped | Customer | "Tu pedido va en camino" + courier + tracking |
| Marked delivered | Customer | "Tu pedido fue entregado" |
| Back-in-stock | Subscribers | Batched, includes one-click unsubscribe |
| Low stock | Owner (configurable) | Product name + current quantity |
| New order | Owner (configurable) | Order summary, payment method |
| COD ready to confirm | Owner (configurable) | Prompt to mark paid |

---

## 8. Shipping, tax, DIAN-readiness

### Shipping zone model

See `shipping_zones` in §5. Owner manages zones from admin. Lookup priority at checkout: exact city → department-wide → block.

Seed zones at launch:
- Bucaramanga — $10.000, COD allowed
- Floridablanca / Piedecuesta / Girón — owner-defined rate, COD allowed
- Other Colombia zones — owner-defined, no COD

Free shipping rule: if order has `quantity ≥ settings.free_shipping_min_quantity` (default 3), shipping is $0 anywhere in Colombia.

### Tax handling (Phase 1 = informal, DIAN-ready)

- Prices are IVA-inclusive (Colombian retail convention).
- Default `dian_tax_rate = 19` on every product (flat — no exemptions per owner).
- `orders.tax_breakdown` computed and stored on every order, even while informal:
  ```json
  { "rates": [{ "rate": 19, "base": 4201700, "tax": 798300 }], "total_tax": 798300, "currency": "COP" }
  ```
- DIAN fields on orders (`dian_invoice_id`, `dian_status`, `dian_provider`, `dian_payload`) stay null in Phase 1. Phase 2 fills them via a provider integration (Alegra recommended).

### Returns & refunds

- **No refunds**. Wigs are personal-use items, non-refundable by policy. Communicated on PDP "Devoluciones" tab and footer link.
- **Pre-shipment cancellations** allowed — order flips to `cancelled`, stock restored via `stock_movements` (reason: `cancellation`).
- Provider-side refunds (chargebacks, disputes) handled manually in each provider's dashboard; no in-app refund UI in Phase 1.

---

## 9. Admin

### Route & access

- `/admin/*` route group, gated by `users.role IN ('staff', 'owner')`.
- Same Next.js app, same auth (better-auth).
- Visual styling consistent with the storefront — pink/burgundy, kawaii.

### Views

1. **Dashboard** — today's orders, this-week revenue, low-stock alerts, pending shipments
2. **Pedidos** — list (filter: status, date range, payment method, courier, COD), detail page
3. **Productos** — list (filter: status, low-stock), create/edit; image gallery (drag-reorder, drag-upload to R2)
4. **Inventario** — stock-only view, inline adjust with reason
5. **Zonas de envío** — CRUD
6. **Páginas** — rich-text editor for educational pages
7. **Suscripciones back-in-stock** — list per product (visibility for marketing)
8. **Configuración** — shop info, social links, free-shipping quantity, low-stock default, IVA default, notification settings (per-event toggle + frequency + email)

### Order detail page

Single most-used screen.

- Status timeline + buttons: "Marcar preparando" → "Marcar enviado" (prompts courier + tracking) → "Marcar entregado"
- For COD: "Marcar pago recibido" button
- "Cancelar pedido" (pre-shipment only) — restores stock via `stock_movements`
- Customer info, addresses, payment trail, all in one view
- Print-friendly view for packing slip

### Roles

| Role | Permissions |
|---|---|
| `owner` | Everything: orders, products, zones, pages, settings, users |
| `staff` | Orders (update status, mark shipped, mark COD paid), inventory adjustments, read-only product view. **Cannot**: change prices, add/remove products, manage zones/settings/users |
| `customer` | Storefront only |

### Notification config

Settings panel exposes:
- Per-event toggles: New Order / Payment Received / Stock Low / COD Ready to Confirm
- Per-event frequency: Inmediato / Resumen diario / Apagado
- Per-event target email (default: owner email; can route low-stock to a separate ops inbox)

---

## 10. Currency, observability, testing

### Currency

- Phase 1: COP only. `display_currency` cookie infrastructure exists but selector is hidden.
- Charges always settled in COP regardless of display currency (Phase 4 may keep this constraint).
- `fx_rates` table schema exists; not populated.

### Observability

- **Sentry** — frontend + server errors. Source maps via Vercel integration.
- **Vercel Analytics** — pageviews, Web Vitals (free).
- **Structured server logs** via `pino` to Vercel logs.
- Audit trails: `stock_movements` (inventory), `webhook_events` (payments).

### Testing

- **Vitest** unit tests — cart math, tax breakdown, shipping rate lookup, stock decrement logic (money-critical paths must have unit coverage).
- **Vitest integration tests** — webhook handlers with recorded fixtures, end-to-end checkout against payment provider sandbox keys.
- **Playwright E2E** — flows: (1) browse → cart → checkout (sandbox) → confirmation; (2) admin login → mark shipped → verify email sent.
- **No mocked payments**. Sandbox APIs only.
- **CI** — typecheck, lint, format check, unit + integration tests on every PR. E2E nightly + on merge to `main`.

### Hosting

- **Vercel** prod + preview per PR
- **Neon Postgres** main branch + Neon-per-preview
- **Cloudflare R2** single public bucket
- **Resend** with DKIM/SPF on `velajuy.com`
- Secrets in Vercel env vars, gated per environment

### Photography workflow

- Admin supports image upload from day one.
- Products can be created in `draft` status without images; activated when shots are ready.
- Next.js Image handles resize + WebP/AVIF. Originals stay in R2.
- Default `placeholder.png` (kawaii "coming soon") shows for products missing primary image.

---

## 11. Risks & open issues

| Risk | Impact | Mitigation |
|---|---|---|
| **Wompi / MP require RUT** for live business onboarding | Cannot accept live Wompi/MP payments until owner formalizes | Phase 1 dev uses sandbox accounts (no RUT required). PayPal works without RUT and stays the live fallback until formalization. Communicate this clearly so owner files RUT in parallel with Phase 1 development |
| **Photography happens alongside dev** | Empty PDPs at launch if photos lag | Draft-status products + placeholder image; only flip to `active` once primary image is in. Coordinate photography deadline with launch date |
| **Wompi webhook reliability** | Stuck `pending_payment` orders | 30 min / 24 h expiry sweeps via cron; manual "Marcar pago recibido" in admin as last resort |
| **Oversells under concurrent payment** | Two buyers pay for last unit | Row-lock + decrement-on-payment-success pattern (see §7). If insufficient, promote to reserve-on-placement |
| **DIAN provider choice** | Phase 2 work | Decide between Alegra and Siigo at start of Phase 2; Phase 1 schema is provider-agnostic |
| **First-launch shipping zone gaps** | Some buyers can't check out | "No envío disponible" message with WhatsApp contact CTA. Owner adds the zone within the day |

---

## 12. Estimated effort (rough)

Phase 1 to a polished MVP: **~6-10 weeks** of focused solo development. Largest cost centers (in rough order):

1. Storefront design & implementation (kawaii polish takes time) — ~3 weeks
2. Admin (8 views + order detail flow) — ~2 weeks
3. Payment integrations (Wompi + MP + PayPal + COD, including webhooks and sandbox testing) — ~1.5 weeks
4. Shipping zone logic + checkout flow — ~0.5 weeks
5. Educational pages, emails, observability, testing — ~1 week
6. Photography coordination + launch prep — ~1 week

---

## 13. Decisions log (Phase 1)

A record of decisions made during brainstorming, for traceability.

| Decision | Choice |
|---|---|
| Approach | Fully bespoke Next.js + Postgres |
| Categories | Drop — all products are wigs |
| Variants | Drop — flat SKUs |
| Discount codes | Drop in Phase 1 |
| Refunds | Drop — non-refundable personal-use items |
| Order numbers | `VLJ-0001` ever-incrementing |
| Stock reservation | Decrement on payment success |
| Free shipping | Quantity-threshold (≥3), global, not per-zone |
| COD scope | Bucaramanga + Floridablanca + Piedecuesta + Girón only |
| IVA | Flat 19% across all wigs |
| DIAN | Schema-ready in Phase 1, live in Phase 2 |
| Domain | velajuy.com |
| Locale | ES-CO (Colombian "tú" form) |
| Helpers | Same `staff` role as admin team (no separate "helper" tier) |
| Notifications | Per-event configurable toggles + frequency + target email |
| Homepage | No "Cómo elegir" block, no testimonios |
| Educational pages | No Guía de Tallas |
| Catalog | Include Vista rápida modal |

---

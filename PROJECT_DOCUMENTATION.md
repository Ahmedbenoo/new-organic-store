# Organic Store — Technical Documentation & Project Audit

> **Document version:** 1.0  
> **Date:** July 25, 2026  
> **Scope:** Full-stack audit of the Organic Store e-commerce project  
> **Status:** Read-only audit — no application code modified for this report

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Tech Stack](#3-tech-stack)
4. [Features](#4-features)
5. [Database](#5-database)
6. [Security](#6-security)
7. [Performance](#7-performance)
8. [Deployment](#8-deployment)
9. [Development Problems & Solutions](#9-development-problems--solutions)
10. [Engineering Decisions](#10-engineering-decisions)
11. [Final Audit](#11-final-audit)
12. [Timeline](#12-timeline)
13. [Folder Structure](#13-folder-structure)
14. [APIs](#14-apis)
15. [Scripts](#15-scripts)

---

## 1. Project Overview

### Project Name
**Organic Store** (`organic-store`)

### Concept
A bilingual (Arabic/English) e-commerce storefront for an organic honey and natural products brand. Customers browse products, add items to a cart, and place orders via a checkout flow integrated with WhatsApp. Store owners manage all content — products, hero slider, about page, blog, settings, orders, and media — through a password-protected admin dashboard.

### Type
**E-commerce** — catalog browsing, shopping cart, order placement, and order tracking (no online payment gateway; orders are confirmed via WhatsApp).

### Key Features
- Bilingual storefront (Arabic RTL + English LTR) via `next-intl`
- Dynamic product catalog with categories, pricing models (fixed, per-gram, custom, announcement)
- Shopping cart persisted in browser localStorage
- Checkout with WhatsApp order notification
- Customer order lookup by phone number
- Full admin dashboard for CRUD on all store content
- Supabase PostgreSQL backend with Storage for product images
- ISR + On-Demand Revalidation for fast, fresh storefront pages
- Production security: bcrypt passwords, HMAC sessions, RLS, service-role isolation

### Target Users

| User Type | Description |
|-----------|-------------|
| **Customers** | Arabic/English speakers browsing and ordering honey & natural products online |
| **Store Admin** | Business owner or staff managing catalog, content, and orders via `/admin` |
| **Developers** | Maintainers deploying to Vercel with Supabase as the backend |

---

## 2. Architecture

### High-Level Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                        │
├──────────────────────────┬──────────────────────────────────────┤
│      Storefront          │         Admin Dashboard (/admin)      │
│  next-intl [locale]/*    │    Client Components + fetch /api/*   │
│  Server + Client Comps   │    AdminAuthProvider (session check)  │
│  CartProvider (localStorage)                                    │
│  ProductsProvider (SSR + client sync)                           │
└────────────┬─────────────┴──────────────────┬───────────────────┘
             │                                │
             ▼                                ▼
┌─────────────────────────────────────────────────────────────────┐
│              Next.js 16 App Router (Vercel)                     │
├──────────────────────────┬──────────────────────────────────────┤
│   Server Components      │         API Route Handlers            │
│   (ISR pages, layout)    │    /api/products, orders, blog, ...   │
│   read from *-store.ts   │    requireAdminApi() for writes       │
│   revalidatePath()       │    revalidate-storefront.ts           │
└────────────┬─────────────┴──────────────────┬───────────────────┘
             │                                │
             ▼                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Store Layer (*-store.ts)                     │
│   products-store | settings-store | orders-store | blog-store   │
│   slider-store | about-store | media-store                      │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│              Supabase (PostgreSQL + Storage)                    │
│   service_role (server-only) bypasses RLS for admin writes      │
│   anon key + RLS for defense-in-depth (when migration applied)  │
└─────────────────────────────────────────────────────────────────┘
```

### Next.js App Router

The project uses the **App Router** exclusively (`src/app/`). Routes are organized as:

- **`/[locale]/*`** — Localized storefront pages (`ar`, `en`)
- **`/admin`** — Standalone admin dashboard (excluded from i18n middleware)
- **`/api/*`** — REST-style Route Handlers for data access and mutations

The i18n middleware lives in `src/proxy.ts` and routes all non-admin, non-api paths through `next-intl`.

### Folder Structure (Summary)

See [Section 13](#13-folder-structure) for a detailed breakdown.

### API Routes

All data mutations and dynamic reads go through Route Handlers under `src/app/api/`. Admin write operations are protected by `requireAdminApi()` which validates the HMAC-signed session cookie.

### Server Components

Used for:
- Page layouts and static/ISR content (`layout.tsx`, `page.tsx`, `about/page.tsx`, `blog/page.tsx`)
- Server-side data fetching via `*-store.ts` functions
- Footer (reads public settings)
- Metadata generation (`generateMetadata`)

Marked with `export const revalidate = 60` for time-based ISR.

### Client Components

Used for:
- Interactive UI: cart, checkout, search, mobile menu, product slider
- Admin dashboard (entire shell is client-side with tab navigation)
- Context providers (`ProductsProvider`, `CartProvider`, `AdminAuthProvider`)
- Forms and modals

Identified by `"use client"` directive.

### Context Providers

| Provider | Location | Purpose |
|----------|----------|---------|
| `ProductsProvider` | `src/context/products-context.tsx` | Catalog state; SSR `initialProducts` + client refresh from `/api/products` |
| `CartProvider` | `src/context/cart-context.tsx` | Shopping cart; persisted to `localStorage` key `golden-hive-cart` |
| `AdminAuthProvider` | `src/context/admin-auth-context.tsx` | Admin session state; checks `/api/admin/session` |
| `NextIntlClientProvider` | `[locale]/layout.tsx` | i18n messages for client components |
| `CartProvider` | wraps inside `ProductsProvider` | Cart depends on product prices from catalog |

### Data Flow

#### Storefront Read Path
1. **Build / ISR revalidation:** Server Component calls `readProducts()`, `readBlogData()`, etc. from store modules
2. **Layout hydration:** `ProductsProvider` receives `initialProducts` from server
3. **Client sync:** On mount, `ProductsProvider` fetches `/api/products?cache=no-store` to get fresh catalog
4. **Hero slider:** Client component fetches `/api/slider` on mount (always dynamic)

#### Admin Write Path
1. Admin UI sends `fetch()` to `/api/*` with session cookie
2. Route Handler calls `requireAdminApi()` → verifies HMAC session
3. Store function writes to Supabase via `service_role` client
4. `revalidatePath()` invalidates affected storefront pages immediately

#### Order Placement Path
1. Customer submits checkout form in `CheckoutModal`
2. WhatsApp message opened with order details
3. `POST /api/orders` saves order to Supabase
4. Order ID stored in `localStorage` for later lookup

### Admin Dashboard Architecture

- **Entry:** `/admin` → `AdminAuthProvider` → `AdminShell`
- **Auth gate:** If not authenticated, renders `AdminLogin`
- **Navigation:** Tab-based shell (`orders | products | slider | about | blog | settings`)
  - Mobile: `<select>` dropdown
  - Desktop: horizontal scrollable tabs
- **Data access:** All admin panels fetch/write via `/api/*` Route Handlers (never direct Supabase from browser)
- **No SSR:** Admin is fully client-rendered; SEO blocked via `robots: noindex`

### Storefront Architecture

- **Locale routing:** `next-intl` with `localePrefix: "always"` → `/ar/shop`, `/en/blog`
- **Layout shell:** Navbar + main + Footer wrapped in providers
- **Pages:** Mix of Server Components (ISR) and Client Components (interactivity)
- **Caching strategy:** ISR (60s) + On-Demand Revalidation on admin writes + client-side no-store fetches for catalog/slider

---

## 3. Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.2.9 | React framework, App Router, ISR, API routes, image optimization |
| **React** | 19.2.4 | UI library |
| **React DOM** | 19.2.4 | DOM rendering |
| **TypeScript** | ^5 | Static typing across the codebase |
| **Tailwind CSS** | ^4 | Utility-first styling |
| **@tailwindcss/postcss** | ^4 | PostCSS integration for Tailwind v4 |
| **next-intl** | ^4.13.0 | Internationalization (routing, messages, RTL/LTR) |
| **Geist** | (via `next/font`) | Primary sans-serif font |

### Backend

| Technology | Purpose |
|------------|---------|
| **Next.js Route Handlers** | REST API layer (`src/app/api/`) |
| **Node.js** | Runtime (requires >= 22 per `package.json` engines) |
| **server-only** | Prevents server modules from being imported in client bundles |

### Database

| Technology | Purpose |
|------------|---------|
| **Supabase (PostgreSQL)** | Primary data store for all application data |
| **Supabase REST API** | Accessed via `@supabase/supabase-js` client |

### Storage

| Technology | Purpose |
|------------|---------|
| **Supabase Storage** | `products` bucket for uploaded product/slider/blog images |
| **Local `public/assets`** | Legacy static images (still listed by media-store) |
| **Local `public/optimized`** | Pre-optimized legacy images |

### Authentication

| Technology | Purpose |
|------------|---------|
| **Custom HMAC session** | Admin session tokens signed with `ADMIN_SESSION_SECRET` |
| **HttpOnly cookies** | Session stored in `admin-session` cookie |
| **bcryptjs** | Admin password hashing (12 rounds) |

### State Management

| Approach | Scope |
|----------|-------|
| **React Context** | Products catalog, shopping cart, admin auth |
| **localStorage** | Cart persistence, customer order IDs, saved phone |
| **Server state (ISR)** | Page-level data via Server Components |
| **Component state (`useState`)** | Forms, modals, admin panels |

No Redux, Zustand, or TanStack Query.

### Styling

| Technology | Purpose |
|------------|---------|
| **Tailwind CSS v4** | All component styling |
| **CSS variables** | Theme tokens in `globals.css` (`--background`, `--foreground`, etc.) |
| **Custom animations** | `animate-fade-in-up`, `animate-scale-in`, `animate-page-enter` |

### Internationalization

| Technology | Purpose |
|------------|---------|
| **next-intl** | Locale routing, message loading, `Link`/`redirect` helpers |
| **messages/ar.json** | Arabic translations |
| **messages/en.json** | English translations |
| **RTL support** | `dir="rtl"` on `<html>` when locale is `ar` |

### Deployment

| Platform | Role |
|----------|------|
| **Vercel** | Frontend hosting, serverless functions for API routes |
| **Supabase Cloud** | Managed PostgreSQL + Storage |
| **GitHub** | Source control and Vercel CI/CD trigger |

### Package Manager

**npm** — scripts defined in `package.json`; lockfile expected (`package-lock.json`).

### Testing

| Tool | Status |
|------|--------|
| **Jest / Vitest / Playwright** | Not configured |
| **Manual integration scripts** | `scripts/test-*.mjs` for CRUD and RLS verification |
| **ESLint** | `npm run lint` via `eslint-config-next` |

### Utilities

| Library | Purpose |
|---------|---------|
| **sharp** | Image optimization (devDependency; used by Next.js Image + `optimize-images.mjs`) |
| **bcryptjs** | Password hashing and verification |
| **@types/*** | TypeScript definitions for Node, React, bcryptjs |

### Security Libraries

| Module | Purpose |
|--------|---------|
| `src/lib/password-hash.ts` | bcrypt hash/verify wrappers |
| `src/lib/admin-auth.ts` | HMAC session signing/verification |
| `src/lib/api-auth.ts` | API route admin guard |
| `src/lib/supabase-admin.ts` | Isolated service-role client (`server-only`) |

### Package.json Dependencies — Detailed Rationale

| Package | Type | Why It Is Used |
|---------|------|----------------|
| `next` | dependency | Core framework: routing, SSR/SSG/ISR, API routes, Image component |
| `react` / `react-dom` | dependency | UI rendering |
| `@supabase/supabase-js` | dependency | PostgreSQL and Storage client for all data operations |
| `next-intl` | dependency | Bilingual routing and translations |
| `bcryptjs` | dependency | Secure admin password storage |
| `server-only` | dependency | Build-time guard preventing server secrets in client bundles |
| `tailwindcss` | devDependency | CSS framework |
| `@tailwindcss/postcss` | devDependency | Tailwind v4 PostCSS plugin |
| `typescript` | devDependency | Type safety |
| `eslint` / `eslint-config-next` | devDependency | Linting aligned with Next.js best practices |
| `sharp` | devDependency | Native image processing for Next.js Image optimization |
| `@types/node`, `@types/react`, `@types/react-dom`, `@types/bcryptjs` | devDependency | TypeScript type definitions |

---

## 4. Features

### Storefront

| Feature | Description | Key Files |
|---------|-------------|-----------|
| **Home page** | Hero (settings-driven), product slider, features grid, featured products, testimonials, CTA banner | `[locale]/page.tsx`, `product-slider.tsx` |
| **Shop page** | Full product catalog with category filtering | `[locale]/shop/page.tsx`, `shop-grid.tsx` |
| **Product cards** | Display name, price, image, add-to-cart | `product-card.tsx` |
| **About page** | CMS-driven bilingual content (story, values, process) | `[locale]/about/page.tsx` |
| **Blog listing** | Active posts grid with CMS settings | `[locale]/blog/page.tsx` |
| **Blog post** | Individual post page (on-demand ISR) | `[locale]/blog/[slug]/page.tsx` |
| **Contact page** | Contact form UI | `[locale]/contact/page.tsx`, `contact-form.tsx` |
| **Orders page** | Customer order lookup and history | `[locale]/orders/page.tsx`, `my-orders.tsx` |
| **404 handling** | `notFound()` for missing blog posts | `blog/[slug]/page.tsx` |
| **Page transitions** | Enter animation on route change | `[locale]/template.tsx` |

### Admin Dashboard

| Feature | Description |
|---------|-------------|
| **Password login** | Single admin password from `site_settings` |
| **Tab navigation** | Orders, Products, Hero Slider, About, Blog, Settings |
| **Responsive UI** | Mobile select nav, card-based orders, full-width buttons |
| **Toast notifications** | Save/delete feedback |
| **Preview links** | Open blog/about on storefront in new tab |

### Products

| Feature | Description |
|---------|-------------|
| **CRUD** | Create, read, update, delete via admin |
| **Categories** | natural-honey, sidr, bee-products, mixed-honey, formulations, vip-formulations, natural-oils, dates |
| **Product kinds** | standard (priced), custom (custom pricing), announcement (coming soon) |
| **Units** | fixed price or per-gram with default quantity |
| **Active/hidden toggle** | Control storefront visibility |
| **Sort order** | Manual catalog ordering |
| **Search & filter** | Admin search by name/ID; category filter |
| **Image picker** | Select from media library or upload |

### Orders

| Feature | Description |
|---------|-------------|
| **Public order creation** | POST `/api/orders` from checkout |
| **Admin order list** | Filter by status, stats dashboard |
| **Status workflow** | pending → confirmed → delivered / cancelled |
| **Order detail modal** | View items, customer info, update status |
| **WhatsApp flag** | Tracks if WhatsApp notification was sent |

### Blog

| Feature | Description |
|---------|-------------|
| **Page settings** | Bilingual title and description |
| **Posts CRUD** | Full bilingual content, excerpt, image, emoji, date, read time |
| **Active/hidden** | Control post visibility |
| **On-demand routes** | New slugs work without redeploy |
| **Sort order** | Manual post ordering |

### Hero Slider

| Feature | Description |
|---------|-------------|
| **Slide management** | Add, edit, reorder, delete slides |
| **Bilingual labels** | Arabic and English slide labels |
| **Active/hidden** | Control slide visibility |
| **Auto-play carousel** | 6-second interval on homepage |
| **Optional product link** | `product_id` field on slides |

### About

| Feature | Description |
|---------|-------------|
| **Full page CMS** | Story, values (4), process steps (3), images — all bilingual |
| **Singleton record** | Single row in `about_page` table |

### Settings

| Feature | Description |
|---------|-------------|
| **WhatsApp numbers** | Owner and branch numbers |
| **Hero content** | Badge, title, description (AR/EN) |
| **Footer content** | Email, phone, address (AR/EN) |
| **Admin password** | Change password (bcrypt hashed on save) |

### Media

| Feature | Description |
|---------|-------------|
| **Image upload** | Admin POST to `/api/media` → Supabase Storage |
| **Image library** | Lists Supabase bucket + legacy local images |
| **Image picker component** | Reused in products, slider, blog admin |

### Localization

| Feature | Description |
|---------|-------------|
| **Two locales** | Arabic (default) and English |
| **URL prefix** | Always present: `/ar/...`, `/en/...` |
| **Language switcher** | Component in navbar |
| **RTL/LTR** | Automatic direction per locale |
| **Translated UI** | Static strings in JSON message files |
| **CMS bilingual fields** | `_ar` / `_en` suffix pattern in database |

### SEO

| Feature | Description |
|---------|-------------|
| **generateMetadata** | Per-locale title and description in layout |
| **Semantic HTML** | Headings, landmarks, alt text on images |
| **Admin noindex** | `robots: noindex, nofollow` on `/admin` |
| **ISR freshness** | Content updates propagate via revalidation |

### Search

| Feature | Description |
|---------|-------------|
| **Product search dialog** | Search by Arabic/English name, description, category |
| **Keyboard shortcut** | Opens from navbar |
| **Live filtering** | Client-side against ProductsProvider catalog |

### Shopping Cart

| Feature | Description |
|---------|-------------|
| **Add/remove items** | Standard products only |
| **Quantity tracking** | Per-product quantity with default from catalog |
| **Cart drawer** | Slide-out panel in navbar |
| **localStorage persistence** | Survives page reloads |
| **Price calculation** | Derived from live catalog prices |

### Checkout

| Feature | Description |
|---------|-------------|
| **Checkout modal** | Customer name, phone, address, notes |
| **WhatsApp integration** | Opens pre-filled WhatsApp message to store owner |
| **Order persistence** | Saves to Supabase after WhatsApp step |
| **Order number** | Formatted display ID for customer reference |

### Order Lookup

| Feature | Description |
|---------|-------------|
| **By phone** | GET `/api/orders/lookup?phone=...` |
| **By saved IDs** | localStorage order IDs from past checkouts |
| **Status display** | Color-coded status badges |
| **Expandable details** | Item list and totals |

### WhatsApp Integration

| Feature | Description |
|---------|-------------|
| **Order messages** | Formatted bilingual order summary |
| **Number normalization** | Egyptian phone format (`20...`) |
| **Configurable numbers** | Owner + branch from site settings |
| **Fallback URL** | `wa.me` deep link with encoded message |

### Responsive Design

| Feature | Description |
|---------|-------------|
| **Mobile-first Tailwind** | Breakpoints: sm, md, lg |
| **Mobile menu** | Hamburger navigation on storefront |
| **Responsive slider** | Fluid width hero carousel |
| **Responsive admin** | Mobile tab select, order cards, bottom-sheet modals |

### Image Optimization

| Feature | Description |
|---------|-------------|
| **next/image** | AVIF/WebP formats, responsive sizes |
| **Remote patterns** | Supabase Storage URLs allowed |
| **Legacy optimizer script** | `scripts/optimize-images.mjs` for batch processing |

### Storage

| Feature | Description |
|---------|-------------|
| **Supabase bucket `products`** | Public read, server-only write |
| **Legacy local assets** | Still referenced for backward compatibility |

---

## 5. Database

All tables live in Supabase PostgreSQL (`public` schema). Migrations are in `supabase/migrations/`.

### `products`

| Aspect | Detail |
|--------|--------|
| **Purpose** | Store product catalog for storefront and admin |
| **Primary key** | `id` (text slug, e.g. `"wildflower"`) |
| **Key columns** | `name_ar`, `name_en`, `description_ar`, `description_en`, `price`, `category`, `emoji`, `unit`, `default_quantity`, `kind`, `image_url`, `active`, `sort_order`, `created_at`, `updated_at` |
| **Relationships** | Optional reference from `hero_slides.product_id` (not enforced FK) |

### `orders`

| Aspect | Detail |
|--------|--------|
| **Purpose** | Customer orders from checkout flow |
| **Primary key** | `id` (uuid) |
| **Key columns** | `customer_name`, `customer_phone`, `customer_address`, `items` (jsonb array), `total`, `status`, `whatsapp_sent`, `notes`, `created_at` |
| **Relationships** | `items[].productId` references product slugs logically (not FK) |

### `site_settings`

| Aspect | Detail |
|--------|--------|
| **Purpose** | Key-value store for site configuration and admin password |
| **Primary key** | `key` (text) |
| **Key columns** | `value`, `category`, `updated_at` |
| **Notable keys** | `admin_password`, `whatsapp_owner`, `whatsapp_branch`, `hero_*`, `footer_*` |
| **Relationships** | None |

### `hero_slides`

| Aspect | Detail |
|--------|--------|
| **Purpose** | Homepage hero carousel slides |
| **Primary key** | `id` (uuid) |
| **Key columns** | `image_url`, `label_en`, `label_ar`, `product_id`, `active`, `sort_order`, `created_at`, `updated_at` |
| **Relationships** | Soft link to `products.id` via `product_id` |

### `about_page`

| Aspect | Detail |
|--------|--------|
| **Purpose** | Singleton CMS record for About page content |
| **Primary key** | `id` (integer, always `1`) |
| **Key columns** | `content` (jsonb — full `AboutPageContent` object), `updated_at` |
| **Relationships** | None |

### `blog_posts`

| Aspect | Detail |
|--------|--------|
| **Purpose** | Individual blog articles |
| **Primary key** | `id` (text slug) |
| **Key columns** | `title_ar/en`, `excerpt_ar/en`, `content_ar/en`, `image_url`, `emoji`, `date`, `read_time`, `active`, `sort_order`, `created_at`, `updated_at` |
| **Relationships** | None |

### `blog_page_settings`

| Aspect | Detail |
|--------|--------|
| **Purpose** | Singleton settings for blog listing page header |
| **Primary key** | `id` (integer, always `1`) |
| **Key columns** | `title_ar/en`, `description_ar/en`, `updated_at` |
| **Relationships** | None |

### Storage Bucket: `products`

| Aspect | Detail |
|--------|--------|
| **Purpose** | Public product/media images |
| **Access** | Public read; writes only via service_role on server |

---

## 6. Security

### bcrypt Password Hashing

- Admin password stored in `site_settings.admin_password` as bcrypt hash (12 rounds)
- `src/lib/password-hash.ts` wraps `bcryptjs`
- Migration `20260725170000_hash_admin_password.sql` converts legacy plain-text passwords
- Seed script hashes default password on seed

### HttpOnly Cookies

- Session cookie name: `admin-session`
- Flags: `httpOnly: true`, `sameSite: "strict"`, `secure: true` in production
- Max age: 7 days

### Session Secret (HMAC)

- Token format: `{sessionId}.{hmacSignature}`
- Signed with `ADMIN_SESSION_SECRET` + bound to current password hash
- Invalidates all sessions when password changes
- Required in production; dev fallback only in non-production

### Service Role Isolation

- `src/lib/supabase-admin.ts` marked `server-only`
- `SUPABASE_SERVICE_ROLE_KEY` never exposed to client
- All store modules use admin client for DB operations
- Public `src/lib/supabase.ts` contains no service role

### Row Level Security (RLS)

Migration `20260725180000_harden_rls_and_storage.sql` (manual apply):

| Table | anon SELECT | anon WRITE |
|-------|-------------|------------|
| `products` | Active only | Denied |
| `site_settings` | Public keys only (no `admin_password`) | Denied |
| `orders` | Denied | Denied |
| `hero_slides` | Active only | Denied |
| `about_page` | Allowed | Denied |
| `blog_posts` | Active only | Denied |
| `blog_page_settings` | Allowed | Denied |

All writes go through server API with `service_role` (bypasses RLS).

### Storage Policies

- Bucket `products`: public read only
- No anon/authenticated upload, update, or delete
- Uploads via `/api/media` using service_role

### Protected APIs

| Endpoint pattern | Protection |
|------------------|------------|
| `POST/PATCH/DELETE /api/products*` | `requireAdminApi()` |
| `PUT /api/settings` | `requireAdminApi()` |
| `GET /api/settings?scope=admin` | `requireAdminApi()` |
| `PUT /api/blog`, `/api/slider`, `/api/about` | `requireAdminApi()` |
| `POST /api/media` | `requireAdminApi()` |
| `GET /api/orders` | `requireAdminApi()` |
| `PATCH /api/orders/[id]` | `requireAdminApi()` |
| `POST /api/orders` | Public (customer checkout) |
| `GET /api/orders/lookup` | Public (phone-based lookup) |

### Admin Authentication Flow

1. `POST /api/admin/login` → verify bcrypt password → set HMAC cookie
2. `GET /api/admin/session` → verify cookie → return authenticated status
3. `POST /api/admin/logout` → clear cookie

### Additional Hardening

- `timingSafeEqual` for HMAC signature comparison
- Admin route excluded from i18n middleware
- Admin layout: `robots: noindex, nofollow`
- RLS test script verifies anon writes return 401

---

## 7. Performance

### ISR (Incremental Static Regeneration)

```ts
export const revalidate = 60;
```

Applied to:
- `[locale]/layout.tsx`
- `[locale]/page.tsx` (Home)
- `[locale]/about/page.tsx`
- `[locale]/blog/page.tsx`
- `[locale]/blog/[slug]/page.tsx`

Pages regenerate at most every 60 seconds on subsequent requests (fallback TTL).

### On-Demand Revalidation

`src/lib/revalidate-storefront.ts` calls `revalidatePath()` after admin writes:

| Trigger | Paths Revalidated |
|---------|-------------------|
| Blog save | `/[locale]/blog`, `/[locale]/blog/[slug]` |
| Product CRUD | Layout, home, shop |
| Slider save | Home |
| About save | About page |
| Settings save | Layout, home |

Effect: Admin changes appear on next page visit without waiting 60 seconds.

### Caching

| Layer | Strategy |
|-------|----------|
| **Static pages** | ISR cache on Vercel CDN |
| **API routes** | Dynamic by default (no static cache) |
| **ProductsProvider** | Client fetch with `cache: "no-store"` |
| **Product slider** | Client fetch on each page load |
| **Cart** | localStorage (no server cache) |

### Image Optimization

- `next/image` with AVIF/WebP formats
- Responsive `sizes` attributes
- Supabase remote patterns configured in `next.config.mjs`
- Device sizes: 640, 750, 828, 1080

### SSR / SSG / Dynamic Routes

| Route | Rendering Mode |
|-------|----------------|
| `/[locale]` | SSG + ISR (generateStaticParams for locales) |
| `/[locale]/about`, `/blog` | SSG + ISR |
| `/[locale]/blog/[slug]` | **Dynamic (on-demand)** + ISR, `dynamicParams: true` |
| `/[locale]/shop`, `/contact`, `/orders` | SSG + ISR (locale params) |
| `/admin` | Client-only (static shell) |
| `/api/*` | Dynamic (serverless functions) |

Build output example:
- `●` = SSG with generateStaticParams
- `ƒ` = Dynamic/on-demand (blog `[slug]`)

---

## 8. Deployment

### GitHub

- Source repository connected to Vercel
- Push triggers production/preview deployments

### Vercel

- Hosts Next.js application
- Serverless functions for API routes
- Edge middleware for i18n (`proxy.ts`)
- Production URL example: `new-organic-store.vercel.app`

### Supabase

- Managed PostgreSQL database
- Storage bucket for images
- Migrations applied manually via SQL Editor (project convention)
- Project ref example: `xbzktaiitnwywqplnrot`

### Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Public anon key (if client reads needed) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-side DB/Storage writes |
| `ADMIN_SESSION_SECRET` | Yes (prod) | HMAC signing for admin sessions |

Stored in `.env.local` locally and Vercel project settings for production.

### Production Build

```bash
npm run build   # next build — must pass without errors
npm run start   # next start — production server
```

Requirements:
- Node.js >= 22 (per `engines` in package.json)
- All env vars configured
- Supabase migrations applied
- Initial seed: `npm run seed` (one-time or idempotent)

---

## 9. Development Problems & Solutions

| # | Problem | Root Cause | How We Discovered It | How We Solved It |
|---|---------|------------|----------------------|------------------|
| 1 | **Local JSON storage** | Initial prototype stored products/settings in JSON files under `data/` | Files edited but production showed stale data | Migrated each store module to Supabase tables one by one |
| 2 | **Supabase migration** | Schema mismatch between local types and remote DB | CRUD errors, missing columns on deploy | Created incremental SQL migrations in `supabase/migrations/`; user applies manually |
| 3 | **Seed race condition** | Runtime `ensureSeed*` in stores during `next build` caused parallel writes | Build failed intermittently; duplicate seed attempts | Removed runtime seeding; created `scripts/seed-supabase.mjs` + `npm run seed` |
| 4 | **Vercel build issues** | Missing env vars, Node version, ESLint errors | CI/build logs on Vercel | Added `engines.node >= 22`, fixed lint rules, documented required env vars |
| 5 | **RLS policies** | Initial migrations had permissive anon write policies | Security audit; anon could INSERT/UPDATE/DELETE | Created `20260725180000_harden_rls_and_storage.sql`; test script confirms 401 on anon writes |
| 6 | **Service role exposure** | Admin client was importable from shared `supabase.ts` | Code review | Isolated to `supabase-admin.ts` with `server-only` guard |
| 7 | **Password hashing** | Admin password stored as plain text in `site_settings` | Security audit | bcrypt via `password-hash.ts`; migration to hash existing passwords |
| 8 | **Revalidation (stale storefront)** | SSG at build with no revalidation; admin saw fresh data but storefront didn't | Admin updates not visible on Vercel for hours | Added `export const revalidate = 60` to server pages |
| 9 | **Static pages / stale products** | `ProductsProvider` skipped client fetch when `initialProducts.length > 0` | Catalog never updated after hydration | Always fetch `/api/products` with `cache: "no-store"` on mount |
| 10 | **ISR implementation** | Needed balance between static performance and fresh data | Vercel showed old Supabase data | ISR 60s on layout + pages; client sync for products |
| 11 | **On-Demand Revalidation** | 60s delay still too slow for admin workflow | User request after ISR | `revalidatePath()` in all admin mutation API routes via `revalidate-storefront.ts` |
| 12 | **Blog dynamic routes** | `generateStaticParams` pre-built all slugs at build; new posts required redeploy | New blog post 404 after admin create | Removed slug pre-generation; `dynamicParams: true`; on-demand ISR |
| 13 | **Storage migration** | Images in `public/assets` only | Admin upload needed cloud storage | Supabase Storage bucket `products`; `media-store.ts` uploads via service_role |
| 14 | **Environment variables** | Missing `SUPABASE_SERVICE_ROLE_KEY` on Vercel | API 500 errors in production | Documented all required vars; verified in Vercel dashboard |
| 15 | **Admin authentication** | Simple password check without secure sessions | Security review | HMAC-signed HttpOnly cookies bound to password hash |
| 16 | **Products context** | SSR initial data treated as permanent | Shop showed outdated prices/names | Client refresh on mount regardless of initial data |
| 17 | **Next.js cache** | Full static generation without invalidation path | Content frozen until redeploy | ISR + on-demand `revalidatePath` after writes |
| 18 | **Products schema drift** | Legacy columns (`weight_key`) vs new `CatalogProduct` model | Type errors and missing fields | Migration `align_products_catalog_model.sql` |
| 19 | **ESLint hook errors** | `set-state-in-effect` violations in admin components | `npm run lint` failures | Refactored to async IIFE pattern inside `useEffect` |
| 20 | **Responsive admin UI** | Horizontal tabs and tables overflowed on mobile | DevTools mobile testing | Mobile select nav, order cards, responsive modals |
| 21 | **Responsive hero slider** | Fixed `w-96` width caused overflow on 360–390px screens | Mobile screenshot review | Fluid `w-full max-w-[26rem]` sizing |

---

## 10. Engineering Decisions

### Why Supabase?

- Managed PostgreSQL with REST API and Storage in one platform
- Generous free tier for small e-commerce
- Row Level Security for defense-in-depth
- Faster migration path from JSON files than self-hosted Postgres
- Native integration with `@supabase/supabase-js`

### Why Not Firebase?

- Project already oriented toward relational data (products, orders, settings)
- SQL migrations fit the catalog/order model better than Firestore documents
- Supabase Storage + RLS match the server-side write pattern
- Team familiarity with PostgreSQL-style schemas

### Why App Router?

- Next.js 16 default; Server Components reduce client JS
- Built-in ISR and `revalidatePath` for content-heavy storefront
- Colocated API Route Handlers simplify full-stack structure
- `next-intl` has first-class App Router support

### Why ISR (60 seconds)?

- Storefront pages are read-heavy; static serving is fast on Vercel CDN
- 60s TTL provides reasonable freshness without hitting DB on every request
- Works as safety net when on-demand revalidation is missed

### Why On-Demand Revalidation?

- Admin expects immediate feedback after saving content
- 60s ISR alone is unacceptable for CMS workflow
- `revalidatePath` is simpler than cache tags for this architecture (no `fetch` with tags)

### Why Service Role on Server?

- No Supabase Auth for customers; admin auth is custom
- RLS blocks anon writes; server needs unrestricted access for admin API
- Single server-side client simplifies all store modules
- Protected by `server-only` + never exposed to browser

### Why Cart in localStorage?

- No customer authentication required
- Cart is device-local by nature for guest checkout
- Avoids session management complexity and DB writes for transient state
- Instant cart restore on page reload

### Why Custom Admin Auth (Not Supabase Auth)?

- Single shared admin password fits small business use case
- No need for user registration, roles, or email verification
- Simpler than configuring Supabase Auth for one admin user
- Password stored in existing `site_settings` table

### Why Manual SQL Migrations?

- User convention: review SQL before applying to production Supabase
- Prevents accidental schema changes during deploy
- Clear audit trail in `supabase/migrations/`

### Why Keep Legacy Local Images?

- Backward compatibility during storage migration
- `media-store` lists both Supabase and `public/assets` images
- Avoids broken image URLs for existing products

---

## 11. Final Audit

### Completion Estimate: **~88%**

| Area | Completion |
|------|------------|
| Storefront core | 95% |
| Admin dashboard | 95% |
| Supabase migration | 100% |
| Security hardening | 90% (pending RLS migration apply on prod) |
| Performance (ISR) | 95% |
| Testing automation | 30% |
| Payment gateway | 0% (by design — WhatsApp orders) |
| Customer auth | 0% (by design — guest checkout) |

### Production Ready?

**Conditionally yes** — ready for production if:

- [x] `npm run build` passes
- [x] Environment variables set on Vercel
- [x] Node 22 configured on Vercel
- [ ] RLS hardening migration applied on production Supabase
- [ ] `ADMIN_SESSION_SECRET` set in production
- [ ] Initial seed run against production database
- [ ] Admin password changed from default

### Strengths

- Clean separation: stores → API routes → UI
- Bilingual CMS for all major content types
- ISR + on-demand revalidation for performance and freshness
- Security layers: bcrypt, HMAC sessions, RLS, service-role isolation
- Responsive storefront and admin on mobile
- Idempotent seed script for reproducible setup
- Manual integration test scripts for each store

### Weaknesses

- No automated test suite (unit/e2e)
- Order lookup API is public (phone-based, no OTP verification)
- Contact page partially hardcoded (not fully CMS-driven)
- Legacy JSON/data files still present (dead code risk)
- No payment integration (WhatsApp-only workflow)
- RLS migration requires manual apply — easy to miss
- Blog/contact SEO could be enhanced with per-page metadata
- No rate limiting on public APIs (orders, lookup)

### Future Improvements

1. Add Playwright e2e tests for checkout and admin CRUD
2. Rate-limit `POST /api/orders` and `/api/orders/lookup`
3. OTP verification for order lookup by phone
4. Remove legacy JSON seed files and dead code (`site-config.ts`, static product data fallbacks)
5. Per-page `generateMetadata` for blog posts and products
6. Supabase Auth or multi-admin user support
7. Analytics integration (Vercel Analytics, Plausible)
8. Email notifications alongside WhatsApp
9. Automated migration apply in CI/CD
10. Contact page CMS integration

---

## 12. Timeline

```
Phase 1 — Foundation
├── Project setup: Next.js App Router + Tailwind + next-intl
├── Local JSON/file-based data storage
└── Static product catalog and basic storefront pages

Phase 2 — Supabase Migration (store by store)
├── Products → products table + products-store.ts
├── Settings → site_settings + settings-store.ts
├── Orders → orders table + orders-store.ts
├── Media → Supabase Storage bucket + media-store.ts
├── Hero Slider → hero_slides + slider-store.ts
├── About → about_page + about-store.ts
└── Blog → blog_posts + blog_page_settings + blog-store.ts

Phase 3 — Admin Dashboard
├── Admin shell with tab navigation
├── CRUD panels for all content types
├── Image picker and upload
└── Order management with status workflow

Phase 4 — Storefront Integration
├── ProductsProvider wired to dynamic catalog
├── Checkout + WhatsApp flow
├── Order lookup page
├── Search dialog
└── Hero slider from API

Phase 5 — Build & Seed Hardening
├── Removed runtime seeding (race condition fix)
├── scripts/seed-supabase.mjs + npm run seed
└── Build reliability on Vercel

Phase 6 — Security
├── bcrypt password hashing
├── HMAC session tokens + HttpOnly cookies
├── service_role isolation (server-only)
├── RLS hardening migration + test script
└── Storage policy lockdown

Phase 7 — Performance
├── ISR (revalidate = 60) on server pages
├── ProductsProvider client sync fix
├── On-Demand Revalidation (revalidatePath)
└── Blog on-demand dynamic routes

Phase 8 — UX & Polish
├── Responsive admin dashboard
├── Responsive hero slider
└── Production deployment to Vercel
```

---

## 13. Folder Structure

```
project/
├── messages/                    # i18n translation JSON (ar, en)
├── public/                      # Static assets (legacy images, favicon)
│   └── assets/                  # Legacy product images
├── scripts/                     # Seed, test, and utility scripts
│   └── seed-data/               # JSON seed files for npm run seed
├── supabase/
│   ├── config.toml              # Supabase local config
│   └── migrations/              # SQL migrations (manual apply)
├── src/
│   ├── app/
│   │   ├── [locale]/            # Localized storefront routes
│   │   │   ├── layout.tsx       # Root locale layout (providers, ISR)
│   │   │   ├── page.tsx         # Home page
│   │   │   ├── about/           # About page
│   │   │   ├── blog/            # Blog listing + [slug] posts
│   │   │   ├── contact/         # Contact page
│   │   │   ├── orders/          # Customer order lookup
│   │   │   ├── shop/            # Product catalog page
│   │   │   └── template.tsx     # Page transition wrapper
│   │   ├── admin/               # Admin dashboard (no i18n)
│   │   │   ├── layout.tsx       # Admin HTML shell
│   │   │   └── page.tsx         # Admin entry point
│   │   ├── api/                 # Route Handlers (REST API)
│   │   │   ├── admin/           # Login, logout, session
│   │   │   ├── products/        # Product CRUD
│   │   │   ├── orders/          # Order CRUD + lookup
│   │   │   ├── blog/            # Blog save
│   │   │   ├── slider/          # Slider save
│   │   │   ├── about/           # About save
│   │   │   ├── settings/        # Settings + WhatsApp
│   │   │   └── media/           # Image upload/list
│   │   └── globals.css          # Global styles and theme tokens
│   ├── components/
│   │   ├── admin/               # Admin panel components
│   │   ├── blog/                # Blog card component
│   │   ├── contact/             # Contact form
│   │   ├── layout/              # Navbar, footer, cart, checkout, search
│   │   ├── orders/              # My orders component
│   │   ├── shop/                # Product card, grid, slider
│   │   └── ui/                  # Button, animated section
│   ├── config/
│   │   └── navigation.ts        # Main nav items config
│   ├── context/
│   │   ├── admin-auth-context.tsx
│   │   ├── cart-context.tsx
│   │   └── products-context.tsx
│   ├── data/                    # Legacy static data (fallback/reference)
│   ├── i18n/
│   │   ├── routing.ts           # Locale config
│   │   ├── navigation.ts        # Locale-aware Link/redirect
│   │   └── request.ts           # Server-side message loading
│   └── lib/
│       ├── *-store.ts           # Data access layer (7 stores)
│       ├── admin-auth.ts        # Session management
│       ├── api-auth.ts          # API guard helper
│       ├── password-hash.ts     # bcrypt utilities
│       ├── revalidate-storefront.ts  # On-demand ISR helpers
│       ├── supabase-admin.ts    # Service role client
│       ├── supabase.ts          # Public Supabase client
│       ├── types.ts             # Shared TypeScript types
│       ├── whatsapp.ts          # WhatsApp URL helpers
│       ├── product-price.ts     # Price formatting
│       ├── product-images.ts    # Image URL helpers
│       ├── customer-orders.ts   # localStorage order helpers
│       └── phone.ts             # Phone formatting
├── next.config.mjs              # Next.js + next-intl + image config
├── package.json
├── proxy.ts                     # next-intl middleware
└── PROJECT_DOCUMENTATION.md     # This document
```

---

## 14. APIs

### Admin Auth

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `POST` | `/api/admin/login` | Public | Verify password, set session cookie |
| `POST` | `/api/admin/logout` | Public | Clear session cookie |
| `GET` | `/api/admin/session` | Public | Return `{ authenticated: boolean }` |

### Products

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/api/products` | Public | List active products |
| `GET` | `/api/products?all=true` | Admin | List all products including inactive |
| `POST` | `/api/products` | Admin | Create product → revalidate storefront |
| `GET` | `/api/products/[id]` | Public | Get single product |
| `PATCH` | `/api/products/[id]` | Admin | Update product → revalidate storefront |
| `DELETE` | `/api/products/[id]` | Admin | Delete product → revalidate storefront |

### Orders

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/api/orders` | Admin | List all orders |
| `POST` | `/api/orders` | Public | Create customer order |
| `PATCH` | `/api/orders/[id]` | Admin | Update order status |
| `GET` | `/api/orders/lookup?phone=&ids=` | Public | Lookup orders by phone and/or saved IDs |

### Blog

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/api/blog` | Public | Read blog settings + active posts |
| `GET` | `/api/blog?all=true` | Admin | Read all posts including inactive |
| `PUT` | `/api/blog` | Admin | Save blog settings and posts → revalidate blog pages |

### Hero Slider

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/api/slider` | Public | List active slides |
| `GET` | `/api/slider?all=true` | Admin | List all slides |
| `PUT` | `/api/slider` | Admin | Replace all slides → revalidate home |

### About

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/api/about` | Public | Read about page content |
| `PUT` | `/api/about` | Admin | Update about content → revalidate about page |

### Settings

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/api/settings` | Public | Read public settings (no admin password) |
| `GET` | `/api/settings?scope=admin` | Admin | Read all settings except password hash |
| `PUT` | `/api/settings` | Admin | Update settings → revalidate layout + home |
| `GET` | `/api/settings/whatsapp` | Public | Get WhatsApp numbers for checkout |

### Media

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/api/media` | Public | List available images (Supabase + legacy) |
| `POST` | `/api/media` | Admin | Upload image to Supabase Storage |

---

## 15. Scripts

### package.json Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `next dev` | Start development server with hot reload |
| `build` | `next build` | Production build (TypeScript check + static generation) |
| `start` | `next start` | Serve production build |
| `lint` | `eslint` | Run ESLint across the project |
| `seed` | `node scripts/seed-supabase.mjs` | Seed Supabase from local JSON seed data (idempotent) |

### scripts/ Directory

| Script | Purpose |
|--------|---------|
| `seed-supabase.mjs` | Main seed script: products, settings, orders, slides, about, blog, bcrypt password |
| `seed-data/products.json` | Product catalog seed data (33 products) |
| `test-products-crud.mjs` | Integration test for products store CRUD |
| `test-settings-crud.mjs` | Integration test for settings store |
| `test-orders-crud.mjs` | Integration test for orders store |
| `test-slider-crud.mjs` | Integration test for slider store |
| `test-about-crud.mjs` | Integration test for about store |
| `test-blog-crud.mjs` | Integration test for blog store |
| `test-blog-store-integration.mjs` | End-to-end blog store integration test |
| `test-media-storage.mjs` | Test Supabase Storage upload/list |
| `test-rls.mjs` | Verify anon users cannot write to protected tables (expects 401) |
| `optimize-images.mjs` | Batch optimize images in public directory using sharp |

### Typical Setup Workflow

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local   # (if exists) — set Supabase vars

# 3. Apply migrations in Supabase SQL Editor
#    (run files in supabase/migrations/ in order)

# 4. Seed database
npm run seed

# 5. Development
npm run dev

# 6. Verify
npm run lint
npm run build

# 7. Optional: run integration tests
node scripts/test-rls.mjs
node scripts/test-products-crud.mjs
```

---

## Appendix: Environment Variables Reference

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ADMIN_SESSION_SECRET=your-random-secret-min-32-chars
```

---

*End of document.*

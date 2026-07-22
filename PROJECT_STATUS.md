## How to Continue Work Later
1. Open terminal in `d:\qr-menu-saas` and run `npm run dev` if testing locally.
2. Production site is live at: **`https://qr-menu-saas-dun.vercel.app`**
3. Access points:
   - Admin Panel: `https://qr-menu-saas-dun.vercel.app/admin`
   - Super Admin Console: `https://qr-menu-saas-dun.vercel.app/superadmin`
   - Customer Menu: `https://qr-menu-saas-dun.vercel.app/table/1?cafe=<ID>`
   - Waiter Dashboard: `https://qr-menu-saas-dun.vercel.app/waiter`

---

## ⚠️ CRITICAL — QR CODE DOMAIN (READ BEFORE TOUCHING QR CODES)

- **Live domain**: `https://qr-menu-saas-dun.vercel.app` ✅
- **Dead domain**: `https://qr-menu-saas.vercel.app` ❌ (belongs to a DIFFERENT Vercel project — NOT ours)
- **Old physical QR stickers** encoded the dead domain → 404 on phone scan forever
- **Fix deployed & hardened**: All domain references replaced with `window.location.origin` & `formatQrDomain()` automatic domain interceptor in `src/utils/security.js`.
- **Action required**: Reprint QR sticker sheets from Admin → QR & Stickers tab and replace old table stickers.

---

## Project Overview
Multi-tenant QR Menu SaaS. Super Admin provisions cafe branches. Owners get activation keys, configure branding, and run isolated dashboards.

---

## Test Credentials

| Role | Username | Password | URL |
|------|----------|----------|-----|
| Super Admin | `SaasSuperQR999` | `SuperAdmin8080` | `/superadmin` |
| SS CAFE & Restro | `sscafe` | `SSCAFE$1080` | `/admin` |

---

## Live Deployment

- **Git Branch**: `main`
- **Remote Repo**: https://github.com/SahilSingh999/qr-menu-saas
- **Live Domain**: `https://qr-menu-saas-dun.vercel.app`
- **Vercel Deployment Protection**: DISABLED (anyone can scan QR and access menu)

---

## Completed Features

1. Database Schema Expansion (activation_key, is_activated, expires_at)
2. Cryptographically Secure Key Generation (ACT-XXXX-XXXX)
3. Super Admin Key Registry UI
4. Activation Entry View for cafe owners
5. Validate Activation Key via Supabase
6. Cafe Owner Onboarding Wizard (Step 1: Details)
7. Password Setup & Activation (Step 2)
8. Owner Login Filtering (hides unactivated cafes)
9. Cafe Isolation by cafe_id
10. Super Admin Dashboard at /superadmin
11. Dynamic Theme & Brand Customizations
12. Dynamic Table Merging for Waiter
13. Production QR Base Domain setting with qr_domain DB column
14. **Bulletproof Print Engine** - Dedicated print window (window.open) with full inline HTML/CSS - works on all browsers
15. **WhatsApp Credential Sharing** - Super Admin can share activation key + username + password via WhatsApp or clipboard copy from cafe cards
16. **QR Domain Auto-Detection** - qrBaseUrl now uses window.location.origin, fixing 404 on phone scan
17. **QR Domain Hardcode Fix & Interceptor** - Removed ALL stale `qr-menu-saas.vercel.app` hardcodes; `formatQrDomain` in `security.js` automatically rewrites dead domains to `window.location.origin`.
18. **Save Domain Confirmation Feedback** - Added animated confirmation badge (`✅ Saved to DB for [Cafe Name]!`) and top alert banner when saving default QR domains in AdminPanel.

---

## Security Hardening
- SHA-256 Web Crypto for all passwords (`src/utils/security.js`)
- Row Level Security (RLS) on Supabase (`supabase/migrations/20260720000000_security_rls.sql`)
- Password trimming for legacy plain-text passwords
- Automatic domain interceptor in `formatQrDomain()`

---

## Pending / Next Steps

### 🔴 MUST DO FIRST (Before Building New Features)
1. **Run Supabase migration** — Go to Supabase Dashboard → SQL Editor → paste and run the contents of:
   `supabase/migrations/20260721_full_production_schema.sql`
   - Adds missing columns: `admin_username`, `footer_message`, `font_family`, `logo_placement`, `table_merges`, `qr_domain`

2. **Reprint QR Stickers** — Admin → QR & Stickers tab → click "Print Stickers Sheet" → replace old physical table stickers with new ones.

### 🟡 NEXT FEATURES TO BUILD
3. **Feature 18: Analytics Dashboard** — Revenue stats, top menu items, orders-by-table charts
4. **Feature 19: Real-time Order Sound Alerts** — Audio ding + badge count when new order arrives
5. **Feature 20: Waiter Call Button** — Customer taps "Call Waiter" on menu; admin sees live alert
6. **Feature 21: Menu Category Drag-and-Drop Reorder** — Reorder categories and items in admin
7. **Feature 22: Multi-language Menu** — Toggle Hindi/English on customer view

---

## Key Files

| File | Purpose |
|------|---------|
| src/utils/security.js | SHA-256 auth, formatQrDomain domain interceptor |
| src/components/AdminPanel.jsx | Main admin + super admin panel |
| src/context/SupabaseContext.jsx | Supabase DB calls, auth, local overrides sync |
| src/index.css | Full design system + @media print isolation |
| vercel.json | SPA rewrite rule (/* → /index.html) |
| supabase/migrations/ | SQL schema migrations |

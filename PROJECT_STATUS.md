
## How to Continue Work Later
1. Open terminal in `d:\qr-menu-saas` and run `npm run dev` if the server is not already running.
2. Open `http://localhost:5173/admin`.
3. If you were previously logged in, the app restores the session automatically from `localStorage`.
4. All auth flags (`admin_session_cafe_id`, `is_super_admin_session`) are persisted — you can close the browser and return without losing workspace.
5. To reset the session, use the red **Log Out Cafe** button at the top right of the admin panel.

---

This document logs the current development status, completed deliverables, remaining roadmap objectives, and next steps for converting the single-tenant QR Menu application into a multi-tenant SaaS.

---

## Project Overview
Transitioning the restaurant ordering application into a multi-tenant SaaS architecture. This allows the Super Admin to provision and manage multiple distinct cafe branches. Cafe owners receive activation keys, configure their branding profile, secure their workspace with a custom password, and run isolated dashboard operations.

---

## ✅ Completed Features (1 through 9)

- **Feature 1: Database Schema Expansion**
  * Added `activation_key` (text, unique), `is_activated` (boolean, default false), and `expires_at` (timestamptz, 1 year expiry) columns to the `cafes` table.
  * Migrated existing cafes to `is_activated = true` to preserve legacy functionality.

- **Feature 2: Cryptographically Secure Key Generation**
  * Updated `createCafe` to generate high-entropy `ACT-XXXX-XXXX` activation keys.
  * Checks database-level uniqueness before saving keys.

- **Feature 3: Super Admin Key Registry UI**
  * Modified Cafes Directory grid inside the admin panel to display the activation status badge (`Active ✅` or `Pending ⏳`), render the key (`USED` if active), and add a click-to-copy clipboard button.

- **Feature 4: Activation Entry View**
  * Designed the togglable **🔑 Activate Cafe Branch** access card view inside the owner login section to capture activation key inputs.

- **Feature 5: Validate Activation Key**
  * Built the `validateActivationKey` context query checking key format, activation status, and expiry times against Supabase (with localStorage fallback).

- **Feature 6: Cafe Owner Onboarding (Step 1)**
  * Created the Onboarding Details wizard form pre-populating custom inputs (Cafe Name, location, phone, description, and logo uploader) upon successful key verification.

- **Feature 7: Password Setup & Activation (Step 2)**
  * Enabled the security password setup input field, integrated an absolute hold-to-reveal eye toggle button, implemented storage logo image uploading, and structured the final cafe profile activation update.

- **Feature 8: Owner Login Dropdown Filtering**
  * Modified the `<select>` element inside the Cafe Owner Access login view in `AdminPanel.jsx` to filter out non-activated cafes (by checking `c.is_activated !== false`).

- **Feature 9: Cafe Isolation using `cafe_id`**
  * Enforced UI scope limits so Cafe Owners cannot view or use the Cafe creation form, delete branch buttons, or access un-isolated cafe statistics.
  * Isolated localStorage-based raw ingredients inventory lists to be separated per-cafe ID (under `raw_ingredients_inventory_cafe_${cafeId}`).
  * Filtered un-activated cafes out of all service staff and waiter selection screens.
  * Modified the global customer preview link in Navbar to automatically fallback to the first active/activated cafe branch.

---

## 🚧 Features in Progress / Bug Fixes Done This Session

- **Bug Fix: Menu Item "Out of Stock" False Badge** ✅
  * **Problem**: Newly created menu items (without a stock value set) displayed a red "Out of Stock" badge in both the Admin Panel (Menu Manager) and Customer View, even when the item was marked "Available."
  * **Root cause 1**: Old code was storing `stock: null` in the `menu_items_local_overrides` localStorage entry when the user didn't enter a stock value. During the merge, `null !== undefined` evaluated as `true`, which applied `stock = null`. However, a later `Number(null) <= 0` check wasn't the trigger — the issue was from old buggy code that previously stored `stock: 0` in the same key.
  * **Root cause 2**: The `fetchMenuItems` merge logic treated `stock: null` as if it was a valid numeric stock value (which it is not — `null` means unlimited/not set).
  * **Fix implemented in [SupabaseContext.jsx](file:///d:/qr-menu-saas/src/context/SupabaseContext.jsx)**:
    1. Changed `createMenuItem` to only save a `stock` key in the override if the value is a real number (not `null`/`undefined`). Added `_stockExplicitlySet: true` flag when a real stock value is set.
    2. Changed the `fetchMenuItems` merge to treat `null` or `undefined` override stock as "unlimited" (resolves to `undefined`), preventing the false Out-of-Stock badge.
    3. Added a **one-time migration purge** in `fetchMenuItems` that automatically removes stale `stock: null` and `stock: 0` entries from old localStorage data that was incorrectly saved before this fix. Items with `_stockExplicitlySet: true` are exempt from this purge.
    4. Applied same null-safe stock resolution in `updateMenuItem`.

- **Bug Fix: Customer View Showing Wrong Cafe Menu** ✅  
  * **Problem**: Customer preview link in the Navbar always pointed to the first alphabetical cafe (often an unconfigured "New Test Cafe" with no menu items).
  * **Fix implemented**: Modified [Navbar.jsx](file:///d:/qr-menu-saas/src/components/Navbar.jsx) to reactively track the logged-in cafe's ID from local storage. Modified [CustomerView.jsx](file:///d:/qr-menu-saas/src/components/CustomerView.jsx) to use the active owner session ID as a fallback when no `?cafe=` query parameter is supplied.

- **Bug Fix: Menu Items Not Showing After Adding** ✅  
  * **Problem**: Adding a menu item appeared to succeed but the item was never visible in the Customer View. The Admin Panel's Digital Catalog also showed no items even after creating them.
  * **Root cause**: Non-database columns (`recipe`, `availability_status`, `stock`, `low_stock_threshold`, `stock_unit`) were being sent to Supabase in `insert`/`update` queries. This caused silent query failures — the app wrote only to LocalStorage, which was subsequently ignored by the successful `fetchMenuItems` query.
  * **Fix implemented**: Modified [SupabaseContext.jsx](file:///d:/qr-menu-saas/src/context/SupabaseContext.jsx) to strip out these fields during database queries and save/retrieve them to/from a client-side override map (`menu_items_local_overrides`) in `localStorage`.

---

## ✅ Completed Core SaaS Features (10 through 12)

- **Feature 10: Super Admin Dashboard & Registry**
  * Built dedicated authentication checkpoint (`superadmin` / `admin123`).
  * Isolated SaaS-wide metrics overview and cafe branch listing dashboard.
- **Feature 11: Dynamic Theme & Brand Customizations**
  * Added custom cafe branding settings for theme colors, font families, and logo alignments.
- **Feature 12: Dynamic Table Merging**
  * Designed Waiter-managed table grouping modal to combine any arbitrary tables dynamically.
  * Resolved customer QR codes dynamically to the primary table order session.
  * Consolidated order history & kitchen display cards with instant split options.

---

## ⏸️ Deferred Features (Post-Launch Phase)

- **Feature 13: Subscription Plans & Pricing**
  * Plan tiers, feature gating, billing integrations, and subscription expiry. Deferred for post-launch after initial 10 client installations.

---

## 🔑 Test Credentials

| Role | Username / Cafe | Password |
|------|----------------|----------|
| Super Admin | `SaasSuperQR999` | `SuperAdmin8080` |
| Cafe Owner (Trackside) | `trackside` | `trackside123` *(or whatever was set during onboarding)* |
| New tenant registration | Use key `ACT-24KO-TK1E-13JC` | Set during onboarding |

- **Admin Panel (Cafe Owners)**: http://localhost:5173/admin
- **Super Admin Console**: http://localhost:5173/superadmin
- **Customer View**: http://localhost:5173 *(auto-resolves to logged-in cafe's menu)*
- **Waiter Dashboard**: http://localhost:5173/waiter

---

## 📁 Files Modified This Entire Session

| File | What Changed |
|------|-------------|
| [src/components/AdminPanel.jsx](file:///d:/qr-menu-saas/src/components/AdminPanel.jsx) | Filtered Owner dropdown, hid cafe creation form & delete buttons from branch owners, isolated raw inventory by cafe, corrected metrics leakages, replaced dropdown login with secure username login, added URL param locks, updated onboarding Step 2 to capture admin usernames, created separate /superadmin route structure, added menu item editing UI & Cancel logic, resolved layout overlapping on Cafes settings tab, exposed branding & theme settings form to Super Admins managing a workspace, resolved Cafes Settings tab button visibility. |
| [src/components/WaiterDashboard.jsx](file:///d:/qr-menu-saas/src/components/WaiterDashboard.jsx) | Filtered waiter select dropdowns to hide unactivated cafes, isolated raw ingredients by active selectedCafe, added URL parameter locks |
| [src/components/CustomerView.jsx](file:///d:/qr-menu-saas/src/components/CustomerView.jsx) | Scoped raw inventory deductions to active cafe ID; active owner session fallback; replaced portions dropdown select with interactive portion pills / static badges. |
| [src/components/Navbar.jsx](file:///d:/qr-menu-saas/src/components/Navbar.jsx) | Reactive customer preview link resolving to active session cafe |
| [src/context/SupabaseContext.jsx](file:///d:/qr-menu-saas/src/context/SupabaseContext.jsx) | Isolated non-DB menu item schema columns into localStorage overrides; fixed false Out-of-Stock badge by using null-safe stock merge logic and one-time stale data purge |
| [src/index.css](file:///d:/qr-menu-saas/src/index.css) | Added styling for portion pills (`.cv-portions-container`, `.cv-portion-pill`, light/dark themes), removed `.list-card` full width layout override on cafes tab, added card overflow protection to menu items. |
| [supabase/migrations/20260708000000_add_admin_username.sql](file:///d:/qr-menu-saas/supabase/migrations/20260708000000_add_admin_username.sql) | Added `admin_username` column to the `cafes` table |
| [supabase/migrations/20260705000001_add_onboarding_fields.sql](file:///d:/qr-menu-saas/supabase/migrations/20260705000001_add_onboarding_fields.sql) | Added `location`, `phone`, `description` columns to `cafes` table |
| [PROJECT_STATUS.md](file:///d:/qr-menu-saas/PROJECT_STATUS.md) | This document |

---

## 🗄️ Database Schema (Current State)

### `cafes` table
```
id, name, description, location, phone, logo_url, theme_color,
table_count, admin_password, admin_username, footer_message,
activation_key, is_activated, expires_at, currency, created_at
```
> **Note**: `footer_message` and `currency` are saved in `cafes_saas_overrides` in localStorage because they are not yet in the DB schema.

### `menu_items` table
```
id, cafe_id, name, category, price, description, image_url,
portion_options, is_available, is_veg, created_at
```
> **Note**: `stock`, `low_stock_threshold`, `stock_unit`, `recipe`, `availability_status` are saved in `menu_items_local_overrides` localStorage key because they are not in the DB schema.

### `orders` table
```
id, cafe_id, table_number, items (JSON text), total_price, status, created_at
```

---

## 🐞 Known Issues & Status

| Issue | Status | Notes |
|-------|--------|-------|
| Menu items not showing after adding | ✅ Fixed | Non-DB columns stripped before Supabase insert |
| Customer View showing wrong cafe | ✅ Fixed | Navbar & CustomerView now use active session cafe ID |
| New menu items showing "Out of Stock" | ✅ Fixed | Null-safe stock merge + stale data purge added |
| Database schema crash on `admin_username` | ✅ Fixed | Column added via migration |
| Overlapping/Empty space on Cafes Tab | ✅ Fixed | Removed grid full-width override on list-card |
| Superadmin settings change not working | ✅ Fixed | Exposed branding form to Superadmin in workspace mode, fixed tab button visibility |
| Portion options dropdown clutter | ✅ Fixed | Replaced dropdown with premium visual pills & static badges |
| XSS / Text overflow on menu item cards | ✅ Fixed | Applied flex layout text-overflow clipping and word-break ellipsis |

---

## ▶️ Exact Next Task to Resume

1. **Apply Schema Synchronization to Remote Database**:
   - Run the created migration file `supabase/migrations/20260713000000_sync_schema.sql` on the live database.
   - The application is fully prepared to dynamically transition data from client-side overrides to the new database columns on next start once these columns exist in the database schema.

---

## 💡 Important Notes for Next Session
- All SaaS custom attributes (branding configurations, inventory stock, table merges, recipes, etc.) are now fully database-integrated in `SupabaseContext.jsx`.
- If the database columns do not exist yet, the application safely degrades to local overrides as a fallback and will automatically migrate them once the schema is updated.
- `npm run dev` must be running for the dev server at `http://localhost:5173`.


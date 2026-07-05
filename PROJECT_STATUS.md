# Project Status: QR Menu SaaS Transition

This document logs the current development status, completed deliverables, remaining roadmap objectives, and next steps for converting the single-tenant QR Menu application into a multi-tenant SaaS.

---

## Project Overview
Transitioning the restaurant ordering application into a multi-tenant SaaS architecture. This allows the Super Admin to provision and manage multiple distinct cafe branches. Cafe owners receive activation keys, configure their branding profile, secure their workspace with a custom password, and run isolated dashboard operations.

---

## ✅ Completed Features (1 through 7)

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

---

## 🚧 Features in Progress
- **None** (Feature 7 complete; awaiting user SQL DDL query execution on Supabase console).

---

## 📋 Remaining Features (8 through 12)
- [ ] **Feature 8**: Owner login (Hide un-activated cafes from the owner access branch dropdown).
- [ ] **Feature 9**: Cafe isolation using `cafe_id` (Filter menu items, orders, staff, etc. by tenant branch).
- [ ] **Feature 10**: Super Admin dashboard.
- [ ] **Feature 11**: Theme management.
- [ ] **Feature 12**: Subscription plans.

---

## 📁 Files Modified Today
*   [src/context/SupabaseContext.jsx](file:///d:/qr-menu-saas/src/context/SupabaseContext.jsx): Added key validation database logic and provider exports.
*   [src/components/AdminPanel.jsx](file:///d:/qr-menu-saas/src/components/AdminPanel.jsx): Added onboarding wizard states, details setup form inputs, credentials password setup field with hold-to-reveal SVG toggles, and logo uploading submission.
*   [supabase/migrations/20260705000001_add_onboarding_fields.sql](file:///d:/qr-menu-saas/supabase/migrations/20260705000001_add_onboarding_fields.sql): Created DDL statements to add custom onboarding profile columns to `cafes`.

---

## 🐞 Known Issues
*   **Database Schema Updates Pending**: The Onboarding Details form updates fields (`location`, `phone`, and `description`) that do not exist yet on the live Supabase database `cafes` table. This triggers a database column-not-found error upon clicking "Activate Cafe".
    *   *Solution*: Run the migration script [20260705000001_add_onboarding_fields.sql](file:///d:/qr-menu-saas/supabase/migrations/20260705000001_add_onboarding_fields.sql) in your Supabase SQL Editor.

---

## ▶️ Exact Next Task to Start Tomorrow
*   **Implement Feature 8: Owner login**
    *   Modify the dropdown `<select>` element inside the Cafe Owner Access login view in `AdminPanel.jsx` to filter out non-activated cafes (by checking `c.is_activated !== false`).

---

## 💡 Important Notes for Next Session
*   Ensure that the Supabase migration script adding `location`, `phone`, and `description` is executed in the user's Supabase dashboard before starting.
*   The login dropdown filter should evaluate `is_activated !== false` (not `=== true`) so that legacy active cafes (which might have `is_activated` as null) remain visible and accessible.

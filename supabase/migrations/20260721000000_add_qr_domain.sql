-- Migration to add qr_domain setting to cafes table
-- Defaulting to live production Vercel URL

ALTER TABLE cafes ADD COLUMN IF NOT EXISTS qr_domain TEXT DEFAULT 'https://qr-menu-saas-dun.vercel.app';

-- Assign default qr_domain for existing cafes
UPDATE cafes SET qr_domain = 'https://qr-menu-saas-dun.vercel.app' WHERE qr_domain IS NULL OR qr_domain = '';

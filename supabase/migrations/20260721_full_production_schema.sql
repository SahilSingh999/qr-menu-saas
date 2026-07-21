-- Full Production Schema Migration for Supabase SQL Editor
-- Run this in your Supabase Dashboard -> SQL Editor to ensure all columns exist on remote DB

ALTER TABLE cafes ADD COLUMN IF NOT EXISTS admin_username TEXT UNIQUE;
ALTER TABLE cafes ADD COLUMN IF NOT EXISTS footer_message TEXT;
ALTER TABLE cafes ADD COLUMN IF NOT EXISTS font_family TEXT DEFAULT 'Outfit';
ALTER TABLE cafes ADD COLUMN IF NOT EXISTS logo_placement TEXT DEFAULT 'left_header';
ALTER TABLE cafes ADD COLUMN IF NOT EXISTS table_merges JSONB DEFAULT '[]'::jsonb;
ALTER TABLE cafes ADD COLUMN IF NOT EXISTS qr_domain TEXT DEFAULT 'https://qr-menu-saas.vercel.app';

-- Assign default usernames for existing cafes
UPDATE cafes SET admin_username = 'sscafe' WHERE (name LIKE '%SS CAFE%' OR name LIKE '%ss cafe%') AND (admin_username IS NULL OR admin_username = '');
UPDATE cafes SET admin_username = 'trackside' WHERE name LIKE '%TrackSide%' AND (admin_username IS NULL OR admin_username = '');
UPDATE cafes SET qr_domain = 'https://qr-menu-saas.vercel.app' WHERE qr_domain IS NULL OR qr_domain = '';

-- Migration to sync missing columns to cafes and menu_items tables

-- cafes table additions
ALTER TABLE cafes ADD COLUMN IF NOT EXISTS admin_username TEXT UNIQUE;
ALTER TABLE cafes ADD COLUMN IF NOT EXISTS footer_message TEXT;
ALTER TABLE cafes ADD COLUMN IF NOT EXISTS font_family TEXT;
ALTER TABLE cafes ADD COLUMN IF NOT EXISTS logo_placement TEXT;
ALTER TABLE cafes ADD COLUMN IF NOT EXISTS table_merges JSONB DEFAULT '[]'::jsonb;

-- Seed default username for existing cafes to preserve functionality
UPDATE cafes SET admin_username = 'trackside' WHERE name = 'TrackSide Cafe' AND admin_username IS NULL;

-- menu_items table additions
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS stock INTEGER;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS stock_unit TEXT DEFAULT 'pcs';
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS recipe JSONB DEFAULT '[]'::jsonb;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS availability_status TEXT DEFAULT 'available';

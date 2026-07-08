-- Add admin_username custom field to the cafes table
ALTER TABLE cafes ADD COLUMN IF NOT EXISTS admin_username TEXT UNIQUE;
ALTER TABLE cafes ADD COLUMN IF NOT EXISTS footer_message TEXT;

-- Seed default username for existing cafes to preserve functionality
UPDATE cafes SET admin_username = 'trackside' WHERE name = 'TrackSide Cafe' AND admin_username IS NULL;

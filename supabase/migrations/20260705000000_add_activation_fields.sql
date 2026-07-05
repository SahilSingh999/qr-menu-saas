-- Add activation-related columns to the cafes table
ALTER TABLE cafes ADD COLUMN IF NOT EXISTS activation_key TEXT UNIQUE;
ALTER TABLE cafes ADD COLUMN IF NOT EXISTS is_activated BOOLEAN DEFAULT FALSE;
ALTER TABLE cafes ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT (now() + interval '1 year');

-- Ensure all existing cafes are active by default to preserve functionality
UPDATE cafes SET is_activated = TRUE WHERE is_activated IS NULL;

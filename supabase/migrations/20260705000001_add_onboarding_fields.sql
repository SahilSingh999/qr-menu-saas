-- Add onboarding custom fields to the cafes table
ALTER TABLE cafes ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE cafes ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE cafes ADD COLUMN IF NOT EXISTS description TEXT;

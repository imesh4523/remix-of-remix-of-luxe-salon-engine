-- Temporarily drop the FK constraint for testing, if it exists
ALTER TABLE salons DROP CONSTRAINT IF EXISTS salons_owner_id_fkey;
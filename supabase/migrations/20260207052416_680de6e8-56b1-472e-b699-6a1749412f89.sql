
-- Temporarily disable FK constraint for testing
ALTER TABLE salons DROP CONSTRAINT IF EXISTS salons_owner_id_fkey;

-- We'll re-add it after testing

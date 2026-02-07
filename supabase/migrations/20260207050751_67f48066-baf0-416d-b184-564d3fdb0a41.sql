-- Drop FK constraints for testing
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_customer_id_fkey;
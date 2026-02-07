-- Restore FK constraints
ALTER TABLE salons ADD CONSTRAINT salons_owner_id_fkey 
  FOREIGN KEY (owner_id) REFERENCES auth.users(id);

ALTER TABLE bookings ADD CONSTRAINT bookings_customer_id_fkey 
  FOREIGN KEY (customer_id) REFERENCES auth.users(id);
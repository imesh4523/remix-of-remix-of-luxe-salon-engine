-- Add platform_payable to salons table to track what each salon owes platform
ALTER TABLE salons ADD COLUMN IF NOT EXISTS platform_payable NUMERIC DEFAULT 0;

-- Add commission tracking fields to bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS commission_settled BOOLEAN DEFAULT false;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS settled_at TIMESTAMPTZ;

-- Create commission settlements table for audit trail
CREATE TABLE IF NOT EXISTS commission_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES salons(id) NOT NULL,
  booking_id UUID REFERENCES bookings(id),
  amount NUMERIC NOT NULL,
  type TEXT CHECK (type IN ('commission_due', 'commission_paid', 'adjustment', 'manual_settlement')) NOT NULL,
  payment_method TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on commission_settlements
ALTER TABLE commission_settlements ENABLE ROW LEVEL SECURITY;

-- RLS policies for commission_settlements
CREATE POLICY "Admins can manage settlements"
  ON commission_settlements FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Vendors can view own salon settlements"
  ON commission_settlements FOR SELECT
  USING (owns_salon(auth.uid(), salon_id) OR has_role(auth.uid(), 'admin'::app_role));

-- Insert default platform commission rate setting if not exists
INSERT INTO system_settings (key, value, category, description, is_secret)
VALUES ('platform_commission_rate', '7', 'platform', 'Default Platform Commission Rate (%)', false)
ON CONFLICT (key) DO NOTHING;

-- Create function to process booking completion
CREATE OR REPLACE FUNCTION process_booking_completion()
RETURNS TRIGGER AS $$
DECLARE
  salon_record RECORD;
  owner_wallet_id UUID;
  current_balance NUMERIC;
BEGIN
  -- Only process when status changes TO 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    
    -- Get salon info
    SELECT * INTO salon_record FROM salons WHERE id = NEW.salon_id;
    
    IF NEW.payment_method = 'cash' THEN
      -- CASH: Salon collected money, they owe platform the commission
      UPDATE salons 
      SET platform_payable = COALESCE(platform_payable, 0) + NEW.platform_commission
      WHERE id = NEW.salon_id;
      
      -- Record the commission due
      INSERT INTO commission_settlements (salon_id, booking_id, amount, type, payment_method)
      VALUES (NEW.salon_id, NEW.id, NEW.platform_commission, 'commission_due', 'cash_at_salon');
      
      -- Mark as NOT settled (they still owe us)
      NEW.commission_settled := false;
      
    ELSE
      -- ONLINE/CRYPTO: Platform has the money, credit salon their share
      -- Get or create salon owner's wallet
      SELECT id, balance INTO owner_wallet_id, current_balance 
      FROM wallets WHERE user_id = salon_record.owner_id;
      
      IF owner_wallet_id IS NULL THEN
        INSERT INTO wallets (user_id, balance, currency)
        VALUES (salon_record.owner_id, NEW.vendor_payout, 'LKR')
        RETURNING id, balance INTO owner_wallet_id, current_balance;
        
        -- Record the transaction for new wallet
        INSERT INTO wallet_transactions (wallet_id, type, amount, balance_before, balance_after, description, reference_id)
        VALUES (owner_wallet_id, 'credit', NEW.vendor_payout, 0, NEW.vendor_payout, 'Booking payment (commission deducted)', NEW.id);
      ELSE
        -- Update existing wallet
        UPDATE wallets 
        SET balance = balance + NEW.vendor_payout,
            updated_at = NOW()
        WHERE id = owner_wallet_id;
        
        -- Record the transaction
        INSERT INTO wallet_transactions (wallet_id, type, amount, balance_before, balance_after, description, reference_id)
        VALUES (owner_wallet_id, 'credit', NEW.vendor_payout, current_balance, current_balance + NEW.vendor_payout, 'Booking payment (commission deducted)', NEW.id);
      END IF;
      
      -- Record settlement as paid
      INSERT INTO commission_settlements (salon_id, booking_id, amount, type, payment_method)
      VALUES (NEW.salon_id, NEW.id, NEW.platform_commission, 'commission_paid', 'online_payment');
      
      -- Mark as settled
      NEW.commission_settled := true;
      NEW.settled_at := NOW();
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for booking completion
DROP TRIGGER IF EXISTS on_booking_completed ON bookings;
CREATE TRIGGER on_booking_completed
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION process_booking_completion();

-- Create index for faster settlement queries
CREATE INDEX IF NOT EXISTS idx_commission_settlements_salon ON commission_settlements(salon_id);
CREATE INDEX IF NOT EXISTS idx_commission_settlements_type ON commission_settlements(type);
CREATE INDEX IF NOT EXISTS idx_bookings_commission_settled ON bookings(commission_settled);
CREATE INDEX IF NOT EXISTS idx_salons_platform_payable ON salons(platform_payable) WHERE platform_payable > 0;
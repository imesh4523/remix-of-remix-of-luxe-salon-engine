-- Update booking completion trigger with auto-freeze logic
CREATE OR REPLACE FUNCTION public.process_booking_completion()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  salon_record RECORD;
  owner_wallet_id UUID;
  current_balance NUMERIC;
  auto_freeze_setting TEXT;
  should_freeze BOOLEAN := FALSE;
  freeze_reason TEXT;
BEGIN
  -- Only process when status changes TO 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    
    -- Get salon info
    SELECT * INTO salon_record FROM salons WHERE id = NEW.salon_id;
    
    IF NEW.payment_method = 'cash' THEN
      -- CASH: Salon collected money, they owe platform the commission
      -- Update platform_payable and order counter
      UPDATE salons 
      SET platform_payable = COALESCE(platform_payable, 0) + NEW.platform_commission,
          orders_since_settlement = COALESCE(orders_since_settlement, 0) + 1
      WHERE id = NEW.salon_id;
      
      -- Re-fetch updated values
      SELECT * INTO salon_record FROM salons WHERE id = NEW.salon_id;
      
      -- Check auto-freeze setting
      SELECT value INTO auto_freeze_setting 
      FROM system_settings WHERE key = 'auto_freeze_enabled';
      
      IF auto_freeze_setting = 'true' THEN
        -- Check credit limit
        IF salon_record.platform_payable > COALESCE(salon_record.credit_limit, 10000) THEN
          should_freeze := TRUE;
          freeze_reason := 'credit_limit_exceeded';
        END IF;
        
        -- Check order limit (if set)
        IF salon_record.credit_limit_orders IS NOT NULL 
           AND salon_record.credit_limit_orders > 0
           AND salon_record.orders_since_settlement >= salon_record.credit_limit_orders THEN
          should_freeze := TRUE;
          freeze_reason := 'order_limit_exceeded';
        END IF;
        
        -- Apply freeze if needed (only if currently approved)
        IF should_freeze AND salon_record.status = 'approved' THEN
          UPDATE salons 
          SET status = 'suspended',
              auto_frozen_at = NOW(),
              auto_freeze_reason = freeze_reason
          WHERE id = NEW.salon_id;
          
          -- Log the auto-freeze
          INSERT INTO activity_logs (entity_type, entity_id, action, details)
          VALUES ('salon', NEW.salon_id::text, 'auto_freeze', jsonb_build_object(
            'reason', freeze_reason,
            'platform_payable', salon_record.platform_payable,
            'credit_limit', salon_record.credit_limit,
            'orders_since_settlement', salon_record.orders_since_settlement
          ));
        END IF;
      END IF;
      
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
$function$;
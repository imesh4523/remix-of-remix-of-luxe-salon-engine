-- Create the trigger for booking completion processing
DROP TRIGGER IF EXISTS on_booking_completed ON bookings;

CREATE TRIGGER on_booking_completed
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION process_booking_completion();
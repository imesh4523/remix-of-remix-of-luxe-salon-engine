import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface BookedSlot {
  start_time: string;
  end_time: string;
  status: string;
}

/**
 * Fetches booked time slots for a specific staff member on a specific date.
 * Used to prevent double booking by showing unavailable times.
 */
export const useBookedSlots = (
  staffId: string | undefined,
  salonId: string | undefined,
  date: Date | undefined
) => {
  const dateStr = date?.toISOString().split('T')[0];

  return useQuery({
    queryKey: ['booked_slots', staffId, salonId, dateStr],
    queryFn: async () => {
      if (!staffId || !salonId || !dateStr) return [];

      const { data, error } = await supabase
        .from('bookings')
        .select('start_time, end_time, status')
        .eq('staff_id', staffId)
        .eq('salon_id', salonId)
        .eq('booking_date', dateStr)
        .in('status', ['pending', 'confirmed', 'in_progress']); // Only active bookings

      if (error) throw error;
      return data as BookedSlot[];
    },
    enabled: !!staffId && !!salonId && !!dateStr,
    staleTime: 1000 * 30, // Refetch every 30 seconds for real-time updates
  });
};

/**
 * Check if a specific time slot is available.
 * Considers the service duration to ensure the entire slot is free.
 */
export const isSlotAvailable = (
  slotTime: string,
  bookedSlots: BookedSlot[],
  serviceDurationMinutes: number = 30
): boolean => {
  if (!bookedSlots || bookedSlots.length === 0) return true;

  const [slotHour, slotMinute] = slotTime.split(':').map(Number);
  const slotStart = slotHour * 60 + slotMinute;
  const slotEnd = slotStart + serviceDurationMinutes;

  for (const booking of bookedSlots) {
    const [bookingStartHour, bookingStartMinute] = booking.start_time.split(':').map(Number);
    const [bookingEndHour, bookingEndMinute] = booking.end_time.split(':').map(Number);
    
    const bookingStart = bookingStartHour * 60 + bookingStartMinute;
    const bookingEnd = bookingEndHour * 60 + bookingEndMinute;

    // Check for overlap: 
    // New slot overlaps if it starts before existing ends AND ends after existing starts
    if (slotStart < bookingEnd && slotEnd > bookingStart) {
      return false;
    }
  }

  return true;
};

/**
 * Get all available time slots for a given day, considering existing bookings.
 */
export const getAvailableTimeSlots = (
  allSlots: string[],
  bookedSlots: BookedSlot[],
  serviceDurationMinutes: number = 30
): { time: string; available: boolean }[] => {
  return allSlots.map(time => ({
    time,
    available: isSlotAvailable(time, bookedSlots, serviceDurationMinutes),
  }));
};

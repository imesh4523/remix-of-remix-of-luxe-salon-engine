export type AppRole = 'customer' | 'vendor' | 'admin';
export type SalonStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
export type PaymentMethod = 'cash' | 'online' | 'crypto';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

export interface Province {
  id: string;
  name_en: string;
  name_si: string;
  code: string;
  created_at: string;
}

export interface District {
  id: string;
  province_id: string;
  name_en: string;
  name_si: string;
  code: string;
  created_at: string;
}

export interface Town {
  id: string;
  district_id: string;
  name_en: string;
  name_si: string;
  postal_code: string | null;
  created_at: string;
}

export interface Salon {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  cover_image: string | null;
  logo: string | null;
  status: SalonStatus;
  rating: number;
  review_count: number;
  commission_rate: number;
  created_at: string;
  updated_at: string;
  distance?: number;
  // Location hierarchy
  province_id?: string | null;
  district_id?: string | null;
  town_id?: string | null;
  // Joined location data
  province?: Province | null;
  district?: District | null;
  town?: Town | null;
}

export interface SalonImage {
  id: string;
  salon_id: string;
  image_url: string;
  display_order: number;
  created_at: string;
}

export interface Staff {
  id: string;
  salon_id: string;
  user_id: string | null;
  name: string;
  title: string | null;
  bio: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  icon: string | null;
  created_at: string;
}

export interface Service {
  id: string;
  salon_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category?: ServiceCategory;
}

export interface StaffService {
  id: string;
  staff_id: string;
  service_id: string;
}

export interface StaffAvailability {
  id: string;
  staff_id: string;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export interface Booking {
  id: string;
  customer_id: string;
  salon_id: string;
  staff_id: string;
  service_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  total_amount: number;
  platform_commission: number;
  vendor_payout: number;
  notes: string | null;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  salon?: Salon;
  staff?: Staff;
  service?: Service;
  customer?: Profile;
}

export interface Review {
  id: string;
  booking_id: string;
  customer_id: string;
  salon_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  customer?: Profile;
}

export interface BookingStep {
  step: 'service' | 'staff' | 'date' | 'time' | 'payment' | 'confirm';
  label: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

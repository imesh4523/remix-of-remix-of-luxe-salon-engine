export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          booking_date: string
          commission_settled: boolean | null
          created_at: string
          customer_id: string
          end_time: string
          id: string
          notes: string | null
          paid_at: string | null
          payment_method: string
          payment_status: string
          platform_commission: number
          salon_id: string
          service_id: string
          settled_at: string | null
          staff_id: string
          start_time: string
          status: Database["public"]["Enums"]["booking_status"]
          total_amount: number
          updated_at: string
          vendor_payout: number
        }
        Insert: {
          booking_date: string
          commission_settled?: boolean | null
          created_at?: string
          customer_id: string
          end_time: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: string
          payment_status?: string
          platform_commission: number
          salon_id: string
          service_id: string
          settled_at?: string | null
          staff_id: string
          start_time: string
          status?: Database["public"]["Enums"]["booking_status"]
          total_amount: number
          updated_at?: string
          vendor_payout: number
        }
        Update: {
          booking_date?: string
          commission_settled?: boolean | null
          created_at?: string
          customer_id?: string
          end_time?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: string
          payment_status?: string
          platform_commission?: number
          salon_id?: string
          service_id?: string
          settled_at?: string | null
          staff_id?: string
          start_time?: string
          status?: Database["public"]["Enums"]["booking_status"]
          total_amount?: number
          updated_at?: string
          vendor_payout?: number
        }
        Relationships: [
          {
            foreignKeyName: "bookings_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_settlements: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string | null
          created_by: string | null
          id: string
          notes: string | null
          payment_method: string | null
          salon_id: string
          type: string
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          salon_id: string
          type: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          salon_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_settlements_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_settlements_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_settlements_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      crypto_payments: {
        Row: {
          actually_paid: number | null
          booking_id: string | null
          created_at: string
          expires_at: string | null
          id: string
          invoice_id: string
          ipn_callback_url: string | null
          order_id: string
          outcome_amount: number | null
          outcome_currency: string | null
          paid_at: string | null
          pay_address: string | null
          pay_amount: number | null
          pay_currency: string
          payment_id: string | null
          price_amount: number
          price_currency: string
          status: Database["public"]["Enums"]["crypto_payment_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          actually_paid?: number | null
          booking_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          invoice_id: string
          ipn_callback_url?: string | null
          order_id: string
          outcome_amount?: number | null
          outcome_currency?: string | null
          paid_at?: string | null
          pay_address?: string | null
          pay_amount?: number | null
          pay_currency: string
          payment_id?: string | null
          price_amount: number
          price_currency?: string
          status?: Database["public"]["Enums"]["crypto_payment_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          actually_paid?: number | null
          booking_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          invoice_id?: string
          ipn_callback_url?: string | null
          order_id?: string
          outcome_amount?: number | null
          outcome_currency?: string | null
          paid_at?: string | null
          pay_address?: string | null
          pay_amount?: number | null
          pay_currency?: string
          payment_id?: string | null
          price_amount?: number
          price_currency?: string
          status?: Database["public"]["Enums"]["crypto_payment_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crypto_payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      districts: {
        Row: {
          code: string
          created_at: string
          id: string
          name_en: string
          name_si: string
          province_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name_en: string
          name_si: string
          province_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name_en?: string
          name_si?: string
          province_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "districts_province_id_fkey"
            columns: ["province_id"]
            isOneToOne: false
            referencedRelation: "provinces"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          metadata: Json | null
          recipient_email: string
          resend_id: string | null
          sent_at: string | null
          status: string
          subject: string
          template_type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          recipient_email: string
          resend_id?: string | null
          sent_at?: string | null
          status?: string
          subject: string
          template_type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          recipient_email?: string
          resend_id?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          template_type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string
          email_booking_cancelled: boolean
          email_booking_complete: boolean
          email_booking_confirm: boolean
          email_booking_reminder: boolean
          email_payment_received: boolean
          email_promotions: boolean
          id: string
          push_booking_updates: boolean
          push_enabled: boolean
          push_payment_updates: boolean
          push_reminders: boolean
          sms_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_booking_cancelled?: boolean
          email_booking_complete?: boolean
          email_booking_confirm?: boolean
          email_booking_reminder?: boolean
          email_payment_received?: boolean
          email_promotions?: boolean
          id?: string
          push_booking_updates?: boolean
          push_enabled?: boolean
          push_payment_updates?: boolean
          push_reminders?: boolean
          sms_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_booking_cancelled?: boolean
          email_booking_complete?: boolean
          email_booking_confirm?: boolean
          email_booking_reminder?: boolean
          email_payment_received?: boolean
          email_promotions?: boolean
          id?: string
          push_booking_updates?: boolean
          push_enabled?: boolean
          push_payment_updates?: boolean
          push_reminders?: boolean
          sms_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      password_reset_codes: {
        Row: {
          code: string
          created_at: string | null
          email: string
          expires_at: string
          id: string
          used: boolean | null
        }
        Insert: {
          code: string
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          used?: boolean | null
        }
        Update: {
          code?: string
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          used?: boolean | null
        }
        Relationships: []
      }
      payout_requests: {
        Row: {
          amount: number
          bank_details: Json | null
          created_at: string
          id: string
          notes: string | null
          processed_at: string | null
          processed_by: string | null
          salon_id: string
          status: string
          wallet_id: string
        }
        Insert: {
          amount: number
          bank_details?: Json | null
          created_at?: string
          id?: string
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          salon_id: string
          status?: string
          wallet_id: string
        }
        Update: {
          amount?: number
          bank_details?: Json | null
          created_at?: string
          id?: string
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          salon_id?: string
          status?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payout_requests_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_requests_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_requests_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          is_suspended: boolean | null
          last_login_at: string | null
          last_login_ip: string | null
          phone: string | null
          registration_ip: string | null
          suspended_at: string | null
          suspended_reason: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_suspended?: boolean | null
          last_login_at?: string | null
          last_login_ip?: string | null
          phone?: string | null
          registration_ip?: string | null
          suspended_at?: string | null
          suspended_reason?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_suspended?: boolean | null
          last_login_at?: string | null
          last_login_ip?: string | null
          phone?: string | null
          registration_ip?: string | null
          suspended_at?: string | null
          suspended_reason?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      provinces: {
        Row: {
          code: string
          created_at: string
          id: string
          name_en: string
          name_si: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name_en: string
          name_si: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name_en?: string
          name_si?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth_key: string
          created_at: string
          device_info: Json | null
          endpoint: string
          id: string
          is_active: boolean
          last_used_at: string | null
          p256dh_key: string
          user_id: string
        }
        Insert: {
          auth_key: string
          created_at?: string
          device_info?: Json | null
          endpoint: string
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          p256dh_key: string
          user_id: string
        }
        Update: {
          auth_key?: string
          created_at?: string
          device_info?: Json | null
          endpoint?: string
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          p256dh_key?: string
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          admin_response: string | null
          booking_id: string
          comment: string | null
          created_at: string
          customer_id: string
          hidden_by: string | null
          hidden_reason: string | null
          id: string
          is_hidden: boolean | null
          rating: number
          salon_id: string
        }
        Insert: {
          admin_response?: string | null
          booking_id: string
          comment?: string | null
          created_at?: string
          customer_id: string
          hidden_by?: string | null
          hidden_reason?: string | null
          id?: string
          is_hidden?: boolean | null
          rating: number
          salon_id: string
        }
        Update: {
          admin_response?: string | null
          booking_id?: string
          comment?: string | null
          created_at?: string
          customer_id?: string
          hidden_by?: string | null
          hidden_reason?: string | null
          id?: string
          is_hidden?: boolean | null
          rating?: number
          salon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      salon_images: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          image_url: string
          salon_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          image_url: string
          salon_id: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          image_url?: string
          salon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "salon_images_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salon_images_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      salons: {
        Row: {
          address: string
          auto_freeze_reason: string | null
          auto_frozen_at: string | null
          city: string
          commission_rate: number | null
          cover_image: string | null
          created_at: string
          credit_limit: number | null
          credit_limit_orders: number | null
          description: string | null
          district_id: string | null
          email: string | null
          id: string
          latitude: number | null
          logo: string | null
          longitude: number | null
          name: string
          orders_since_settlement: number | null
          owner_id: string
          phone: string | null
          platform_payable: number | null
          province_id: string | null
          rating: number | null
          review_count: number | null
          slug: string
          status: Database["public"]["Enums"]["salon_status"]
          town_id: string | null
          trust_level: string | null
          updated_at: string
        }
        Insert: {
          address: string
          auto_freeze_reason?: string | null
          auto_frozen_at?: string | null
          city: string
          commission_rate?: number | null
          cover_image?: string | null
          created_at?: string
          credit_limit?: number | null
          credit_limit_orders?: number | null
          description?: string | null
          district_id?: string | null
          email?: string | null
          id?: string
          latitude?: number | null
          logo?: string | null
          longitude?: number | null
          name: string
          orders_since_settlement?: number | null
          owner_id: string
          phone?: string | null
          platform_payable?: number | null
          province_id?: string | null
          rating?: number | null
          review_count?: number | null
          slug: string
          status?: Database["public"]["Enums"]["salon_status"]
          town_id?: string | null
          trust_level?: string | null
          updated_at?: string
        }
        Update: {
          address?: string
          auto_freeze_reason?: string | null
          auto_frozen_at?: string | null
          city?: string
          commission_rate?: number | null
          cover_image?: string | null
          created_at?: string
          credit_limit?: number | null
          credit_limit_orders?: number | null
          description?: string | null
          district_id?: string | null
          email?: string | null
          id?: string
          latitude?: number | null
          logo?: string | null
          longitude?: number | null
          name?: string
          orders_since_settlement?: number | null
          owner_id?: string
          phone?: string | null
          platform_payable?: number | null
          province_id?: string | null
          rating?: number | null
          review_count?: number | null
          slug?: string
          status?: Database["public"]["Enums"]["salon_status"]
          town_id?: string | null
          trust_level?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "salons_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salons_province_id_fkey"
            columns: ["province_id"]
            isOneToOne: false
            referencedRelation: "provinces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salons_town_id_fkey"
            columns: ["town_id"]
            isOneToOne: false
            referencedRelation: "towns"
            referencedColumns: ["id"]
          },
        ]
      }
      service_categories: {
        Row: {
          created_at: string
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          is_active: boolean | null
          name: string
          price: number
          salon_id: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean | null
          name: string
          price: number
          salon_id: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          salon_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          salon_id: string
          title: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          salon_id: string
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          salon_id?: string
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_availability: {
        Row: {
          day_of_week: Database["public"]["Enums"]["day_of_week"]
          end_time: string
          id: string
          is_available: boolean | null
          staff_id: string
          start_time: string
        }
        Insert: {
          day_of_week: Database["public"]["Enums"]["day_of_week"]
          end_time: string
          id?: string
          is_available?: boolean | null
          staff_id: string
          start_time: string
        }
        Update: {
          day_of_week?: Database["public"]["Enums"]["day_of_week"]
          end_time?: string
          id?: string
          is_available?: boolean | null
          staff_id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_availability_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_services: {
        Row: {
          id: string
          service_id: string
          staff_id: string
        }
        Insert: {
          id?: string
          service_id: string
          staff_id: string
        }
        Update: {
          id?: string
          service_id?: string
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_services_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_shifts: {
        Row: {
          created_at: string
          date: string
          end_time: string
          id: string
          notes: string | null
          staff_id: string
          start_time: string
          status: string
        }
        Insert: {
          created_at?: string
          date: string
          end_time: string
          id?: string
          notes?: string | null
          staff_id: string
          start_time: string
          status?: string
        }
        Update: {
          created_at?: string
          date?: string
          end_time?: string
          id?: string
          notes?: string | null
          staff_id?: string
          start_time?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_shifts_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_admin_id: string | null
          created_at: string
          description: string
          id: string
          priority: Database["public"]["Enums"]["ticket_priority"]
          related_booking_id: string | null
          related_salon_id: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_admin_id?: string | null
          created_at?: string
          description: string
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          related_booking_id?: string | null
          related_salon_id?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_admin_id?: string | null
          created_at?: string
          description?: string
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          related_booking_id?: string | null
          related_salon_id?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_related_booking_id_fkey"
            columns: ["related_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_related_salon_id_fkey"
            columns: ["related_salon_id"]
            isOneToOne: false
            referencedRelation: "public_salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_related_salon_id_fkey"
            columns: ["related_salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          is_secret: boolean | null
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_secret?: boolean | null
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_secret?: boolean | null
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      ticket_messages: {
        Row: {
          created_at: string
          id: string
          is_admin: boolean
          message: string
          sender_id: string
          ticket_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_admin?: boolean
          message: string
          sender_id: string
          ticket_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_admin?: boolean
          message?: string
          sender_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      towns: {
        Row: {
          created_at: string
          district_id: string
          id: string
          name_en: string
          name_si: string
          postal_code: string | null
        }
        Insert: {
          created_at?: string
          district_id: string
          id?: string
          name_en: string
          name_si: string
          postal_code?: string | null
        }
        Update: {
          created_at?: string
          district_id?: string
          id?: string
          name_en?: string
          name_si?: string
          postal_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "towns_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          balance_before: number
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          reference_id: string | null
          type: Database["public"]["Enums"]["wallet_transaction_type"]
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          balance_before: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          type: Database["public"]["Enums"]["wallet_transaction_type"]
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          balance_before?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          type?: Database["public"]["Enums"]["wallet_transaction_type"]
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number
          created_at: string
          currency: string
          id: string
          is_frozen: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          is_frozen?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          is_frozen?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_profiles: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          id: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      public_salons: {
        Row: {
          address: string | null
          city: string | null
          cover_image: string | null
          created_at: string | null
          description: string | null
          district_id: string | null
          email: string | null
          id: string | null
          latitude: number | null
          logo: string | null
          longitude: number | null
          name: string | null
          owner_id: string | null
          phone: string | null
          province_id: string | null
          rating: number | null
          review_count: number | null
          slug: string | null
          status: Database["public"]["Enums"]["salon_status"] | null
          town_id: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          district_id?: string | null
          email?: string | null
          id?: string | null
          latitude?: number | null
          logo?: string | null
          longitude?: number | null
          name?: string | null
          owner_id?: string | null
          phone?: string | null
          province_id?: string | null
          rating?: number | null
          review_count?: number | null
          slug?: string | null
          status?: Database["public"]["Enums"]["salon_status"] | null
          town_id?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          district_id?: string | null
          email?: string | null
          id?: string | null
          latitude?: number | null
          logo?: string | null
          longitude?: number | null
          name?: string | null
          owner_id?: string | null
          phone?: string | null
          province_id?: string | null
          rating?: number | null
          review_count?: number | null
          slug?: string | null
          status?: Database["public"]["Enums"]["salon_status"] | null
          town_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "salons_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salons_province_id_fkey"
            columns: ["province_id"]
            isOneToOne: false
            referencedRelation: "provinces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salons_town_id_fkey"
            columns: ["town_id"]
            isOneToOne: false
            referencedRelation: "towns"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      owns_salon: {
        Args: { _salon_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "customer" | "vendor" | "admin"
      booking_status:
        | "pending"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled"
      crypto_payment_status:
        | "waiting"
        | "confirming"
        | "confirmed"
        | "sending"
        | "partially_paid"
        | "finished"
        | "failed"
        | "refunded"
        | "expired"
      day_of_week:
        | "monday"
        | "tuesday"
        | "wednesday"
        | "thursday"
        | "friday"
        | "saturday"
        | "sunday"
      salon_status: "pending" | "approved" | "rejected" | "suspended"
      ticket_priority: "low" | "medium" | "high" | "urgent"
      ticket_status: "open" | "in_progress" | "resolved" | "closed"
      wallet_transaction_type:
        | "credit"
        | "debit"
        | "refund"
        | "commission"
        | "payout"
        | "adjustment"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["customer", "vendor", "admin"],
      booking_status: [
        "pending",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
      ],
      crypto_payment_status: [
        "waiting",
        "confirming",
        "confirmed",
        "sending",
        "partially_paid",
        "finished",
        "failed",
        "refunded",
        "expired",
      ],
      day_of_week: [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ],
      salon_status: ["pending", "approved", "rejected", "suspended"],
      ticket_priority: ["low", "medium", "high", "urgent"],
      ticket_status: ["open", "in_progress", "resolved", "closed"],
      wallet_transaction_type: [
        "credit",
        "debit",
        "refund",
        "commission",
        "payout",
        "adjustment",
      ],
    },
  },
} as const

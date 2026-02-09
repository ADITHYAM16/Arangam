import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface BookingRecord {
  id?: string
  event_name: string
  event_type: string
  department: string
  year: string
  coordinator_name: string
  coordinator_email: string
  contact_number: string
  remarks?: string
  booking_date: string
  slot_type: string
  arangam_name?: string
  status: 'pending' | 'booked' | 'rejected' | 'cancelled'
  created_at?: string
  updated_at?: string
}

export interface MGAuditoriumBookingRecord {
  id?: string
  event_name: string
  event_type: string
  department: string
  year: string
  coordinator_name: string
  coordinator_email: string
  contact_number: string
  remarks?: string
  booking_date: string
  slot_type: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  created_at?: string
  updated_at?: string
}
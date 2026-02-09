import { supabase } from '../lib/supabase'

interface BookingRecord {
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
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  created_at?: string
  updated_at?: string
}

export class BookingService {
  // Get all bookings from both tables
  static async getAllBookings(): Promise<{ success: boolean; data?: BookingRecord[]; error?: string }> {
    try {
      // Fetch regular bookings
      const { data: regularBookings, error: regularError } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false })

      // Fetch MG Auditorium bookings
      const { data: mgBookings, error: mgError } = await supabase
        .from('mg_auditorium_bookings')
        .select('*')
        .order('created_at', { ascending: false })

      if (regularError && mgError) {
        return { success: false, error: 'Failed to fetch bookings' }
      }

      // Combine bookings
      const allBookings = [
        ...(regularBookings || []),
        ...(mgBookings || []).map(booking => ({ ...booking, arangam_name: 'MG Auditorium' }))
      ]

      return { success: true, data: allBookings }
    } catch (error) {
      console.error('Error fetching bookings:', error)
      return { success: false, error: 'Failed to fetch bookings' }
    }
  }

  // Update booking status
  static async updateBookingStatus(id: string, status: 'pending' | 'approved' | 'rejected' | 'cancelled'): Promise<{ success: boolean; error?: string }> {
    try {
      // Convert 'approved' to 'booked' for database storage
      const dbStatus = status === 'approved' ? 'booked' : status
      
      // Try updating in regular bookings table first
      const { error: regularError } = await supabase
        .from('bookings')
        .update({ status: dbStatus, updated_at: new Date().toISOString() })
        .eq('id', id)

      // If not found in regular bookings, try MG auditorium bookings
      if (regularError) {
        const { error: mgError } = await supabase
          .from('mg_auditorium_bookings')
          .update({ status: dbStatus, updated_at: new Date().toISOString() })
          .eq('id', id)

        if (mgError) {
          return { success: false, error: mgError.message }
        }
      }

      return { success: true }
    } catch (error) {
      console.error('Update booking status error:', error)
      return { success: false, error: 'Failed to update booking status' }
    }
  }

  // Get bookings by date range
  static async getBookingsByDateRange(startDate: string, endDate: string): Promise<{ success: boolean; data?: BookingRecord[]; error?: string }> {
    try {
      const allBookings = await this.getAllBookings()
      if (!allBookings.success || !allBookings.data) {
        return allBookings
      }

      const filteredBookings = allBookings.data.filter(booking => {
        const bookingDate = new Date(booking.booking_date)
        const start = new Date(startDate)
        const end = new Date(endDate)
        return bookingDate >= start && bookingDate <= end
      })

      return { success: true, data: filteredBookings }
    } catch (error) {
      console.error('Error fetching bookings by date range:', error)
      return { success: false, error: 'Failed to fetch bookings' }
    }
  }

  // Delete booking
  static async deleteBooking(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Try deleting from regular bookings table first
      const { error: regularError } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id)

      // If not found in regular bookings, try MG auditorium bookings
      if (regularError) {
        const { error: mgError } = await supabase
          .from('mg_auditorium_bookings')
          .delete()
          .eq('id', id)

        if (mgError) {
          return { success: false, error: mgError.message }
        }
      }

      return { success: true }
    } catch (error) {
      console.error('Delete booking error:', error)
      return { success: false, error: 'Failed to delete booking' }
    }
  }

  // Subscribe to real-time changes
  static subscribeToBookings(callback: (payload: any) => void) {
    const regularBookingsSubscription = supabase
      .channel('bookings-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'bookings' },
        callback
      )
      .subscribe()

    const mgBookingsSubscription = supabase
      .channel('mg-bookings-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'mg_auditorium_bookings' },
        callback
      )
      .subscribe()

    return () => {
      regularBookingsSubscription.unsubscribe()
      mgBookingsSubscription.unsubscribe()
    }
  }
}
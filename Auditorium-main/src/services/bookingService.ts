import { supabase, BookingRecord, MGAuditoriumBookingRecord } from '@/lib/supabase'
import { BookingData } from '@/components/BookingForm'

export class BookingService {
  // Create a new booking
  static async createBooking(bookingData: BookingData): Promise<{ success: boolean; data?: BookingRecord; error?: string }> {
    try {
      const bookingRecord = {
        event_name: bookingData.eventName,
        event_type: bookingData.eventType,
        department: bookingData.department,
        year: bookingData.year,
        coordinator_name: bookingData.coordinatorName,
        coordinator_email: bookingData.coordinatorEmail,
        contact_number: bookingData.contactNumber,
        remarks: bookingData.remarks || '',
        booking_date: bookingData.date.toLocaleDateString('en-CA'),
        slot_type: bookingData.slotType,
        arangam_name: bookingData.arangamName || null,
        status: 'booked'
      }

      const { data, error } = await supabase
        .from('bookings')
        .insert([bookingRecord])
        .select()
        .single()

      if (error) {
        console.error('Booking creation error:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Unexpected error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  // Get all bookings
  static async getAllBookings(): Promise<{ success: boolean; data?: BookingRecord[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        // If table doesn't exist, return empty array
        if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
          console.log('Database table not found, returning empty results')
          return { success: true, data: [] }
        }
        console.error('Fetch bookings error:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data: data || [] }
    } catch (error) {
      console.error('Unexpected error:', error)
      return { success: true, data: [] } // Return empty array for better UX
    }
  }

  // Get bookings by date and slot to check availability
  static async getBookingsByDateAndSlot(date: string, slot: string, arangamName?: string): Promise<{ success: boolean; data?: BookingRecord[]; error?: string }> {
    try {
      let query = supabase
        .from('bookings')
        .select('*')
        .eq('booking_date', date)
        .eq('slot_type', slot)
        .in('status', ['pending', 'booked']) // Exclude cancelled and rejected

      if (arangamName) {
        query = query.eq('arangam_name', arangamName)
      }

      const { data, error } = await query

      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
          return { success: true, data: [] }
        }
        return { success: false, error: error.message }
      }

      return { success: true, data: data || [] }
    } catch (error) {
      return { success: true, data: [] }
    }
  }

  // Check if a slot is available
  static async isSlotAvailable(date: string, slot: string, arangamName?: string): Promise<{ available: boolean; error?: string }> {
    try {
      const result = await this.getBookingsByDateAndSlot(date, slot, arangamName)

      if (!result.success) {
        // If there's an error but it's due to missing table, assume available
        if (result.error?.includes('relation') || result.error?.includes('does not exist')) {
          return { available: true }
        }
        return { available: false, error: result.error }
      }

      // Check for direct slot conflicts
      const directConflict = (result.data?.length || 0) > 0
      if (directConflict) {
        return { available: false }
      }

      // Check for full-day conflicts
      if (slot === 'full-day') {
        // If booking full-day, check if forenoon or afternoon are booked
        const forenoonResult = await this.getBookingsByDateAndSlot(date, 'forenoon', arangamName)
        const afternoonResult = await this.getBookingsByDateAndSlot(date, 'afternoon', arangamName)

        const forenoonBooked = forenoonResult.success && (forenoonResult.data?.length || 0) > 0
        const afternoonBooked = afternoonResult.success && (afternoonResult.data?.length || 0) > 0

        if (forenoonBooked || afternoonBooked) {
          return { available: false }
        }
      } else if (slot === 'forenoon' || slot === 'afternoon') {
        // If booking forenoon/afternoon, check if full-day is booked
        const fullDayResult = await this.getBookingsByDateAndSlot(date, 'full-day', arangamName)
        const fullDayBooked = fullDayResult.success && (fullDayResult.data?.length || 0) > 0

        if (fullDayBooked) {
          return { available: false }
        }
      }

      return { available: true }
    } catch (error) {
      console.error('Unexpected error in isSlotAvailable:', error)
      return { available: true }
    }
  }

  // Update booking status
  static async updateBookingStatus(id: string, status: 'pending' | 'approved' | 'rejected' | 'cancelled'): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) {
        console.error('Update booking status error:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Unexpected error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  // Cancel booking with reason (works for both regular and MG Auditorium bookings)
  static async cancelBooking(id: string, reason: string): Promise<{ success: boolean; error?: string }> {
    try {
      // First try regular bookings table
      const { data: regularBooking, error: regularFetchError } = await supabase
        .from('bookings')
        .select('remarks')
        .eq('id', id)
        .single()

      if (!regularFetchError) {
        // Found in regular bookings, proceed with cancellation
        const updatedRemarks = regularBooking.remarks
          ? `${regularBooking.remarks} | CANCELLED: ${reason}`
          : `CANCELLED: ${reason}`

        const { error } = await supabase
          .from('bookings')
          .update({
            status: 'cancelled',
            remarks: updatedRemarks,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)

        if (error) {
          console.error('Cancel booking error:', error)
          return { success: false, error: error.message }
        }

        return { success: true }
      }

      // If not found in regular bookings, try MG auditorium bookings
      const { data: mgBooking, error: mgFetchError } = await supabase
        .from('mg_auditorium_bookings')
        .select('remarks')
        .eq('id', id)
        .single()

      if (mgFetchError) {
        console.error('Fetch booking error:', mgFetchError)
        return { success: false, error: mgFetchError.message }
      }

      // Update MG auditorium booking
      const updatedRemarks = mgBooking.remarks
        ? `${mgBooking.remarks} | CANCELLED: ${reason}`
        : `CANCELLED: ${reason}`

      const { error } = await supabase
        .from('mg_auditorium_bookings')
        .update({
          status: 'cancelled',
          remarks: updatedRemarks,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) {
        console.error('Cancel MG booking error:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Unexpected error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  // Subscribe to real-time booking changes
  static subscribeToBookings(callback: () => void) {
    const channel = supabase
      .channel('main-bookings-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, callback)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mg_auditorium_bookings' }, callback)
      .subscribe()
    return () => channel.unsubscribe()
  }

  // Delete booking
  static async deleteBooking(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Delete booking error:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Unexpected error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  // Get bookings by coordinator email
  static async getBookingsByCoordinator(email: string): Promise<{ success: boolean; data?: BookingRecord[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('coordinator_email', email)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Fetch bookings by coordinator error:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data: data || [] }
    } catch (error) {
      console.error('Unexpected error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  // ==================== MG AUDITORIUM SPECIFIC METHODS ====================

  // Create a new MG Auditorium booking
  static async createMGAuditoriumBooking(bookingData: BookingData): Promise<{ success: boolean; data?: MGAuditoriumBookingRecord; error?: string }> {
    try {
      const bookingRecord = {
        event_name: bookingData.eventName,
        event_type: bookingData.eventType,
        department: bookingData.department,
        year: bookingData.year,
        coordinator_name: bookingData.coordinatorName,
        coordinator_email: bookingData.coordinatorEmail,
        contact_number: bookingData.contactNumber,
        remarks: bookingData.remarks || '',
        booking_date: bookingData.date.toLocaleDateString('en-CA'),
        slot_type: bookingData.slotType,
        status: 'booked'
      }

      const { data, error } = await supabase
        .from('mg_auditorium_bookings')
        .insert([bookingRecord])
        .select()
        .single()

      if (error) {
        console.error('MG Auditorium booking creation error:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Unexpected error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  // Get all MG Auditorium bookings
  static async getAllMGAuditoriumBookings(): Promise<{ success: boolean; data?: MGAuditoriumBookingRecord[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('mg_auditorium_bookings')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
          console.log('MG Auditorium table not found, returning empty results')
          return { success: true, data: [] }
        }
        console.error('Fetch MG Auditorium bookings error:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data: data || [] }
    } catch (error) {
      console.error('Unexpected error:', error)
      return { success: true, data: [] }
    }
  }

  // Get MG Auditorium bookings by date and slot
  static async getMGBookingsByDateAndSlot(date: string, slot: string): Promise<{ success: boolean; data?: MGAuditoriumBookingRecord[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('mg_auditorium_bookings')
        .select('*')
        .eq('booking_date', date)
        .eq('slot_type', slot)
        .in('status', ['pending', 'booked'])

      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
          return { success: true, data: [] }
        }
        return { success: false, error: error.message }
      }

      return { success: true, data: data || [] }
    } catch (error) {
      return { success: true, data: [] }
    }
  }

  // Check if MG Auditorium slot is available
  static async isMGSlotAvailable(date: string, slot: string): Promise<{ available: boolean; error?: string }> {
    try {
      const result = await this.getMGBookingsByDateAndSlot(date, slot)

      if (!result.success) {
        if (result.error?.includes('relation') || result.error?.includes('does not exist')) {
          return { available: true }
        }
        return { available: false, error: result.error }
      }

      const directConflict = (result.data?.length || 0) > 0
      if (directConflict) {
        return { available: false }
      }

      // Check for full-day conflicts
      if (slot === 'full-day') {
        const forenoonResult = await this.getMGBookingsByDateAndSlot(date, 'forenoon')
        const afternoonResult = await this.getMGBookingsByDateAndSlot(date, 'afternoon')

        const forenoonBooked = forenoonResult.success && (forenoonResult.data?.length || 0) > 0
        const afternoonBooked = afternoonResult.success && (afternoonResult.data?.length || 0) > 0

        if (forenoonBooked || afternoonBooked) {
          return { available: false }
        }
      } else if (slot === 'forenoon' || slot === 'afternoon') {
        const fullDayResult = await this.getMGBookingsByDateAndSlot(date, 'full-day')
        const fullDayBooked = fullDayResult.success && (fullDayResult.data?.length || 0) > 0

        if (fullDayBooked) {
          return { available: false }
        }
      }

      return { available: true }
    } catch (error) {
      console.error('Unexpected error:', error)
      return { available: true }
    }
  }

  // Get all bookings combined (both regular and MG Auditorium) for download feature
  static async getAllBookingsCombined(): Promise<{ success: boolean; data?: BookingRecord[]; error?: string }> {
    try {
      // Fetch regular bookings
      const regularResult = await this.getAllBookings()
      const regularBookings = regularResult.data || []

      // Fetch MG Auditorium bookings
      const mgResult = await this.getAllMGAuditoriumBookings()
      const mgBookings = mgResult.data || []

      // Convert MG bookings to BookingRecord format with arangam_name = 'MG Auditorium'
      const mgBookingsWithArangam: BookingRecord[] = mgBookings.map(booking => ({
        ...booking,
        arangam_name: 'MG Auditorium'
      }))

      // Combine both arrays
      const combinedBookings = [...regularBookings, ...mgBookingsWithArangam]

      // Sort by created_at descending
      combinedBookings.sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime()
        const dateB = new Date(b.created_at || 0).getTime()
        return dateB - dateA
      })

      return { success: true, data: combinedBookings }
    } catch (error) {
      console.error('Unexpected error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }
}
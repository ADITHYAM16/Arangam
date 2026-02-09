import { supabase } from '@/lib/supabase'

export class DatabaseService {
  // Initialize database tables and setup
  static async initializeDatabase(): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if bookings table exists by trying to select from it
      const { data, error } = await supabase
        .from('bookings')
        .select('id')
        .limit(1)

      if (error && error.code === 'PGRST116') {
        // Table doesn't exist, we need to create it
        console.log('Bookings table does not exist. Please create it manually in Supabase.')
        return { 
          success: false, 
          error: 'Database table not found. Please run the SQL script in Supabase dashboard.' 
        }
      }

      if (error) {
        console.error('Database initialization error:', error)
        return { success: false, error: error.message }
      }

      console.log('Database initialized successfully')
      return { success: true }
    } catch (error) {
      console.error('Unexpected database error:', error)
      return { success: false, error: 'An unexpected error occurred during database initialization' }
    }
  }

  // Test database connection
  static async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      // Try to select from bookings table
      const { data, error } = await supabase
        .from('bookings')
        .select('id')
        .limit(1)

      if (error) {
        // If table doesn't exist, that's expected on first run
        if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
          console.log('Database table not found - setup required')
          return { success: false, error: 'Database table not found. Please run the SQL script in Supabase.' }
        }
        console.error('Database connection test failed:', error)
        return { success: false, error: error.message }
      }

      console.log('Database connection test successful')
      return { success: true }
    } catch (error) {
      console.error('Database connection test error:', error)
      return { success: false, error: 'Failed to connect to database' }
    }
  }

  // Get database statistics
  static async getStats(): Promise<{ 
    success: boolean; 
    data?: { 
      totalBookings: number; 
      pendingBookings: number; 
      approvedBookings: number; 
      rejectedBookings: number; 
    }; 
    error?: string 
  }> {
    try {
      const { data: totalData, error: totalError } = await supabase
        .from('bookings')
        .select('id', { count: 'exact' })

      const { data: pendingData, error: pendingError } = await supabase
        .from('bookings')
        .select('id', { count: 'exact' })
        .eq('status', 'pending')

      const { data: approvedData, error: approvedError } = await supabase
        .from('bookings')
        .select('id', { count: 'exact' })
        .eq('status', 'approved')

      const { data: rejectedData, error: rejectedError } = await supabase
        .from('bookings')
        .select('id', { count: 'exact' })
        .eq('status', 'rejected')

      if (totalError || pendingError || approvedError || rejectedError) {
        const error = totalError || pendingError || approvedError || rejectedError
        console.error('Stats fetch error:', error)
        return { success: false, error: error?.message }
      }

      return {
        success: true,
        data: {
          totalBookings: totalData?.length || 0,
          pendingBookings: pendingData?.length || 0,
          approvedBookings: approvedData?.length || 0,
          rejectedBookings: rejectedData?.length || 0,
        }
      }
    } catch (error) {
      console.error('Stats error:', error)
      return { success: false, error: 'Failed to fetch database statistics' }
    }
  }
}
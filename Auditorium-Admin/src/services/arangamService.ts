import { supabase } from '../lib/supabase'
import type { Arangam } from '../lib/supabase'

export class ArangamService {
  static async getAllArangams(): Promise<{ success: boolean; data?: Arangam[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('arangams')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Arangam fetch error:', error)
        return { success: true, data: [] }
      }

      return { success: true, data: data || [] }
    } catch (error) {
      console.error('Arangam fetch error:', error)
      return { success: true, data: [] }
    }
  }

  static async addArangam(name: string): Promise<{ success: boolean; data?: Arangam; error?: string }> {
    try {
      const id = name.toLowerCase().replace(/\s+/g, '-')
      const { data, error } = await supabase
        .from('arangams')
        .insert([{ id, name, is_active: true }])
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      return { success: false, error: 'Failed to add arangam' }
    }
  }

  static async updateArangam(id: string, name: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('arangams')
        .update({ name, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: 'Failed to update arangam' }
    }
  }

  static async deactivateArangam(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('arangams')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: 'Failed to deactivate arangam' }
    }
  }

  static async activateArangam(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('arangams')
        .update({ is_active: true, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: 'Failed to activate arangam' }
    }
  }

  static async permanentDeleteArangam(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      // First get the arangam name to match bookings
      const { data: arangam, error: fetchError } = await supabase
        .from('arangams')
        .select('name')
        .eq('id', id)
        .single()

      if (fetchError) {
        return { success: false, error: fetchError.message }
      }

      // Delete all bookings associated with this arangam
      const { error: bookingsError } = await supabase
        .from('bookings')
        .delete()
        .eq('arangam_name', arangam.name)

      if (bookingsError) {
        console.error('Error deleting bookings:', bookingsError)
        // Continue with arangam deletion even if bookings deletion fails
      }

      // Delete the arangam
      const { error } = await supabase
        .from('arangams')
        .delete()
        .eq('id', id)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: 'Failed to delete arangam' }
    }
  }
}

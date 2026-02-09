import { supabase } from '@/lib/supabase'

export interface Arangam {
  id: string
  name: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export class ArangamService {
  static async getActiveArangams(): Promise<{ success: boolean; data?: Arangam[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('arangams')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true })

      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
          return {
            success: true,
            data: [
              { id: 'arangam-1', name: 'VOC Arangam', is_active: true },
              { id: 'arangam-2', name: 'Thiruvalluvar Arangam', is_active: true },
              { id: 'arangam-3', name: 'Bharathiyar Arangam', is_active: true },
              { id: 'arangam-4', name: 'Vivekananda Arangam', is_active: true },
              { id: 'arangam-5', name: 'Ramakrishna Arangam', is_active: true }
            ]
          }
        }
        return { success: false, error: error.message }
      }

      return { success: true, data: data || [] }
    } catch (error) {
      return { success: false, error: 'Failed to fetch active arangams' }
    }
  }
}

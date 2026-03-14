import { supabase } from '@/lib/supabase'

export interface Arangam {
  id: string
  name: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}

const FALLBACK_ARANGAMS: Arangam[] = [
  { id: 'arangam-1', name: 'VOC Arangam', is_active: true },
  { id: 'thiruvalluvar-arangam', name: 'Thiruvalluvar Arangam', is_active: true },
  { id: 'arangam-3', name: 'Bharathiyar Arangam', is_active: true },
  { id: 'arangam-4', name: 'Vivekananda Arangam', is_active: true },
  { id: 'arangam-5', name: 'Ramakrishna Arangam', is_active: true }
]

export class ArangamService {
  static async getActiveArangams(): Promise<{ success: boolean; data?: Arangam[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('arangams')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Arangam fetch error:', error)
        return { success: true, data: FALLBACK_ARANGAMS }
      }

      // If DB returns empty, use fallback to ensure arangams always show
      return { success: true, data: (data && data.length > 0) ? data : FALLBACK_ARANGAMS }
    } catch (error) {
      return { success: true, data: FALLBACK_ARANGAMS }
    }
  }

  static subscribeToArangams(callback: () => void) {
    const channel = supabase
      .channel('arangams-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'arangams' }, callback)
      .subscribe()
    return () => channel.unsubscribe()
  }
}

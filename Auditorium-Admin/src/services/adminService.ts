import { supabase } from '../lib/supabase'

export class AdminService {
  static async updateCredentials(currentUsername: string, newUsername: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('admin_users')
        .update({ 
          username: newUsername, 
          password_hash: newPassword,
          updated_at: new Date().toISOString()
        })
        .eq('username', currentUsername)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: 'Failed to update credentials' }
    }
  }
}

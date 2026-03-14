import { supabase } from '../lib/supabase'

export class AdminService {
  static async updateCredentials(currentUsername: string, newUsername: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .update({
          username: newUsername,
          password_hash: newPassword,
          updated_at: new Date().toISOString()
        })
        .eq('username', currentUsername)
        .select()

      if (error) {
        return { success: false, error: error.message }
      }

      if (!data || data.length === 0) {
        return { success: false, error: 'Admin user not found. Make sure the username matches.' }
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: 'Failed to update credentials' }
    }
  }
}

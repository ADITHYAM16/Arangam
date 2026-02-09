import { supabase } from '../lib/supabase'

export class AuthService {
  static async login(username: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Fetch user from database
      const { data: user, error } = await supabase
        .from('admin_users')
        .select('username, password_hash')
        .eq('username', username)
        .eq('password_hash', password)
        .maybeSingle()

      if (error) {
        console.log('Database error:', error.message)
        return { success: false, error: 'Invalid username or password' }
      }

      if (!user) {
        return { success: false, error: 'Invalid username or password' }
      }

      return { success: true }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Invalid username or password' }
    }
  }
}

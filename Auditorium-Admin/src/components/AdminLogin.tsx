import { useState } from 'react'
import { Shield, Eye, EyeOff, ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface AdminLoginProps {
  onLogin: (username: string) => void
}

type View = 'login' | 'forgot-verify' | 'forgot-reset' | 'forgot-success'

const AdminLogin = ({ onLogin }: AdminLoginProps) => {
  const [view, setView] = useState<View>('login')
  const [credentials, setCredentials] = useState({ username: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Forgot password state
  const [resetUsername, setResetUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const resetForgotState = () => {
    setResetUsername('')
    setNewPassword('')
    setConfirmPassword('')
    setError('')
  }

  // Step 1: verify username exists
  const handleVerifyUsername = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    try {
      const { data, error: dbError } = await supabase
        .from('admin_users')
        .select('username')
        .eq('username', resetUsername.trim())
        .single()

      if (dbError || !data) {
        setError('Username not found. Please check and try again.')
      } else {
        setView('forgot-reset')
        setError('')
      }
    } catch {
      setError('Failed to verify username. Please try again.')
    }
    setIsLoading(false)
  }

  // Step 2: set new password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsLoading(true)
    try {
      const { data, error: dbError } = await supabase
        .from('admin_users')
        .update({ password_hash: newPassword, updated_at: new Date().toISOString() })
        .eq('username', resetUsername.trim())
        .select()

      if (dbError || !data || data.length === 0) {
        setError('Failed to reset password. Please try again.')
      } else {
        setView('forgot-success')
      }
    } catch {
      setError('Failed to reset password. Please try again.')
    }
    setIsLoading(false)
  }

  // Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    try {
      const { data, error: dbError } = await supabase
        .from('admin_users')
        .select('username, password_hash')
        .eq('username', credentials.username.trim())
        .single()

      if (dbError || !data) {
        setError('Invalid username or password')
      } else if (data.password_hash !== credentials.password) {
        setError('Invalid username or password')
      } else {
        onLogin(data.username)
      }
    } catch {
      setError('Login failed. Please try again.')
    }
    setIsLoading(false)
  }

  const cardClass = "w-full max-w-md bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-8 md:p-10 border-2 border-green-200 relative z-10"

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-100 to-green-200 flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(34,197,94,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(16,185,129,0.15),transparent_50%)]" />

      {/* College Header */}
      <header className="bg-gradient-to-r from-green-800 via-green-700 to-emerald-800 shadow-2xl border-b-4 border-orange-500 relative z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-center">
          <div className="text-center">
            <h1 className="font-bold text-sm sm:text-xl md:text-2xl lg:text-3xl tracking-wide leading-tight uppercase text-white">
              Mahendra Engineering College
              <span className="block text-[10px] sm:text-xs md:text-sm font-medium mt-0.5 opacity-90">(Autonomous)</span>
            </h1>
            <div className="text-[7px] sm:text-[9px] md:text-xs text-white/90 mt-1 leading-tight">
              <p>Autonomous Institution | Approved by AICTE | Recognized U/S 12(B) & 2(F) of UGC ACT 1956</p>
              <p>Affiliated to Anna University, Chennai | NAAC Accredited with A++ Grade & NBA Tier – 1 UG: CSE, ECE, EEE</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
      <div className={cardClass}>
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="mx-auto w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-full flex items-center justify-center mb-4 shadow-lg ring-4 ring-green-100">
            {view === 'forgot-success' ? (
              <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-green-600" />
            ) : view.startsWith('forgot') ? (
              <KeyRound className="w-10 h-10 sm:w-12 sm:h-12 text-green-600" />
            ) : (
              <img src="/MEC-NKL1_logo.png" alt="MEC Logo" className="w-16 h-16 sm:w-20 sm:h-20 object-contain" />
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-700 to-emerald-600 bg-clip-text text-transparent">
            {view === 'login' && 'Admin Dashboard'}
            {view === 'forgot-verify' && 'Forgot Password'}
            {view === 'forgot-reset' && 'Reset Password'}
            {view === 'forgot-success' && 'Password Reset!'}
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-green-400 to-emerald-500 mx-auto rounded-full my-3" />
          <p className="text-green-700 text-sm sm:text-base font-medium">
            {view === 'login' && 'Arangam Booking Management'}
            {view === 'forgot-verify' && 'Enter your admin username'}
            {view === 'forgot-reset' && `Setting new password for "${resetUsername}"`}
            {view === 'forgot-success' && 'Your password has been updated'}
          </p>
        </div>

        {/* LOGIN FORM */}
        {view === 'login' && (
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-green-800 mb-2">Username</label>
              <input
                type="text"
                value={credentials.username}
                onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                className="w-full px-4 py-3 border-2 border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 text-sm sm:text-base"
                placeholder="Enter admin username"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-green-800 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  className="w-full px-4 py-3 pr-12 border-2 border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 text-sm sm:text-base"
                  placeholder="Enter admin password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600 hover:text-green-800 p-1 rounded-md hover:bg-green-50"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-200">{error}</div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 px-6 rounded-lg transition-all duration-300 disabled:opacity-50 font-bold text-base sm:text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Logging in...
                </span>
              ) : 'Login'}
            </button>

            <button
              type="button"
              onClick={() => { resetForgotState(); setView('forgot-verify') }}
              className="w-full text-green-600 hover:text-green-800 text-sm font-semibold transition-colors py-1"
            >
              Forgot Password?
            </button>
          </form>
        )}

        {/* FORGOT — STEP 1: verify username */}
        {view === 'forgot-verify' && (
          <form onSubmit={handleVerifyUsername} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-green-800 mb-2">Admin Username</label>
              <input
                type="text"
                value={resetUsername}
                onChange={(e) => setResetUsername(e.target.value)}
                className="w-full px-4 py-3 border-2 border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 text-sm sm:text-base"
                placeholder="Enter your admin username"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Enter your username to verify your identity</p>
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-200">{error}</div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 px-6 rounded-lg transition-all duration-300 disabled:opacity-50 font-bold text-base shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Verifying...
                </span>
              ) : 'Verify Username'}
            </button>

            <button
              type="button"
              onClick={() => { setView('login'); setError('') }}
              className="w-full flex items-center justify-center gap-2 text-green-600 hover:text-green-800 text-sm font-semibold transition-colors py-1"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Login
            </button>
          </form>
        )}

        {/* FORGOT — STEP 2: set new password */}
        {view === 'forgot-reset' && (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-green-800 mb-2">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border-2 border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 text-sm sm:text-base"
                  placeholder="Enter new password (min 6 chars)"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600 hover:text-green-800 p-1 rounded-md hover:bg-green-50"
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-green-800 mb-2">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border-2 border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 text-sm sm:text-base"
                  placeholder="Re-enter new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600 hover:text-green-800 p-1 rounded-md hover:bg-green-50"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
              )}
              {confirmPassword && newPassword === confirmPassword && (
                <p className="text-green-600 text-xs mt-1">✓ Passwords match</p>
              )}
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-200">{error}</div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 px-6 rounded-lg transition-all duration-300 disabled:opacity-50 font-bold text-base shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Resetting...
                </span>
              ) : 'Reset Password'}
            </button>

            <button
              type="button"
              onClick={() => { setView('forgot-verify'); setError('') }}
              className="w-full flex items-center justify-center gap-2 text-green-600 hover:text-green-800 text-sm font-semibold transition-colors py-1"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          </form>
        )}

        {/* FORGOT — SUCCESS */}
        {view === 'forgot-success' && (
          <div className="text-center space-y-5">
            <div className="p-4 bg-green-50 rounded-xl border border-green-200">
              <p className="text-green-800 font-semibold text-sm sm:text-base">
                Password for <span className="font-bold">"{resetUsername}"</span> has been reset successfully.
              </p>
              <p className="text-green-600 text-xs sm:text-sm mt-1">You can now log in with your new password.</p>
            </div>
            <button
              onClick={() => { resetForgotState(); setView('login') }}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 px-6 rounded-lg transition-all duration-300 font-bold text-base shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
      </div>
    </div>
  )
}

export default AdminLogin

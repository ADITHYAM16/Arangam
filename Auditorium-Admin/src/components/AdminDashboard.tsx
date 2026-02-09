import { useState, useEffect } from 'react'
import { Users, Calendar, Building2, Settings, LogOut, CheckCircle, XCircle, Shield, Download, Edit, Plus, Trash2, RotateCcw, Key } from 'lucide-react'
import { BookingService } from '../services/bookingService'
import { ArangamService } from '../services/arangamService'
import { AdminService } from '../services/adminService'
import type { Arangam } from '../lib/supabase'
import * as XLSX from 'xlsx'

interface AdminDashboardProps {
  onLogout: () => void
}

interface BookingData {
  id: string
  event_name: string
  event_type: string
  department: string
  year: string
  arangam_name: string
  booking_date: string
  slot_type: string
  coordinator_name: string
  coordinator_email: string
  contact_number: string
  status: string
  created_at: string
  remarks?: string
}

const AdminDashboard = ({ onLogout }: AdminDashboardProps) => {
  const [bookings, setBookings] = useState<BookingData[]>([])
  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    approvedBookings: 0,
    todayBookings: 0
  })
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [isRealTimeConnected, setIsRealTimeConnected] = useState(false)
  const [arangams, setArangams] = useState<Arangam[]>([])
  const [newArangamName, setNewArangamName] = useState('')
  const [editingArangam, setEditingArangam] = useState<{ id: string; name: string } | null>(null)
  const [currentUsername, setCurrentUsername] = useState('Admin')
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')

  useEffect(() => {
    fetchBookings()
    fetchArangams()

    // Set up real-time subscription
    const unsubscribe = BookingService.subscribeToBookings(() => {
      setIsRealTimeConnected(true)
      fetchBookings() // Refresh data when changes occur
    })

    // Set connection status
    setIsRealTimeConnected(true)

    return () => {
      unsubscribe()
      setIsRealTimeConnected(false)
    }
  }, [])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const result = await BookingService.getAllBookings()
      if (result.success && result.data) {
        setBookings(result.data as any)
        calculateStats(result.data as any)
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (bookingsData: BookingData[]) => {
    const today = new Date().toLocaleDateString('en-CA')
    setStats({
      totalBookings: bookingsData.length,
      pendingBookings: bookingsData.filter(b => b.status === 'pending').length,
      approvedBookings: bookingsData.filter(b => b.status === 'approved').length,
      todayBookings: bookingsData.filter(b => b.booking_date === today).length
    })
  }

  const updateBookingStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const result = await BookingService.updateBookingStatus(id, status)
      if (result.success) {
        // Data will be automatically refreshed via real-time subscription
        alert(`Booking ${status} successfully`)
      } else {
        alert(`Failed to update booking: ${result.error}`)
      }
    } catch (error) {
      alert('Failed to update booking status')
    }
  }

  const downloadAllBookings = async () => {
    try {
      if (bookings.length === 0) {
        alert('No booking records found to download.')
        return
      }

      const excelData = bookings.map((booking) => ({
        'Booking ID': booking.id,
        'Event Name': booking.event_name,
        'Event Type': booking.event_type,
        'Department': booking.department,
        'Year': booking.year,
        'Arangam': booking.arangam_name || 'MG Auditorium',
        'Booking Date': new Date(booking.booking_date).toLocaleDateString('en-IN'),
        'Time Slot': booking.slot_type,
        'Coordinator Name': booking.coordinator_name,
        'Coordinator Email': booking.coordinator_email,
        'Contact Number': booking.contact_number,
        'Remarks': booking.remarks || '',
        'Status': booking.status || 'pending',
        'Booked On': new Date(booking.created_at || '').toLocaleString('en-IN')
      }))

      const ws = XLSX.utils.json_to_sheet(excelData)
      const colWidths = [
        { wch: 10 }, { wch: 25 }, { wch: 20 }, { wch: 30 }, { wch: 12 },
        { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 30 },
        { wch: 15 }, { wch: 40 }, { wch: 12 }, { wch: 20 }
      ]
      ws['!cols'] = colWidths

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Bookings')

      const today = new Date().toISOString().split('T')[0]
      const filename = `Auditorium_Bookings_${today}.xlsx`
      XLSX.writeFile(wb, filename)

      alert(`${bookings.length} booking(s) downloaded as ${filename}`)
    } catch (error) {
      console.error('Error downloading bookings:', error)
      alert('Failed to download booking data. Please try again.')
    }
  }

  const fetchArangams = async () => {
    try {
      const result = await ArangamService.getAllArangams()
      if (result.success && result.data) {
        setArangams(result.data)
      }
    } catch (error) {
      console.error('Error fetching arangams:', error)
      setArangams([])
    }
  }

  const handleAddArangam = async () => {
    if (!newArangamName.trim()) {
      alert('Please enter arangam name')
      return
    }
    const result = await ArangamService.addArangam(newArangamName.trim())
    if (result.success) {
      alert('Arangam added successfully')
      setNewArangamName('')
      fetchArangams()
    } else {
      alert(`Failed to add arangam: ${result.error}`)
    }
  }

  const handleUpdateArangam = async () => {
    if (!editingArangam || !editingArangam.name.trim()) {
      alert('Please enter arangam name')
      return
    }
    const result = await ArangamService.updateArangam(editingArangam.id, editingArangam.name.trim())
    if (result.success) {
      alert('Arangam updated successfully')
      setEditingArangam(null)
      fetchArangams()
    } else {
      alert(`Failed to update arangam: ${result.error}`)
    }
  }

  const handleDeactivateArangam = async (id: string) => {
    if (!confirm('Are you sure you want to remove this arangam?')) return
    const result = await ArangamService.deactivateArangam(id)
    if (result.success) {
      alert('Arangam moved to recycle bin')
      fetchArangams()
    } else {
      alert(`Failed to remove arangam: ${result.error}`)
    }
  }

  const handleActivateArangam = async (id: string) => {
    const result = await ArangamService.activateArangam(id)
    if (result.success) {
      alert('Arangam restored successfully')
      fetchArangams()
    } else {
      alert(`Failed to restore arangam: ${result.error}`)
    }
  }

  const handlePermanentDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this arangam? This cannot be undone.')) return
    const result = await ArangamService.permanentDeleteArangam(id)
    if (result.success) {
      alert('Arangam permanently deleted')
      fetchArangams()
    } else {
      alert(`Failed to delete arangam: ${result.error}`)
    }
  }

  const handleUpdateCredentials = async () => {
    if (!newUsername.trim() || !newPassword.trim()) {
      alert('Please enter both username and password')
      return
    }
    const result = await AdminService.updateCredentials(currentUsername, newUsername.trim(), newPassword.trim())
    if (result.success) {
      alert('Credentials updated successfully. Please login again with new credentials.')
      setCurrentUsername(newUsername.trim())
      setNewUsername('')
      setNewPassword('')
      setTimeout(() => onLogout(), 2000)
    } else {
      alert(`Failed to update credentials: ${result.error}`)
    }
  }

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white/95 backdrop-blur-sm p-4 sm:p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-gray-100 hover:border-green-200 transform hover:-translate-y-1">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs sm:text-sm font-semibold text-gray-600 mb-1">{title}</p>
          <p className={`text-xl sm:text-2xl md:text-3xl font-bold ${color}`}>{value}</p>
        </div>
        <div className="bg-gradient-to-br from-green-100 to-emerald-100 p-2 sm:p-3 rounded-lg">
          <Icon className={`w-6 h-6 sm:w-8 sm:h-8 ${color}`} />
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-emerald-50 to-background relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(34,197,94,0.05),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(16,185,129,0.08),transparent_50%)]" />

      {/* Header */}
      <header className="bg-gradient-to-r from-green-800 via-green-700 to-emerald-800 shadow-2xl border-b-4 border-orange-500 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center py-4 sm:py-6 gap-4">
            <div className="text-center sm:text-left">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white flex items-center gap-2 justify-center sm:justify-start">
                <Shield className="w-6 h-6 sm:w-7 sm:h-7" />
                Admin Dashboard
                {isRealTimeConnected && (
                  <div className="flex items-center gap-1 ml-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-200">Live</span>
                  </div>
                )}
              </h1>
              <p className="text-green-100 text-xs sm:text-sm mt-1">Arangam Booking Management System</p>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 text-white hover:text-orange-100 bg-green-700 border-2 border-green-600 rounded-lg hover:bg-green-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium text-sm sm:text-base"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative z-10">
        {/* Navigation Tabs */}
        <div className="mb-6 sm:mb-8">
          <nav className="flex flex-col sm:flex-row sm:space-x-2 md:space-x-4 lg:space-x-8 space-y-2 sm:space-y-0 bg-white/80 backdrop-blur-sm p-2 sm:p-4 rounded-xl shadow-lg border border-gray-200">
            {[
              { id: 'overview', label: 'Overview', icon: Calendar },
              { id: 'bookings', label: 'Manage Bookings', icon: Building2 },
              { id: 'customize', label: 'Customize', icon: Edit },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center justify-center sm:justify-start gap-2 px-3 sm:px-4 py-2 sm:py-3 text-sm md:text-base font-semibold rounded-lg transition-all duration-300 ${activeTab === id
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-700 hover:text-green-700 hover:bg-green-50 border border-transparent hover:border-green-200'
                  }`}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{label.split(' ')[0]}</span>
              </button>
            ))}
          </nav>
        </div>

        {loading ? (
          <div className="text-center py-12 sm:py-16">
            <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-4 border-green-600 mx-auto"></div>
            <p className="mt-4 sm:mt-6 text-gray-600 font-medium text-base sm:text-lg">Loading...</p>
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6 sm:space-y-8 animate-fade-in">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <StatCard
                    title="Total Bookings"
                    value={stats.totalBookings}
                    icon={Calendar}
                    color="text-green-600"
                  />
                  <StatCard
                    title="Today's Events"
                    value={stats.todayBookings}
                    icon={Calendar}
                    color="text-blue-600"
                  />
                </div>

                {/* Recent Bookings */}
                <div className="bg-white/95 backdrop-blur-sm p-4 sm:p-6 md:p-8 rounded-xl shadow-lg border-2 border-gray-100">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-primary mb-4 sm:mb-6 flex items-center gap-2">
                    <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                    Recent Bookings
                  </h3>
                  <div className="w-16 h-1 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full mb-4 sm:mb-6" />
                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gradient-to-r from-green-50 to-emerald-50">
                        <tr>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Event</th>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider hidden sm:table-cell">Date</th>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider hidden md:table-cell">Arangam</th>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {bookings.slice(0, 5).map((booking) => (
                          <tr key={booking.id} className="hover:bg-green-50 transition-colors">
                            <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm">
                              <div className="font-semibold text-gray-900">{booking.event_name}</div>
                              <div className="text-gray-500 text-xs sm:hidden">{new Date(booking.booking_date).toLocaleDateString('en-IN')}</div>
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600 hidden sm:table-cell">
                              {new Date(booking.booking_date).toLocaleDateString('en-IN')}
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600 hidden md:table-cell">
                              {booking.arangam_name || 'MG Auditorium'}
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-bold rounded-full ${booking.status === 'approved' ? 'bg-green-100 text-green-800 ring-2 ring-green-200' :
                                booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800 ring-2 ring-yellow-200' :
                                  'bg-red-100 text-red-800 ring-2 ring-red-200'
                                }`}>
                                {booking.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Bookings Management Tab */}
            {activeTab === 'bookings' && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-white/95 backdrop-blur-sm p-4 sm:p-6 md:p-8 rounded-xl shadow-lg border-2 border-gray-100">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-4">
                    <div>
                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-primary flex items-center gap-2">
                        <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                        All Bookings
                      </h3>
                      <div className="w-16 h-1 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full mt-2" />
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={downloadAllBookings}
                        className="flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-sm sm:text-base flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                      <button
                        onClick={fetchBookings}
                        className="flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 border-2 border-green-300 rounded-lg hover:bg-green-50 text-green-700 font-semibold transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-sm sm:text-base"
                      >
                        Refresh
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gradient-to-r from-green-50 to-emerald-50">
                        <tr>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Event Details</th>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider hidden md:table-cell">Coordinator</th>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider hidden lg:table-cell">Date & Time</th>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {bookings.map((booking) => (
                          <tr key={booking.id} className="hover:bg-green-50 transition-colors">
                            <td className="px-3 sm:px-6 py-4">
                              <div>
                                <div className="text-xs sm:text-sm font-bold text-gray-900">{booking.event_name}</div>
                                <div className="text-xs text-gray-600">{booking.department}</div>
                                <div className="text-xs text-gray-500">{booking.arangam_name || 'MG Auditorium'}</div>
                                <div className="text-xs text-gray-500 md:hidden mt-1">{booking.coordinator_name}</div>
                              </div>
                            </td>
                            <td className="px-3 sm:px-6 py-4 hidden md:table-cell">
                              <div className="text-xs sm:text-sm text-gray-900 font-medium">{booking.coordinator_name}</div>
                              <div className="text-xs text-gray-600">{booking.coordinator_email}</div>
                            </td>
                            <td className="px-3 sm:px-6 py-4 hidden lg:table-cell">
                              <div className="text-xs sm:text-sm text-gray-900 font-medium">
                                {new Date(booking.booking_date).toLocaleDateString('en-IN')}
                              </div>
                              <div className="text-xs text-gray-600">{booking.slot_type}</div>
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-bold rounded-full ${booking.status === 'approved' ? 'bg-green-100 text-green-800 ring-2 ring-green-200' :
                                booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800 ring-2 ring-yellow-200' :
                                  'bg-red-100 text-red-800 ring-2 ring-red-200'
                                }`}>
                                {booking.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Customize Tab */}
            {activeTab === 'customize' && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-white/95 backdrop-blur-sm p-4 sm:p-6 md:p-8 rounded-xl shadow-lg border-2 border-gray-100">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-primary mb-4 sm:mb-6 flex items-center gap-2">
                    <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                    Add New Arangam
                  </h3>
                  <div className="w-16 h-1 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full mb-4 sm:mb-6" />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newArangamName}
                      onChange={(e) => setNewArangamName(e.target.value)}
                      placeholder="Enter arangam name"
                      className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                    />
                    <button
                      onClick={handleAddArangam}
                      className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add
                    </button>
                  </div>
                </div>

                <div className="bg-white/95 backdrop-blur-sm p-4 sm:p-6 md:p-8 rounded-xl shadow-lg border-2 border-gray-100">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-primary mb-4 sm:mb-6 flex items-center gap-2">
                    <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                    Active Arangams
                  </h3>
                  <div className="w-16 h-1 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full mb-4 sm:mb-6" />
                  <div className="space-y-3">
                    {arangams.filter(a => a.is_active).length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No active arangams. Add one above.</p>
                    ) : (
                      arangams.filter(a => a.is_active).map((arangam) => (
                        <div key={arangam.id} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                          {editingArangam?.id === arangam.id ? (
                            <div className="flex-1 flex gap-2">
                              <input
                                type="text"
                                value={editingArangam.name}
                                onChange={(e) => setEditingArangam({ ...editingArangam, name: e.target.value })}
                                className="flex-1 px-3 py-1 border-2 border-green-300 rounded focus:border-green-500 focus:outline-none"
                              />
                              <button
                                onClick={handleUpdateArangam}
                                className="px-4 py-1 bg-green-600 hover:bg-green-700 text-white rounded font-semibold text-sm"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingArangam(null)}
                                className="px-4 py-1 bg-gray-400 hover:bg-gray-500 text-white rounded font-semibold text-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <>
                              <span className="font-semibold text-gray-800">{arangam.name}</span>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setEditingArangam({ id: arangam.id, name: arangam.name })}
                                  className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-all"
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeactivateArangam(arangam.id)}
                                  className="p-2 bg-red-600 hover:bg-red-700 text-white rounded transition-all"
                                  title="Remove"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="bg-white/95 backdrop-blur-sm p-4 sm:p-6 md:p-8 rounded-xl shadow-lg border-2 border-gray-100">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-primary mb-4 sm:mb-6 flex items-center gap-2">
                    <Trash2 className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                    Recycle Bin
                  </h3>
                  <div className="w-16 h-1 bg-gradient-to-r from-red-400 to-red-500 rounded-full mb-4 sm:mb-6" />
                  <div className="space-y-3">
                    {arangams.filter(a => !a.is_active).length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No removed arangams</p>
                    ) : (
                      arangams.filter(a => !a.is_active).map((arangam) => (
                        <div key={arangam.id} className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                          <span className="font-semibold text-gray-800">{arangam.name}</span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleActivateArangam(arangam.id)}
                              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-semibold text-sm transition-all"
                            >
                              <RotateCcw className="w-4 h-4" />
                              Restore
                            </button>
                            <button
                              onClick={() => handlePermanentDelete(arangam.id)}
                              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-semibold text-sm transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-white/95 backdrop-blur-sm p-4 sm:p-6 md:p-8 rounded-xl shadow-lg border-2 border-gray-100">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-primary mb-4 sm:mb-6 flex items-center gap-2">
                    <Key className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                    Update Admin Credentials
                  </h3>
                  <div className="w-16 h-1 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full mb-4 sm:mb-6" />
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">New Username</label>
                      <input
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        placeholder="Enter new username"
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                      />
                    </div>
                    <button
                      onClick={handleUpdateCredentials}
                      className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 text-sm sm:text-base"
                    >
                      Update Credentials
                    </button>
                    <p className="text-xs text-gray-500 mt-2">Note: You will be logged out after updating credentials</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard
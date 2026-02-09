import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { BookingService } from '@/services/bookingService';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '@/components/Header';
import { AlertTriangle, ArrowLeft, FileText, User, Calendar, Clock } from 'lucide-react';

function CancelBooking() {
  const [booking, setBooking] = useState(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { bookingId } = useParams();

  useEffect(() => {
    if (bookingId) {
      fetchBooking();
    }
  }, [bookingId]);

  const fetchBooking = async () => {
    try {
      // First try regular bookings table
      let { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      // If not found in regular bookings, try MG auditorium bookings
      if (error && error.code === 'PGRST116') {
        const mgResult = await supabase
          .from('mg_auditorium_bookings')
          .select('*')
          .eq('id', bookingId)
          .single();
        
        if (mgResult.error) throw mgResult.error;
        data = { ...mgResult.data, arangam_name: 'MG Auditorium' };
      } else if (error) {
        throw error;
      }

      setBooking(data);
    } catch (error) {
      console.error('Error fetching booking:', error);
      alert('Error loading booking details');
    } finally {
      setLoading(false);
    }
  };

  const handleCancellation = async () => {
    if (!cancellationReason.trim()) {
      alert('Please provide a reason for cancellation');
      return;
    }

    if (!confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
      return;
    }

    setSubmitting(true);

    try {
      // Use BookingService for proper backend integration
      const result = await BookingService.cancelBooking(bookingId, cancellationReason);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to cancel booking');
      }

      // Show success popup with confirmation message
      alert('🎉 CANCELLATION CONFIRMED!\n\n✅ Your booking has been successfully cancelled\n🔓 The slot is now FREE and available for rebooking\n📧 Confirmation has been recorded in the system');
      
      // Navigate back to view bookings
      navigate('/');
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('❌ Error cancelling booking: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header logoSrc="/MEC-NKL1_logo.png" />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-700">Loading booking details...</h2>
          </div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-background">
        <Header logoSrc="/MEC-NKL1_logo.png" />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-700">Booking not found</h2>
            <button
              onClick={() => navigate('/')}
              className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg"
            >
              Back to Bookings
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header logoSrc="/MEC-NKL1_logo.png" />

      <div className="py-8 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div>
              <h1 className="font-display text-3xl font-bold text-red-600 flex items-center gap-3">
                <AlertTriangle className="w-8 h-8" />
                Cancel Booking
              </h1>
              <div className="w-16 h-1 bg-red-500 rounded-full mt-2" />
            </div>
          </div>

          {/* Warning Notice */}
          <div className="bg-red-50 border-l-4 border-red-500 p-6 mb-8 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-red-800 mb-2">Important Notice</h3>
                <ul className="text-red-700 space-y-1 text-sm">
                  <li>• Cancellation will immediately free up the slot for other bookings</li>
                  <li>• This action cannot be undone</li>
                  <li>• Please provide a valid reason for cancellation</li>
                  <li>• The booking record will be maintained for administrative purposes</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Booking Details */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Booking Details to Cancel</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-semibold">Arangam</p>
                  <p className="text-gray-600">{booking.arangam_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-semibold">Date</p>
                  <p className="text-gray-600">{new Date(booking.booking_date).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="font-semibold">Time Slot</p>
                  <p className="text-gray-600">{booking.time_slot}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="font-semibold">Coordinator</p>
                  <p className="text-gray-600">{booking.coordinator_name}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Cancellation Form */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Cancellation Procedure
            </h2>

            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-3">Steps to Cancel:</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-600">
                <li>Provide a detailed reason for cancellation below</li>
                <li>Review the booking details one more time</li>
                <li>Click "Confirm Cancellation" to proceed</li>
                <li>The slot will be immediately available for rebooking</li>
              </ol>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Reason for Cancellation *
              </label>
              <textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="Please provide a detailed reason for cancelling this booking..."
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 min-h-[120px] resize-vertical"
                required
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => navigate('/')}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all duration-200"
              >
                Keep Booking
              </button>
              <button
                onClick={() => {
                  if (!cancellationReason.trim()) {
                    alert('Please provide a reason for cancellation');
                    return;
                  }
                  if (confirm('Confirm cancellation? This action cannot be undone.')) {
                    handleCancellation();
                  }
                }}
                disabled={!cancellationReason.trim()}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-all duration-200"
              >
                ✓ Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CancelBooking;
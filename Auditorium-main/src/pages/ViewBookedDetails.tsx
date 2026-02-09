import { useState, useEffect } from 'react'
import { Calendar, Clock, User, Phone, Building, FileText, Mail, Users, ArrowLeft, Badge, CheckCircle, XCircle, AlertCircle, Download, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge as BadgeComponent } from '@/components/ui/badge'
import { BookingService } from '@/services/bookingService'
import { BookingRecord } from '@/lib/supabase'
import { toast } from '@/hooks/use-toast'
import jsPDF from 'jspdf'
import { supabase } from '@/lib/supabase'

interface ViewBookedDetailsProps {
  onBack: () => void
}

const ViewBookedDetails = ({ onBack }: ViewBookedDetailsProps) => {
  const [bookings, setBookings] = useState<BookingRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    setLoading(true)
    const result = await BookingService.getAllBookingsCombined()

    if (result.success && result.data) {
      setBookings(result.data)
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to fetch bookings",
        variant: "destructive"
      })
    }
    setLoading(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
      case 'booked':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
      case 'booked':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const generatePDF = (booking: BookingRecord) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Mahendra Engineering College (Autonomous)', 105, 20, { align: 'center' });

    doc.setFontSize(14);
    doc.text('BOOKING CONFIRMATION', 105, 35, { align: 'center' });

    // Line under header
    doc.line(20, 40, 190, 40);

    let yPos = 55;

    // Event Details
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Event Details:', 20, yPos);
    yPos += 10;

    doc.setFont('helvetica', 'normal');
    doc.text(`Event Name: ${booking.event_name}`, 25, yPos);
    yPos += 7;
    doc.text(`Event Type: ${booking.event_type}`, 25, yPos);
    yPos += 7;
    doc.text(`Department: ${booking.department}`, 25, yPos);
    yPos += 7;
    doc.text(`Year: ${booking.year}`, 25, yPos);
    yPos += 7;
    if (booking.arangam_name) {
      doc.text(`Arangam: ${booking.arangam_name}`, 25, yPos);
      yPos += 7;
    }
    yPos += 5;

    // Booking Details
    doc.setFont('helvetica', 'bold');
    doc.text('Booking Details:', 20, yPos);
    yPos += 10;

    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${formatDate(booking.booking_date)}`, 25, yPos);
    yPos += 7;
    doc.text(`Slot: ${booking.slot_type}`, 25, yPos);
    yPos += 7;
    doc.text(`Booked On: ${formatDateTime(booking.created_at || '')}`, 25, yPos);
    yPos += 12;

    // Coordinator Details
    doc.setFont('helvetica', 'bold');
    doc.text('Coordinator Details:', 20, yPos);
    yPos += 10;

    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${booking.coordinator_name}`, 25, yPos);
    yPos += 7;
    doc.text(`Email: ${booking.coordinator_email}`, 25, yPos);
    yPos += 7;
    doc.text(`Phone: ${booking.contact_number}`, 25, yPos);
    yPos += 12;

    // Remarks
    if (booking.remarks) {
      doc.setFont('helvetica', 'bold');
      doc.text('Remarks:', 20, yPos);
      yPos += 10;

      doc.setFont('helvetica', 'normal');
      const splitRemarks = doc.splitTextToSize(booking.remarks, 160);
      doc.text(splitRemarks, 25, yPos);
      yPos += splitRemarks.length * 7 + 10;
    }

    // Footer
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text('Auditorium Booking System', 105, 280, { align: 'center' });

    // Save the PDF
    const fileName = `booking-${booking.event_name.replace(/\s+/g, '-')}-${booking.booking_date}.pdf`;
    doc.save(fileName);

    toast({
      title: "PDF Downloaded",
      description: "Booking details have been downloaded as PDF successfully.",
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading bookings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
            <Button
              onClick={onBack}
              variant="outline"
              className="flex items-center gap-2 w-fit"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div className="bg-green-800 text-white p-4 rounded-lg text-center">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Booked Event Details</h1>
              <p className="text-sm sm:text-base text-gray-200">View all auditorium bookings and their status</p>
            </div>
          </div>

          {bookings.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Building className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-muted-foreground mb-2">No Bookings Found</h3>
                <p className="text-muted-foreground">There are no auditorium bookings to display.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {bookings.map((booking) => (
                <Card key={booking.id} className={`hover:shadow-lg transition-shadow ${booking.status === 'cancelled' ? 'bg-red-50 border-red-200' : ''
                  }`}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-xl">
                          <FileText className="w-5 h-5 text-primary" />
                          {booking.event_name}
                        </CardTitle>
                        <p className="text-muted-foreground mt-1">{booking.event_type}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <BadgeComponent className={getStatusColor(booking.status || 'pending')}>
                          {booking.status === 'booked' ? 'BOOKED' : (booking.status || 'pending').toUpperCase()}
                        </BadgeComponent>
                        {(booking.status !== 'cancelled' && booking.status !== 'rejected') && (
                          <Button
                            onClick={() => window.location.href = `/cancel-booking/${booking.id}`}
                            size="sm"
                            variant="destructive"
                            className="flex items-center gap-1"
                          >
                            <AlertTriangle className="w-3 h-3" />
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Event Details */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-primary flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Event Details
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <FileText className="w-3 h-3 text-muted-foreground" />
                            <span className="font-medium">Event Name:</span>
                            <span>{booking.event_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            <span className="font-medium">Event Type:</span>
                            <span>{booking.event_type}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Building className="w-3 h-3 text-muted-foreground" />
                            <span className="font-medium">Department:</span>
                            <span>{booking.department}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-3 h-3 text-muted-foreground" />
                            <span className="font-medium">Year:</span>
                            <span>{booking.year}</span>
                          </div>
                          {booking.arangam_name && (
                            <div className="flex items-center gap-2">
                              <Building className="w-3 h-3 text-muted-foreground" />
                              <span className="font-medium">Arangam:</span>
                              <span>{booking.arangam_name}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Booking Details */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-primary flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Booking Details
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            <span className="font-medium">Date:</span>
                            <span>{formatDate(booking.booking_date)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <span className="font-medium">Slot:</span>
                            <span className="capitalize">{booking.slot_type}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-3 h-3 text-muted-foreground" />
                            <span className="font-medium">Booked:</span>
                            <span>{formatDateTime(booking.created_at || '')}</span>
                          </div>
                        </div>
                      </div>

                      {/* Coordinator Details */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-primary flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Coordinator
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="w-3 h-3 text-muted-foreground" />
                            <span className="font-medium">Name:</span>
                            <span>{booking.coordinator_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="w-3 h-3 text-muted-foreground" />
                            <span className="font-medium">Email:</span>
                            <span className="break-all">{booking.coordinator_email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-3 h-3 text-muted-foreground" />
                            <span className="font-medium">Phone:</span>
                            <span>{booking.contact_number}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {booking.remarks && (
                      <div className="mt-6 pt-4 border-t">
                        <h4 className="font-semibold text-primary flex items-center gap-2 mb-2">
                          <FileText className="w-4 h-4" />
                          Remarks
                        </h4>
                        <p className="text-sm text-muted-foreground bg-secondary/50 p-3 rounded">
                          {booking.remarks}
                        </p>
                      </div>
                    )}

                    <div className="mt-4 flex justify-end">
                      <Button
                        onClick={() => generatePDF(booking)}
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download PDF
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ViewBookedDetails
import { useState, useEffect } from "react";
import { Calendar, Users, Clock, Building2, CheckCircle2, Shield, Eye, Download } from "lucide-react";
import * as XLSX from 'xlsx';
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import SlotSelector from "@/components/SlotSelector";
import BookingForm, { BookingData } from "@/components/BookingForm";
import BookingWorkflowDialog from "@/components/BookingWorkflowDialog";
import FeatureCard from "@/components/FeatureCard";
import ViewBookedDetails from "@/pages/ViewBookedDetails";
import mecLogo from "@/assets/mec-logo.png";
import { BookingService } from "@/services/bookingService";
import { ArangamService } from "@/services/arangamService";
import { toast } from "@/hooks/use-toast";

interface IndexProps {
  onShowDatabaseSetup?: () => void;
}

const Index = ({ onShowDatabaseSetup }: IndexProps = {}) => {
  const [showBookingPage, setShowBookingPage] = useState(false);
  const [showMGBookingPage, setShowMGBookingPage] = useState(false);
  const [showViewBookedDetails, setShowViewBookedDetails] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedArangam, setSelectedArangam] = useState<string | null>(null);
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Calendar booking state
  const [calendarSelectedDate, setCalendarSelectedDate] = useState<Date | null>(null);
  const [showAvailableSlots, setShowAvailableSlots] = useState(false);
  const [availableArangams, setAvailableArangams] = useState<{ id: string, name: string, slots: string[] }[]>([]);
  const [isLoadingArangams, setIsLoadingArangams] = useState(false);

  // Workflow dialog state
  const [workflowDialogOpen, setWorkflowDialogOpen] = useState(false);
  const [workflowArangam, setWorkflowArangam] = useState<string | null>(null);
  const [isMGWorkflow, setIsMGWorkflow] = useState(false);

  // Mock booked slots for demonstration
  const bookedSlots: { date: string; slot: string }[] = [];

  // Fetch upcoming events
  const fetchUpcomingEvents = async () => {
    try {
      const result = await BookingService.getAllBookingsCombined();
      if (result.success && result.data) {
        // Get active arangams to filter bookings
        const arangamResult = await ArangamService.getActiveArangams();
        const activeArangamNames = arangamResult.success && arangamResult.data 
          ? arangamResult.data.map(a => a.name)
          : [];
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Filter for upcoming events and only include booked/pending status
        // Also filter out bookings for inactive/deleted arangams
        const upcomingFiltered = result.data
          .filter(booking => {
            const bookingDate = new Date(booking.booking_date);
            bookingDate.setHours(0, 0, 0, 0);
            const isUpcoming = bookingDate >= today && (booking.status === 'booked' || booking.status === 'pending');
            
            // If arangam_name is null or 'MG Auditorium', always include
            if (!booking.arangam_name || booking.arangam_name === 'MG Auditorium') {
              return isUpcoming;
            }
            
            // Otherwise, only include if arangam is active
            return isUpcoming && activeArangamNames.includes(booking.arangam_name);
          })
          .sort((a, b) => new Date(a.booking_date).getTime() - new Date(b.booking_date).getTime());
        
        // Remove duplicates based on unique combination of date, arangam, and slot
        const uniqueEvents = upcomingFiltered.filter((booking, index, self) => 
          index === self.findIndex(b => 
            b.booking_date === booking.booking_date && 
            b.arangam_name === booking.arangam_name && 
            b.slot_type === booking.slot_type
          )
        ).slice(0, 9);
        
        setUpcomingEvents(uniqueEvents);
      }
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
    }
  };

  useEffect(() => {
    fetchUpcomingEvents();
    
    // Auto-refresh every 2 seconds
    const interval = setInterval(() => {
      fetchUpcomingEvents();
      // Also refresh available arangams if showing that screen
      if (showAvailableSlots && calendarSelectedDate) {
        handleNextFromCalendar();
      }
    }, 2000);
    
    return () => clearInterval(interval);
  }, [showAvailableSlots, calendarSelectedDate]);

  // Auto-rotate events with faster fade transition
  useEffect(() => {
    if (upcomingEvents.length > 3) {
      const interval = setInterval(() => {
        setIsTransitioning(true);
        setTimeout(() => {
          setCurrentEventIndex(prev => {
            const maxIndex = Math.ceil(upcomingEvents.length / 3) - 1;
            return prev >= maxIndex ? 0 : prev + 1;
          });
          setTimeout(() => {
            setIsTransitioning(false);
          }, 50);
        }, 800);
      }, 12000);
      return () => clearInterval(interval);
    }
  }, [upcomingEvents.length]);

  const handleBookingSubmit = (data: BookingData) => {
    setBookings([...bookings, data]);
    setSelectedDate(null);
    setSelectedSlot(null);
    setSelectedArangam(null);
  };

  const handleMGBookingSubmit = (data: BookingData) => {
    setBookings([...bookings, data]);
    setSelectedDate(null);
    setSelectedSlot(null);
  };

  const handleArangamSelect = (arangamId: string) => {
    setWorkflowArangam(arangamId);
    setIsMGWorkflow(false);
    setWorkflowDialogOpen(true);
  };

  const handleMGAuditoriumClick = () => {
    setWorkflowArangam(null);
    setIsMGWorkflow(true);
    setWorkflowDialogOpen(true);
  };

  const handleWorkflowComplete = (data: BookingData) => {
    setBookings([...bookings, data]);
    
    // Reset the calendar booking state to force re-check of availability
    setShowAvailableSlots(false);
    setAvailableArangams([]);
    
    // Refresh upcoming events
    fetchUpcomingEvents();
  };

  // Calendar booking functions
  const handleCalendarDateSelect = (date: Date | undefined) => {
    setCalendarSelectedDate(date || null);
    setShowAvailableSlots(false);
  };

  const handleNextFromCalendar = async () => {
    if (!calendarSelectedDate) return;

    setIsLoadingArangams(true);

    try {
      const dateStr = calendarSelectedDate.toLocaleDateString('en-CA');
      
      const arangamResult = await ArangamService.getActiveArangams();
      
      if (!arangamResult.success || !arangamResult.data || arangamResult.data.length === 0) {
        setAvailableArangams([]);
        setShowAvailableSlots(true);
        setIsLoadingArangams(false);
        return;
      }
      
      const arangamList = arangamResult.data.map(a => ({ id: a.id, name: a.name }));

      const slots = ['full-day', 'forenoon', 'afternoon'];

      // Run all availability checks in parallel with timeout
      const availabilityPromises = arangamList.flatMap(arangam =>
        slots.map(async slot => {
          try {
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('timeout')), 2000)
            );
            const availabilityPromise = BookingService.isSlotAvailable(dateStr, slot, arangam.name);
            const availability = await Promise.race([availabilityPromise, timeoutPromise]) as { available: boolean };
            return { arangam, slot, available: availability.available };
          } catch (error) {
            console.error('Error checking availability:', error);
            return { arangam, slot, available: true };
          }
        })
      );

      const results = await Promise.all(availabilityPromises);

      // Group results by arangam and only include available slots
      const availableList: { id: string, name: string, slots: string[] }[] = [];

      for (const arangam of arangamList) {
        const availableSlots = results
          .filter(r => r.arangam.id === arangam.id && r.available)
          .map(r => r.slot);

        // Only add arangam if it has at least one available slot
        if (availableSlots.length > 0) {
          availableList.push({ ...arangam, slots: availableSlots });
        }
      }

      // If no arangams have available slots, show empty state
      setAvailableArangams(availableList);
      setShowAvailableSlots(true);
    } catch (error) {
      console.error('Error checking availability:', error);
      setAvailableArangams([]);
      setShowAvailableSlots(true);
    } finally {
      setIsLoadingArangams(false);
    }
  };

  const handleArangamBooking = (arangamId: string, slotId: string) => {
    setIsMGWorkflow(false);
    setWorkflowArangam(arangamId);

    // Set the selected date and slot for the workflow
    setSelectedDate(calendarSelectedDate);
    setSelectedSlot(slotId);
    setWorkflowDialogOpen(true);
  };

  const isCalendarDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const getSlotDisplayName = (slotId: string) => {
    const slotNames: Record<string, string> = {
      'full-day': 'Full Day (9:00 AM - 5:00 PM)',
      'forenoon': 'Forenoon (9:00 AM - 1:00 PM)',
      'afternoon': 'Afternoon (2:00 PM - 5:00 PM)'
    };
    return slotNames[slotId] || slotId;
  };

  const downloadAllBookings = async () => {
    try {
      const result = await BookingService.getAllBookingsCombined();

      if (!result.success || !result.data || result.data.length === 0) {
        toast({
          title: "No Data",
          description: "No booking records found to download.",
          variant: "destructive"
        });
        return;
      }

      // Format data for Excel
      const excelData = result.data.map((booking) => ({
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
      }));

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      const colWidths = [
        { wch: 10 },  // Booking ID
        { wch: 25 },  // Event Name
        { wch: 20 },  // Event Type
        { wch: 30 },  // Department
        { wch: 12 },  // Year
        { wch: 25 },  // Arangam
        { wch: 15 },  // Booking Date
        { wch: 15 },  // Time Slot
        { wch: 25 },  // Coordinator Name
        { wch: 30 },  // Coordinator Email
        { wch: 15 },  // Contact Number
        { wch: 40 },  // Remarks
        { wch: 12 },  // Status
        { wch: 20 },  // Booked On
      ];
      ws['!cols'] = colWidths;

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Bookings');

      // Generate filename with current date
      const today = new Date().toISOString().split('T')[0];
      const filename = `Auditorium_Bookings_${today}.xlsx`;

      // Download file
      XLSX.writeFile(wb, filename);

      toast({
        title: "Download Successful",
        description: `${result.data.length} booking(s) downloaded as ${filename}`,
      });
    } catch (error) {
      console.error('Error downloading bookings:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download booking data. Please try again.",
        variant: "destructive"
      });
    }
  };

  const features = [
    {
      icon: Calendar,
      title: "Easy Scheduling",
      description: "Select your preferred date and time slot with our intuitive booking calendar.",
    },
    {
      icon: Shield,
      title: "Faculty Access Only",
      description: "Secure booking system exclusively for verified faculty members.",
    },
    {
      icon: Clock,
      title: "Flexible Slots",
      description: "Choose from full day, forenoon, or afternoon sessions.",
    },
    {
      icon: CheckCircle2,
      title: "Instant Confirmation",
      description: "Get immediate booking confirmation via email.",
    },
  ];

  // Show View Booked Details page
  if (showViewBookedDetails) {
    return (
      <ViewBookedDetails onBack={() => setShowViewBookedDetails(false)} />
    );
  }

  // MG Auditorium Booking Page
  if (showMGBookingPage) {
    return (
      <div className="min-h-screen bg-background">
        <Header logoSrc="/MEC-NKL1_logo.png" />
        <div className="py-8 px-4">
          <div className="max-w-7xl mx-auto">
            <button
              onClick={() => {
                setShowMGBookingPage(false);
                setSelectedDate(null);
                setSelectedSlot(null);
              }}
              className="mb-6 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded"
            >
              ← Back to Home
            </button>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="animate-slide-in-up">
                <SlotSelector
                  selectedDate={selectedDate}
                  onDateChange={(date) => setSelectedDate(date || null)}
                  selectedSlot={selectedSlot}
                  onSlotChange={setSelectedSlot}
                  bookedSlots={bookedSlots}
                  showArangam={false}
                />
              </div>
              <div className="animate-slide-in-up">
                <div className="bg-card p-6 lg:p-8 rounded-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border-2 border-gray-300">
                  <h3 className="font-display text-2xl font-bold text-primary mb-2 flex items-center gap-3">
                    <Building2 className="w-6 h-6" />
                    MG Auditorium Booking
                  </h3>
                  <div className="w-16 h-1 bg-accent rounded-full mb-6" />
                  <BookingForm
                    selectedDate={selectedDate}
                    selectedSlot={selectedSlot}
                    onSubmit={handleMGBookingSubmit}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer with Contact Details */}
        <footer className="bg-green-800 text-white py-6 px-4 mt-8">
          <div className="max-w-7xl mx-auto text-center">
            <h4 className="font-bold text-lg mb-2">Contact Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm md:text-base">
              <div className="bg-green-700 p-3 rounded-lg">
                <p className="font-semibold mb-1">Phone</p>
                <p>+91 9865584709</p>
              </div>
              <div className="bg-green-700 p-3 rounded-lg">
                <p className="font-semibold mb-1">Email</p>
                <p className="break-all">auditorium@mahendra.info</p>
              </div>
              <div className="bg-green-700 p-3 rounded-lg sm:col-span-2 lg:col-span-1">
                <p className="font-semibold mb-1">Office Hours</p>
                <p>Mon - Fri: 9:00 AM - 5:00 PM</p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header logoSrc="/MEC-NKL1_logo.png" />

      {/* Hero Section */}
      <section className="relative py-8 md:py-12 px-4 md:px-8 bg-gradient-to-b from-secondary/50 to-background overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.05),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,hsl(var(--accent)/0.08),transparent_50%)]" />

        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-primary mb-4">
              <span className="underline-animate">Welcome to Arangam booking Portal</span>
            </h2>
            <div className="w-24 h-1 bg-accent mx-auto rounded-full mb-4" />
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Reserve the college arangam for your Department Events, Seminars,
              Workshops, and Cultural programs with just a few click.
            </p>
          </div>


        </div>
      </section>

      {/* Upcoming Events Section */}
      <section className="py-2 md:py-3 px-4 md:px-8 bg-gradient-to-b from-secondary/50 to-background overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h3 className="font-display text-2xl md:text-3xl font-bold text-primary mb-4">
              Upcoming Events
            </h3>
            <div className="w-16 h-1 bg-accent mx-auto rounded-full mb-4" />
            <p className="text-muted-foreground text-lg">
              Stay updated with scheduled events across all arangams
            </p>
          </div>

          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map((event, index) => {
                  const colors = [
                    { border: 'border-blue-500', text: 'text-blue-600', bg: 'bg-blue-100', icon: 'text-blue-500' },
                    { border: 'border-green-500', text: 'text-green-600', bg: 'bg-green-100', icon: 'text-green-500' },
                    { border: 'border-purple-500', text: 'text-purple-600', bg: 'bg-purple-100', icon: 'text-purple-500' },
                    { border: 'border-orange-500', text: 'text-orange-600', bg: 'bg-orange-100', icon: 'text-orange-500' },
                    { border: 'border-red-500', text: 'text-red-600', bg: 'bg-red-100', icon: 'text-red-500' },
                    { border: 'border-indigo-500', text: 'text-indigo-600', bg: 'bg-indigo-100', icon: 'text-indigo-500' }
                  ];
                  const colorScheme = colors[index % colors.length];

                  return (
                    <div key={event.id} className={`bg-white rounded-lg shadow-md hover:shadow-xl transform transition-all duration-300 ease-out p-4 border-l-4 ${colorScheme.border} hover:border-l-6 cursor-pointer group min-w-[280px] flex-shrink-0`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-semibold ${colorScheme.text} ${colorScheme.bg} px-2 py-1 rounded-full group-hover:px-3 transition-all duration-300`}>
                          {new Date(event.booking_date).toLocaleDateString('en-IN')}
                        </span>
                        <Calendar className={`w-4 h-4 ${colorScheme.icon} group-hover:w-5 group-hover:h-5 transition-all duration-300`} />
                      </div>
                      <h4 className="font-bold text-base text-gray-800 mb-1 group-hover:text-gray-900 transition-colors duration-300">{event.event_name}</h4>
                      <p className="text-gray-600 mb-2 text-sm group-hover:text-gray-700 transition-colors duration-300">{event.department}</p>
                      <div className="flex items-center text-xs text-gray-500 group-hover:text-gray-600 transition-colors duration-300">
                        <Building2 className={`w-3 h-3 mr-1 ${colorScheme.icon} group-hover:w-4 group-hover:h-4 transition-all duration-300`} />
                        <span>{event.arangam_name || 'MG Auditorium'}</span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <span className={`text-xs font-medium ${colorScheme.text} ${colorScheme.bg} px-2 py-1 rounded`}>
                          {event.slot_type}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="w-full text-center py-8">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No upcoming events scheduled</p>
                  <p className="text-gray-400 text-sm">Book an arangam to see events here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Calendar Booking Section */}
      <section className="py-8 md:py-12 px-4 md:px-8 bg-gradient-to-r from-green-50 to-emerald-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6 md:mb-8">
            <h3 className="font-display text-xl md:text-2xl lg:text-3xl font-bold text-primary mb-4">
              Book Your Arangam
            </h3>
            <div className="w-16 h-1 bg-accent mx-auto rounded-full mb-4" />
            <p className="text-muted-foreground text-base md:text-lg">
              Select a date and discover available arangams for booking
            </p>
          </div>

          {!showAvailableSlots ? (
            <div className="bg-white p-4 md:p-8 rounded-lg shadow-lg border-2 border-gray-200">
              <div className="text-center mb-4 md:mb-6">
                <h4 className="font-semibold text-lg md:text-xl text-primary mb-2 flex items-center justify-center gap-2">
                  <Calendar className="w-5 h-5 md:w-6 md:h-6" />
                  Select Date
                </h4>
                <p className="text-muted-foreground text-sm md:text-base">Choose your preferred date to see available arangams</p>
              </div>

              <div className="flex justify-center mb-4 md:mb-6">
                <CalendarComponent
                  mode="single"
                  selected={calendarSelectedDate || undefined}
                  onSelect={handleCalendarDateSelect}
                  disabled={isCalendarDateDisabled}
                  className="rounded-lg border shadow-sm w-full max-w-sm mx-auto"
                  classNames={{
                    months: "flex flex-col space-y-4",
                    month: "space-y-4 w-full",
                    caption: "flex justify-center pt-1 relative items-center text-sm font-medium",
                    nav: "space-x-1 flex items-center",
                    nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                    nav_button_previous: "absolute left-1",
                    nav_button_next: "absolute right-1",
                    table: "w-full border-collapse",
                    head_row: "flex w-full",
                    head_cell: "text-muted-foreground rounded-md flex-1 font-normal text-xs sm:text-sm text-center p-1",
                    row: "flex w-full mt-1",
                    cell: "flex-1 text-center text-sm p-0 relative",
                    day: "h-8 w-full sm:h-9 p-0 font-normal hover:bg-accent hover:text-accent-foreground rounded-md transition-colors text-xs sm:text-sm",
                    day_selected: "bg-green-600 text-white hover:bg-green-700 hover:text-white focus:bg-green-600 focus:text-white rounded-md",
                    day_today: "bg-accent text-accent-foreground font-semibold",
                    day_outside: "text-muted-foreground opacity-50",
                    day_disabled: "text-muted-foreground opacity-50",
                  }}
                />
              </div>

              {calendarSelectedDate && (
                <div className="text-center">
                  <div className="mb-4 p-3 md:p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-green-800 font-medium text-sm md:text-base">
                      Selected Date: {calendarSelectedDate.toLocaleDateString('en-IN', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <button
                    onClick={handleNextFromCalendar}
                    disabled={!calendarSelectedDate || isLoadingArangams}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 mx-auto"
                  >
                    {isLoadingArangams ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Loading...
                      </>
                    ) : (
                      'Next'
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white p-4 md:p-8 rounded-lg shadow-lg border-2 border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6 gap-4">
                <div>
                  <h4 className="font-semibold text-lg md:text-xl text-primary mb-2">
                    Available Arangams
                  </h4>
                  <p className="text-muted-foreground text-sm md:text-base">
                    {calendarSelectedDate?.toLocaleDateString('en-IN', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAvailableSlots(false);
                    setAvailableArangams([]);
                  }}
                  className="text-sm"
                >
                  ← Back to Calendar
                </Button>
              </div>

              {availableArangams.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                  {availableArangams.map((arangam) => (
                    <div key={arangam.id} className="border-2 border-gray-200 rounded-lg p-4 md:p-6 hover:border-green-300 hover:shadow-md transition-all">
                      <div className="flex items-center gap-3 mb-4">
                        <Building2 className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
                        <h5 className="font-bold text-base md:text-lg text-gray-800">{arangam.name}</h5>
                      </div>

                      <div className="space-y-3">
                        <p className="text-xs md:text-sm font-medium text-gray-600 mb-2">Available Slots:</p>
                        {arangam.slots.map((slot) => (
                          <button
                            key={slot}
                            onClick={() => handleArangamBooking(arangam.id, slot)}
                            className="w-full p-2 md:p-3 text-left border border-green-200 rounded-lg hover:bg-green-50 hover:border-green-400 transition-all group"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-gray-700 group-hover:text-green-700 font-medium text-sm md:text-base">
                                {getSlotDisplayName(slot)}
                              </span>
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full group-hover:bg-green-200">
                                Available
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 md:py-8">
                  <Building2 className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-4" />
                  <h5 className="text-base md:text-lg font-semibold text-gray-600 mb-2">No Available Arangams</h5>
                  <p className="text-gray-500 text-sm md:text-base mb-4">All arangams are booked for the selected date. Please choose a different date.</p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAvailableSlots(false);
                      setAvailableArangams([]);
                    }}
                    className="text-sm"
                  >
                    Select Different Date
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Main Booking Section */}
      <section className="py-12 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Action Buttons */}
          <div className="grid grid-cols-1 gap-4 max-w-md mx-auto px-4">
            <button
              onClick={() => window.location.href = '/view-bookings'}
              className="group relative px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-base font-bold shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0 border-2 border-blue-500 hover:border-blue-300"
            >
              {/* Ripple effect background */}
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 group-active:opacity-20 transition-opacity duration-200 rounded-lg"></div>

              {/* Side accent bars */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-yellow-400 rounded-r-full transform scale-y-0 group-hover:scale-y-100 transition-transform duration-300"></div>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-yellow-400 rounded-l-full transform scale-y-0 group-hover:scale-y-100 transition-transform duration-300"></div>

              <span className="relative z-10 flex items-center justify-center gap-2">
                <Eye className="w-5 h-5" />
                Booked Details
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Booking Workflow Dialog */}
      <BookingWorkflowDialog
        open={workflowDialogOpen}
        onOpenChange={setWorkflowDialogOpen}
        selectedArangam={workflowArangam}
        isMGAuditorium={isMGWorkflow}
        onBookingComplete={handleWorkflowComplete}
        preSelectedDate={calendarSelectedDate}
        preSelectedSlot={selectedSlot}
      />

      {/* Footer */}
      <footer className="bg-green-800 text-white py-8 px-4 md:px-8 border-4 border-orange-500 hover:border-orange-600 transition-colors duration-300">
        <div className="max-w-7xl mx-auto text-center">
          <h4 className="font-bold text-lg mb-4">Contact Details</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 text-sm md:text-base mb-6">
            <div className="bg-green-700 p-4 rounded-lg">
              <p className="font-semibold mb-2">Phone</p>
              <p>+91  9865584709</p>
            </div>
            <div className="bg-green-700 p-4 rounded-lg">
              <p className="font-semibold mb-2">Email</p>
              <p className="break-all">mecarangambooking@gmail.com</p>
            </div>
            <div className="bg-green-700 p-4 rounded-lg sm:col-span-2 lg:col-span-1">
              <h4 className="font-bold text-base mb-2">Developed By</h4>
              <p className="text-sm">M Adithya</p>
              <p className="text-sm">V Akash</p>
              <p className="text-sm">K Ganeshwar</p>
              <p className="text-xs mt-1">Department of Artificial Intelligence <br /> & <br /> Data Science 2024-2028</p>
            </div>
          </div>
          <p className="text-sm opacity-70">
            © {new Date().getFullYear()} Mahendra Engineering College. <br /> All rights reserved.
          </p>
          <p className="text-xs opacity-50 mt-2">
            For technical support contact us
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

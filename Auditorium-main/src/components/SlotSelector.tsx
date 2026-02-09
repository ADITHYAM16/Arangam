import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Sun, Moon, Sunrise, Clock, Building2 } from "lucide-react";
import { BookingService } from "@/services/bookingService";

interface SlotSelectorProps {
  selectedDate: Date | null;
  onDateChange: (date: Date | undefined) => void;
  selectedSlot: string | null;
  onSlotChange: (slot: string) => void;
  bookedSlots?: { date: string; slot: string }[];
  selectedArangam?: string | null;
  onArangamChange?: (arangam: string) => void;
  onArangamSelect?: (arangam: string) => void; // New prop for triggering booking workflow
  showArangam?: boolean;
}

const timeSlots = [
  {
    id: "full-day",
    name: "Full Day",
    time: "9:00 AM - 5:00 PM",
    icon: Sun,
    color: "from-amber-400 to-orange-500",
  },
  {
    id: "forenoon",
    name: "Forenoon",
    time: "9:00 AM - 1:00 PM",
    icon: Sunrise,
    color: "from-yellow-400 to-amber-500",
  },
  {
    id: "afternoon",
    name: "Afternoon",
    time: "2:00 PM - 5:00 PM",
    icon: Moon,
    color: "from-blue-400 to-indigo-500",
  },
];

const SlotSelector = ({
  selectedDate,
  onDateChange,
  selectedSlot,
  onSlotChange,
  bookedSlots = [],
  selectedArangam,
  onArangamChange,
  onArangamSelect,
  showArangam = true,
}: SlotSelectorProps) => {
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);
  const [hoveredArangam, setHoveredArangam] = useState<string | null>(null);
  const [realTimeBookedSlots, setRealTimeBookedSlots] = useState<{ date: string; slot: string; arangam?: string }[]>([]);

  // Fetch real-time booked slots when date or arangam changes
  useEffect(() => {
    if (selectedDate) {
      fetchBookedSlots();
    } else {
      setRealTimeBookedSlots([]);
    }
  }, [selectedDate, selectedArangam]);

  const fetchBookedSlots = async () => {
    if (!selectedDate) return;

    try {
      const dateStr = selectedDate.toLocaleDateString('en-CA');
      const arangamName = getArangamName(selectedArangam);

      // Only fetch if we have a valid date
      const slots = ['full-day', 'forenoon', 'afternoon'];
      const bookedSlotsData: { date: string; slot: string; arangam?: string }[] = [];

      for (const slot of slots) {
        const result = await BookingService.getBookingsByDateAndSlot(dateStr, slot, arangamName || undefined);
        if (result.success && result.data && result.data.length > 0) {
          bookedSlotsData.push({ date: dateStr, slot, arangam: arangamName || undefined });
        }
      }

      setRealTimeBookedSlots(bookedSlotsData);
    } catch (error) {
      console.error('Error fetching booked slots:', error);
      // Don't set error state, just use empty array
      setRealTimeBookedSlots([]);
    }
  };

  const getArangamName = (id: string | null | undefined) => {
    if (!id) return null;
    const names: Record<string, string> = {
      "arangam-1": "VOC Arangam",
      "arangam-2": "Thiruvalluvar Arangam",
      "arangam-3": "Bharathiyar Arangam",
      "arangam-4": "Vivekananda Arangam",
      "arangam-5": "Ramakrishna Arangam"
    };
    return names[id] || id;
  };

  const isSlotDirectlyBooked = (slotId: string) => {
    if (!selectedDate) return false;

    const dateStr = selectedDate.toLocaleDateString('en-CA');

    // Check legacy booked slots first
    const isLegacyBooked = bookedSlots.some(
      (booking) => booking.date === dateStr && booking.slot === slotId
    );

    if (isLegacyBooked) return true;

    // Check real-time booked slots
    if (showArangam && selectedArangam) {
      const arangamName = getArangamName(selectedArangam);
      return realTimeBookedSlots.some(
        (booking) => booking.date === dateStr && booking.slot === slotId && booking.arangam === arangamName
      );
    } else if (!showArangam) {
      // For MG Auditorium (no arangam)
      return realTimeBookedSlots.some(
        (booking) => booking.date === dateStr && booking.slot === slotId
      );
    }

    return false;
  };

  const isSlotConflicted = (slotId: string) => {
    if (!selectedDate) return false;

    const dateStr = selectedDate.toLocaleDateString('en-CA');
    const arangamName = showArangam && selectedArangam ? getArangamName(selectedArangam) : null;

    if (slotId === 'full-day') {
      // Full-day is conflicted if forenoon OR afternoon is booked
      const forenoonBooked = realTimeBookedSlots.some(
        (booking) => booking.date === dateStr && booking.slot === 'forenoon' &&
          (showArangam ? booking.arangam === arangamName : true)
      );
      const afternoonBooked = realTimeBookedSlots.some(
        (booking) => booking.date === dateStr && booking.slot === 'afternoon' &&
          (showArangam ? booking.arangam === arangamName : true)
      );
      return forenoonBooked || afternoonBooked;
    } else if (slotId === 'forenoon' || slotId === 'afternoon') {
      // Forenoon/Afternoon is conflicted if full-day is booked
      return realTimeBookedSlots.some(
        (booking) => booking.date === dateStr && booking.slot === 'full-day' &&
          (showArangam ? booking.arangam === arangamName : true)
      );
    }

    return false;
  };

  const isSlotBooked = (slotId: string) => {
    return isSlotDirectlyBooked(slotId) || isSlotConflicted(slotId);
  };

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  return (
    <div className="space-y-6">
      {/* Arangam Selection Section */}
      {showArangam && (
        <div className="bg-card p-6 rounded-lg hover:shadow-xl hover:scale-[1.02] active:bg-gray-100 transition-all duration-300 border-2 border-gray-300">
          <h3 className="font-display text-xl font-semibold text-primary mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Select Arangam
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map((num) => {
              const arangamId = `arangam-${num}`;
              const isSelected = selectedArangam === arangamId;
              const isHovered = hoveredArangam === arangamId;
              const arangamNames = {
                1: "VOC Arangam",
                2: "Thiruvalluvar Arangam",
                3: "Bharathiyar Arangam",
                4: "Vivekananda Arangam",
                5: "Ramakrishna Arangam"
              };
              const arangamName = arangamNames[num as keyof typeof arangamNames];

              return (
                <div
                  key={arangamId}
                  className={`relative p-4 rounded-lg border-2 transition-all duration-300 text-center flex flex-col items-center justify-center min-h-[100px] w-full gap-2 ${isSelected
                    ? "border-green-500 bg-green-50 shadow-lg"
                    : "border-border bg-card hover:border-green-300 hover:shadow-md"
                    }`}
                >
                  <div className={`text-base font-bold transition-colors duration-300 ${isSelected ? "text-green-700" : "text-gray-600"
                    }`}>
                    {arangamName}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onArangamSelect?.(arangamId);
                    }}
                    className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-md transition-colors duration-200"
                  >
                    Select Arangam
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Calendar Section - Only shown for MG Auditorium */}
      {!showArangam && (
        <>
          <div className="bg-card p-6 rounded-lg hover:shadow-xl hover:scale-[1.02] active:bg-gray-100 transition-all duration-300 border-2 border-gray-300">
            <h3 className="font-display text-xl font-semibold text-primary mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Select Date
            </h3>
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate || undefined}
                onSelect={onDateChange}
                disabled={isDateDisabled}
                className="rounded-lg border shadow-card pointer-events-auto w-fit"
                classNames={{
                  months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                  month: "space-y-4",
                  caption: "flex justify-center pt-1 relative items-center text-sm font-medium",
                  caption_label: "text-sm font-medium",
                  nav: "space-x-1 flex items-center",
                  nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                  nav_button_previous: "absolute left-1",
                  nav_button_next: "absolute right-1",
                  table: "w-fit border-collapse",
                  head_row: "flex",
                  head_cell: "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem] uppercase",
                  row: "flex mt-1",
                  cell: "text-center text-sm p-0 relative",
                  day: "h-8 w-8 p-0 font-normal hover:bg-accent hover:text-accent-foreground rounded-md transition-colors",
                  day_selected: "bg-blue-600 text-white hover:bg-blue-700 hover:text-white focus:bg-blue-600 focus:text-white rounded-md",
                  day_today: "bg-accent text-accent-foreground font-semibold",
                  day_outside: "text-muted-foreground opacity-50",
                  day_disabled: "text-muted-foreground opacity-50",
                }}
              />
            </div>
          </div>

          {/* Time Slot Section */}
          <div className="bg-card p-6 rounded-lg hover:shadow-xl hover:scale-[1.02] active:bg-gray-100 transition-all duration-300 border-2 border-gray-300">
            <h3 className="font-display text-xl font-semibold text-primary mb-4 flex items-center gap-2">
              <Sun className="w-5 h-5" />
              Select Time Slot
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {timeSlots.map((slot) => {
                const Icon = slot.icon;
                const isDirectlyBooked = isSlotDirectlyBooked(slot.id);
                const isConflicted = isSlotConflicted(slot.id);
                const isDisabled = isDirectlyBooked || isConflicted;
                const isSelected = selectedSlot === slot.id;
                const isHovered = hoveredSlot === slot.id;

                return (
                  <button
                    key={slot.id}
                    onClick={() => !isDisabled && onSlotChange(slot.id)}
                    onMouseEnter={() => setHoveredSlot(slot.id)}
                    onMouseLeave={() => setHoveredSlot(null)}
                    disabled={isDisabled}
                    className={`
                      relative p-5 rounded-xl border-2 transition-all duration-300
                      ${isDisabled
                        ? "border-gray-300 bg-gray-100 cursor-not-allowed opacity-60"
                        : isSelected
                          ? "border-accent bg-accent/10 shadow-accent scale-[1.02]"
                          : "border-border bg-card hover:border-primary hover:shadow-card-hover hover:scale-[1.01]"
                      }
                    `}
                  >
                    {/* Background Gradient */}
                    <div
                      className={`
                        absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300
                        bg-gradient-to-r ${slot.color}
                        ${(isHovered || isSelected) && !isDisabled ? "opacity-10" : ""}
                      `}
                    />

                    <div className="relative flex items-center gap-4">
                      <div className={`
                        p-3 rounded-full transition-all duration-300
                        ${isSelected
                          ? "bg-accent text-accent-foreground shadow-accent"
                          : isDisabled
                            ? "bg-gray-200 text-gray-400"
                            : "bg-primary/10 text-primary"
                        }
                      `}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 text-left">
                        <h4 className={`font-semibold text-lg ${isSelected ? "text-accent" : isDisabled ? "text-gray-400" : "text-foreground"}`}>
                          {slot.name}
                        </h4>
                      </div>
                      {isDirectlyBooked && (
                        <span className="px-3 py-1 bg-destructive/20 text-destructive text-xs font-medium rounded-full">
                          Booked
                        </span>
                      )}
                      {isSelected && !isDisabled && (
                        <span className="px-3 py-1 bg-accent text-accent-foreground text-xs font-medium rounded-full animate-pulse-glow">
                          Selected
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 justify-center text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2 border-border bg-card"></div>
              <span className="text-muted-foreground">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2 border-accent bg-accent/20"></div>
              <span className="text-muted-foreground">Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2 border-destructive/30 bg-destructive/10"></div>
              <span className="text-muted-foreground">Booked</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SlotSelector;

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Calendar as CalendarIcon, Clock, CheckCircle, User, Mail, Phone, FileText, Users, ChevronRight, ChevronLeft } from "lucide-react";
import { BookingService } from "@/services/bookingService";
import { ArangamService } from "@/services/arangamService";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { BookingData } from "./BookingForm";

interface BookingWorkflowDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedArangam?: string | null;
    onBookingComplete?: (data: BookingData) => void;
    isMGAuditorium?: boolean;
    preSelectedDate?: Date | null;
    preSelectedSlot?: string | null;
}

const departments = [
    "Aeronautical Engineering",
    "Aerospace Engineering",
    "Agricultural Engineering",
    "Artificial Intelligence and Data Science",
    "Chemical Engineering",
    "Civil Engineering",
    "Computer Science and Engineering",
    "Cyber Security",
    "Electrical and Electronics Engineering",
    "Electronics and Communication Engineering",
    "Food Technology",
    "Information Technology",
    "Mechanical Engineering",
    "Mechatronics Engineering",
    "Pharmaceutical Technology",
    "Chemistry",
    "English",
    "Mathematics",
    "Physics",
    "MBA",
    "MCA",
    "School",
    "College",
    "Other",
    "Alumini Meet",
    "Sports",
    "Convocation",

];

const eventTypes = [
    "Technical Symposium",
    "Cultural Event",
    "Workshop",
    "Seminar",
    "Guest Lecture",
    "Annual Day",
    "Convocation",
    "Alumni Meet",
    "Sports Event",
    "Other",
];

const years = ["I Year", "II Year", "III Year", "IV Year", "All Years", "Faculty Only"];

const timeSlots = [
    { id: "full-day", name: "Full Day", time: "9:00 AM - 5:00 PM" },
    { id: "forenoon", name: "Forenoon", time: "9:00 AM - 1:00 PM" },
    { id: "afternoon", name: "Afternoon", time: "2:00 PM - 5:00 PM" },
];

const BookingWorkflowDialog = ({
    open,
    onOpenChange,
    selectedArangam,
    onBookingComplete,
    isMGAuditorium = false,
    preSelectedDate = null,
    preSelectedSlot = null,
}: BookingWorkflowDialogProps) => {
    const { user } = useAuth();
    const [currentStep, setCurrentStep] = useState(1);
    const [totalSteps] = useState(isMGAuditorium ? 4 : 5);

    // Step data
    const [arangam, setArangam] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [bookedSlots, setBookedSlots] = useState<{ date: string; slot: string; arangam?: string }[]>([]);
    const [arangamsList, setArangamsList] = useState<{ id: string; name: string }[]>([]);

    // Form data
    const [formData, setFormData] = useState({
        eventName: "",
        eventType: "",
        department: "",
        year: "",
        coordinatorName: "",
        coordinatorEmail: "",
        contactNumber: "",
        remarks: "",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showEventTypeSuggestions, setShowEventTypeSuggestions] = useState(false);
    const [showDepartmentSuggestions, setShowDepartmentSuggestions] = useState(false);
    const [filteredEventTypes, setFilteredEventTypes] = useState<string[]>([]);
    const [filteredDepartments, setFilteredDepartments] = useState<string[]>([]);

    // Initialize arangam and user data
    useEffect(() => {
        ArangamService.getActiveArangams().then(result => {
            if (result.success && result.data) setArangamsList(result.data);
        });
    }, []);

    useEffect(() => {
        if (open) {
            setArangam(selectedArangam || null);
            if (user) {
                setFormData(prev => ({
                    ...prev,
                    coordinatorName: user.name,
                    coordinatorEmail: user.email,
                }));
            }
            
            // Set pre-selected date and slot if provided
            if (preSelectedDate) {
                setSelectedDate(preSelectedDate);
            }
            if (preSelectedSlot) {
                setSelectedSlot(preSelectedSlot);
            }
            
            // Start at appropriate step - skip to summary if date and slot are pre-selected
            if (preSelectedDate && preSelectedSlot) {
                setCurrentStep(isMGAuditorium ? 3 : 4); // Skip to summary step
            } else {
                setCurrentStep(isMGAuditorium ? 1 : 1);
            }
        }
    }, [open, selectedArangam, user, isMGAuditorium, preSelectedDate, preSelectedSlot]);

    // Fetch booked slots when date changes
    useEffect(() => {
        if (selectedDate) {
            fetchBookedSlots();
        }
    }, [selectedDate, arangam]);

    // Realtime subscription to refresh slot availability
    useEffect(() => {
        if (!open) return;
        const unsubscribe = BookingService.subscribeToBookings(() => {
            if (selectedDate) fetchBookedSlots();
        });
        return () => unsubscribe();
    }, [open, selectedDate, arangam]);

    const fetchBookedSlots = async () => {
        if (!selectedDate) return;

        try {
            const dateStr = selectedDate.toLocaleDateString('en-CA');
            const arangamName = getArangamName(arangam);

            const slots = ['full-day', 'forenoon', 'afternoon'];
            const bookedSlotsData: { date: string; slot: string; arangam?: string }[] = [];

            for (const slot of slots) {
                const result = isMGAuditorium
                    ? await BookingService.getMGBookingsByDateAndSlot(dateStr, slot)
                    : await BookingService.getBookingsByDateAndSlot(dateStr, slot, arangamName || undefined);
                if (result.success && result.data && result.data.length > 0) {
                    bookedSlotsData.push({ date: dateStr, slot, arangam: arangamName || undefined });
                }
            }

            setBookedSlots(bookedSlotsData);
        } catch (error) {
            console.error('Error fetching booked slots:', error);
            setBookedSlots([]);
        }
    };

    const getArangamName = (id: string | null | undefined) => {
        if (!id) return null;
        // Try dynamic arangams list first
        const found = arangamsList.find(a => a.id === id);
        if (found) return found.name;
        // fallback
        const names: Record<string, string> = {
            "arangam-1": "VOC Arangam",
            "arangam-2": "Thiruvalluvar Arangam",
            "arangam-3": "Bharathiyar Arangam",
            "arangam-4": "Vivekananda Arangam",
            "arangam-5": "Ramakrishna Arangam"
        };
        return names[id] || id;
    };

    const isSlotBooked = (slotId: string) => {
        if (!selectedDate) return false;
        const dateStr = selectedDate.toLocaleDateString('en-CA');
        const arangamName = getArangamName(arangam);

        // Check if directly booked
        const directlyBooked = bookedSlots.some(
            (booking) => booking.date === dateStr && booking.slot === slotId &&
                (isMGAuditorium ? true : booking.arangam === arangamName)
        );

        if (directlyBooked) return true;

        // Check conflicts
        if (slotId === 'full-day') {
            return bookedSlots.some(
                (booking) => booking.date === dateStr &&
                    (booking.slot === 'forenoon' || booking.slot === 'afternoon') &&
                    (isMGAuditorium ? true : booking.arangam === arangamName)
            );
        } else {
            return bookedSlots.some(
                (booking) => booking.date === dateStr && booking.slot === 'full-day' &&
                    (isMGAuditorium ? true : booking.arangam === arangamName)
            );
        }
    };

    const isDateDisabled = (date: Date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today;
    };

    const validateEmail = (email: string) => {
        return email.endsWith("@mahendra.info");
    };

    const validatePhone = (phone: string) => {
        return /^[0-9]{10}$/.test(phone);
    };

    const handleEventTypeChange = (value: string) => {
        setFormData({ ...formData, eventType: value });
        if (value.trim()) {
            const filtered = eventTypes.filter(type =>
                type.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredEventTypes(filtered);
            setShowEventTypeSuggestions(filtered.length > 0);
        } else {
            setShowEventTypeSuggestions(false);
        }
    };

    const handleDepartmentChange = (value: string) => {
        setFormData({ ...formData, department: value });
        if (value.trim()) {
            const filtered = departments.filter(dept =>
                dept.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredDepartments(filtered);
            setShowDepartmentSuggestions(filtered.length > 0);
        } else {
            setShowDepartmentSuggestions(false);
        }
    };

    const canProceedToNext = () => {
        const stepIndex = isMGAuditorium ? currentStep + 1 : currentStep; // Adjust for MG skipping arangam

        switch (stepIndex) {
            case 1: // Arangam
                return !!arangam;
            case 2: // Date
                return !!selectedDate;
            case 3: // Time slot
                return !!selectedSlot;
            case 4: // Summary (always can proceed)
                return true;
            case 5: // Final form (always can proceed)
                return true;
            default:
                return false;
        }
    };

    const handleNext = () => {
        if (canProceedToNext() && currentStep < totalSteps) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSubmit = async () => {
        const newErrors: Record<string, string> = {};

        if (!selectedDate) newErrors.date = "Please select a date";
        if (!selectedSlot) newErrors.slot = "Please select a time slot";
        if (!formData.eventName.trim()) newErrors.eventName = "Event name is required";
        if (!formData.eventType) newErrors.eventType = "Event type is required";
        if (!formData.department) newErrors.department = "Department is required";
        if (!formData.year) newErrors.year = "Year is required";
        if (!formData.coordinatorName.trim()) newErrors.coordinatorName = "Coordinator name is required";
        if (!formData.coordinatorEmail.trim()) {
            newErrors.coordinatorEmail = "Email is required";
        } else if (!validateEmail(formData.coordinatorEmail)) {
            newErrors.coordinatorEmail = "Only @mahendra.info emails are allowed";
        }
        if (!formData.contactNumber.trim()) {
            newErrors.contactNumber = "Contact number is required";
        } else if (!validatePhone(formData.contactNumber)) {
            newErrors.contactNumber = "Enter a valid 10-digit phone number";
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0 && selectedDate && selectedSlot) {
            // Check slot availability before booking
            const dateStr = selectedDate.toLocaleDateString('en-CA');
            const arangamName = getArangamName(arangam);

            const availability = isMGAuditorium
                ? await BookingService.isMGSlotAvailable(dateStr, selectedSlot)
                : await BookingService.isSlotAvailable(dateStr, selectedSlot, arangamName || undefined);

            if (!availability.available) {
                toast({
                    title: "Slot Not Available",
                    description: "This time slot is already booked. Please select a different slot.",
                    variant: "destructive"
                });
                return;
            }

            const bookingData: BookingData = {
                date: selectedDate,
                slotType: selectedSlot,
                arangamName: arangamName,
                ...formData,
            };

            // Save to Supabase
            const result = isMGAuditorium
                ? await BookingService.createMGAuditoriumBooking(bookingData)
                : await BookingService.createBooking(bookingData);

            if (result.success) {
                toast({
                    title: "Arangam has booked successfully! 🎉",
                    description: "To download details visit View Booked Details.",
                    duration: 5000,
                });

                // Call the callback first
                onBookingComplete?.(bookingData);

                // Reset and close
                resetDialog();
                onOpenChange(false);
            } else {
                toast({
                    title: "Booking Failed",
                    description: result.error || "Failed to submit booking request. Please try again.",
                    variant: "destructive"
                });
            }
        }
    };

    const resetDialog = () => {
        setCurrentStep(1);
        setSelectedDate(null);
        setSelectedSlot(null);
        setFormData({
            eventName: "",
            eventType: "",
            department: "",
            year: "",
            coordinatorName: user?.name || "",
            coordinatorEmail: user?.email || "",
            contactNumber: "",
            remarks: "",
        });
        setErrors({});
        setBookedSlots([]);
    };

    const getStepTitle = () => {
        const stepIndex = isMGAuditorium ? currentStep + 1 : currentStep;

        switch (stepIndex) {
            case 1: return "Select Arangam";
            case 2: return "Select Date";
            case 3: return "Select Time Slot";
            case 4: return "Review Booking Details";
            case 5: return "Event & Coordinator Details";
            default: return "";
        }
    };

    const renderStepContent = () => {
        const stepIndex = isMGAuditorium ? currentStep + 1 : currentStep;

        switch (stepIndex) {
            case 1: // Arangam (only for non-MG)
                return (
                    <div className="space-y-4">
                        <div className="p-4 bg-green-50 rounded-lg border-2 border-green-500">
                            <div className="flex items-center gap-2">
                                <Building2 className="w-6 h-6 text-green-600" />
                                <div>
                                    <p className="font-semibold text-green-900">Selected Arangam</p>
                                    <p className="text-lg font-bold text-green-700">{getArangamName(arangam)}</p>
                                </div>
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground">Click "Next" to proceed with date selection.</p>
                    </div>
                );

            case 2: // Date
                return (
                    <div className="space-y-4">
                        <div className="flex justify-center">
                            <Calendar
                                mode="single"
                                selected={selectedDate || undefined}
                                onSelect={(date) => setSelectedDate(date || null)}
                                disabled={isDateDisabled}
                                className="rounded-lg border shadow-sm w-fit"
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
                        {selectedDate && (
                            <div className="p-3 bg-secondary/50 rounded-lg border-l-4 border-l-green-500">
                                <div className="flex items-center gap-2 text-sm">
                                    <CalendarIcon className="w-4 h-4 text-green-600" />
                                    <span className="font-medium">Selected:</span>
                                    <span className="text-green-600 font-semibold">
                                        {selectedDate.toLocaleDateString('en-IN', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                );

            case 3: // Time Slot
                return (
                    <div className="space-y-4">
                        {timeSlots.map((slot) => {
                            const isBooked = isSlotBooked(slot.id);
                            const isSelected = selectedSlot === slot.id;

                            return (
                                <button
                                    key={slot.id}
                                    onClick={() => !isBooked && setSelectedSlot(slot.id)}
                                    disabled={isBooked}
                                    className={`w-full p-4 rounded-lg border-2 transition-all duration-300 ${isBooked
                                        ? "border-gray-300 bg-gray-100 cursor-not-allowed opacity-60"
                                        : isSelected
                                            ? "border-green-500 bg-green-50 shadow-lg"
                                            : "border-border bg-card hover:border-green-300 hover:shadow-md"
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-full ${isSelected ? "bg-green-500 text-white" : isBooked ? "bg-gray-300" : "bg-primary/10 text-primary"
                                            }`}>
                                            <Clock className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <h4 className={`font-semibold ${isSelected ? "text-green-700" : isBooked ? "text-gray-400" : ""}`}>
                                                {slot.name}
                                            </h4>
                                            <p className="text-sm text-muted-foreground">{slot.time}</p>
                                        </div>
                                        {isBooked && (
                                            <span className="px-3 py-1 bg-destructive/20 text-destructive text-xs font-medium rounded-full">
                                                Booked
                                            </span>
                                        )}
                                        {isSelected && !isBooked && (
                                            <span className="px-3 py-1 bg-green-500 text-white text-xs font-medium rounded-full">
                                                Selected
                                            </span>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                );

            case 4: // Summary
                return (
                    <div className="space-y-4">
                        <div className="p-4 bg-secondary/50 rounded-lg border-2 border-gray-300 space-y-3">
                            {!isMGAuditorium && (
                                <div className="flex items-center gap-2">
                                    <Building2 className="w-5 h-5 text-green-600" />
                                    <span className="font-medium">Arangam:</span>
                                    <span className="text-green-600 font-bold">{getArangamName(arangam)}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <CalendarIcon className="w-5 h-5 text-primary" />
                                <span className="font-medium">Date:</span>
                                <span className="text-primary font-semibold">
                                    {selectedDate?.toLocaleDateString('en-IN', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-accent" />
                                <span className="font-medium">Time Slot:</span>
                                <span className="text-accent font-semibold">
                                    {timeSlots.find(s => s.id === selectedSlot)?.name} ({timeSlots.find(s => s.id === selectedSlot)?.time})
                                </span>
                            </div>
                        </div>
                        <div className="flex items-start gap-2 p-3 bg-blue-50 border-l-4 border-l-blue-500 rounded">
                            <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                            <p className="text-sm text-blue-900">
                                Please review your selections. Click "Next" to proceed with event and coordinator details.
                            </p>
                        </div>
                    </div>
                );

            case 5: // Form
                return (
                    <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                        {/* Event Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border-2 border-gray-300 rounded-lg">
                            <div className="space-y-2">
                                <Label htmlFor="eventName" className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-primary" />
                                    Event Name *
                                </Label>
                                <Input
                                    id="eventName"
                                    placeholder="Enter event name"
                                    value={formData.eventName}
                                    onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                                />
                                {errors.eventName && <p className="text-destructive text-xs">{errors.eventName}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="eventType" className="flex items-center gap-2">
                                    <CalendarIcon className="w-4 h-4 text-primary" />
                                    Event Type *
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="eventType"
                                        placeholder="Enter or select event type"
                                        value={formData.eventType}
                                        onChange={(e) => handleEventTypeChange(e.target.value)}
                                        onFocus={() => {
                                            if (formData.eventType.trim()) {
                                                const filtered = eventTypes.filter(type =>
                                                    type.toLowerCase().includes(formData.eventType.toLowerCase())
                                                );
                                                setFilteredEventTypes(filtered);
                                                setShowEventTypeSuggestions(filtered.length > 0);
                                            }
                                        }}
                                        onBlur={() => setTimeout(() => setShowEventTypeSuggestions(false), 200)}
                                    />
                                    {showEventTypeSuggestions && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                                            {filteredEventTypes.map((type, index) => (
                                                <div
                                                    key={index}
                                                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                                    onClick={() => {
                                                        setFormData({ ...formData, eventType: type });
                                                        setShowEventTypeSuggestions(false);
                                                    }}
                                                >
                                                    {type}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {errors.eventType && <p className="text-destructive text-xs">{errors.eventType}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="department" className="flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-primary" />
                                    Department/College/School *
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="department"
                                        placeholder="Enter or select department"
                                        value={formData.department}
                                        onChange={(e) => handleDepartmentChange(e.target.value)}
                                        onFocus={() => {
                                            if (formData.department.trim()) {
                                                const filtered = departments.filter(dept =>
                                                    dept.toLowerCase().includes(formData.department.toLowerCase())
                                                );
                                                setFilteredDepartments(filtered);
                                                setShowDepartmentSuggestions(filtered.length > 0);
                                            }
                                        }}
                                        onBlur={() => setTimeout(() => setShowDepartmentSuggestions(false), 200)}
                                    />
                                    {showDepartmentSuggestions && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                                            {filteredDepartments.map((dept, index) => (
                                                <div
                                                    key={index}
                                                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                                    onClick={() => {
                                                        setFormData({ ...formData, department: dept });
                                                        setShowDepartmentSuggestions(false);
                                                    }}
                                                >
                                                    {dept}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {errors.department && <p className="text-destructive text-xs">{errors.department}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="year" className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-primary" />
                                    Year *
                                </Label>
                                <Select
                                    value={formData.year}
                                    onValueChange={(value) => setFormData({ ...formData, year: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select year" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {years.map((year) => (
                                            <SelectItem key={year} value={year}>{year}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.year && <p className="text-destructive text-xs">{errors.year}</p>}
                            </div>
                        </div>

                        {/* Coordinator Details */}
                        <div className="p-4 border-2 border-gray-300 rounded-lg">
                            <h3 className="font-semibold text-lg text-primary mb-4 flex items-center gap-2">
                                <User className="w-5 h-5" />
                                Event Coordinator Details
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="coordinatorName" className="flex items-center gap-2">
                                        <User className="w-4 h-4 text-primary" />
                                        Coordinator Name *
                                    </Label>
                                    <Input
                                        id="coordinatorName"
                                        placeholder="Enter coordinator name"
                                        value={formData.coordinatorName}
                                        onChange={(e) => setFormData({ ...formData, coordinatorName: e.target.value })}
                                    />
                                    {errors.coordinatorName && <p className="text-destructive text-xs">{errors.coordinatorName}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="coordinatorEmail" className="flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-primary" />
                                        Faculty Email *
                                        <span className="text-xs text-muted-foreground">(@mahendra.info only)</span>
                                    </Label>
                                    <Input
                                        id="coordinatorEmail"
                                        type="email"
                                        placeholder="faculty@mahendra.info"
                                        value={formData.coordinatorEmail}
                                        onChange={(e) => setFormData({ ...formData, coordinatorEmail: e.target.value })}
                                    />
                                    {errors.coordinatorEmail && <p className="text-destructive text-xs">{errors.coordinatorEmail}</p>}
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="contactNumber" className="flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-primary" />
                                        Contact Number *
                                    </Label>
                                    <Input
                                        id="contactNumber"
                                        type="tel"
                                        placeholder="10-digit mobile number"
                                        value={formData.contactNumber}
                                        onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                                    />
                                    {errors.contactNumber && <p className="text-destructive text-xs">{errors.contactNumber}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Remarks */}
                        <div className="space-y-2 p-4 border-2 border-gray-300 rounded-lg">
                            <Label htmlFor="remarks" className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-primary" />
                                Remarks (Optional)
                            </Label>
                            <Textarea
                                id="remarks"
                                placeholder="Any special requirements or additional information..."
                                value={formData.remarks}
                                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                                className="min-h-[100px]"
                            />
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-primary flex items-center gap-2">
                        {getStepTitle()}
                    </DialogTitle>
                    <DialogDescription>
                        Step {currentStep} of {totalSteps}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto py-4">
                    {renderStepContent()}
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between pt-4 border-t">
                    <Button
                        variant="outline"
                        onClick={handleBack}
                        disabled={currentStep === 1}
                        className="flex items-center gap-2"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Back
                    </Button>

                    {currentStep < totalSteps ? (
                        <Button
                            onClick={handleNext}
                            disabled={!canProceedToNext()}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                        >
                            Next
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            className="bg-green-600 hover:bg-green-700 font-semibold"
                        >
                            Submit Booking Request
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default BookingWorkflowDialog;

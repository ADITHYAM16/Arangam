import { useState, useEffect } from "react";
import { Calendar, Clock, User, Phone, Building, FileText, Mail, Users, CalendarDays, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { BookingService } from "@/services/bookingService";

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
  "Convocation",
  "Sports",
  "Alumini Meet",
];

const eventNames = [
  "Annual Day",
  "Technical Symposium",
  "Cultural Fest",
  "Workshop",
  "Seminar",
  "Guest Lecture",
  "Convocation",
  "Alumni Meet",
  "Sports Day",
  "Freshers Day",
  "Farewell",
  "Project Exhibition",
  "Conference",
  "Hackathon",
  "Competition",
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

interface BookingFormProps {
  selectedDate: Date | null;
  selectedSlot: string | null;
  selectedArangam?: string | null;
  onSubmit: (data: BookingData) => void;
}

export interface BookingData {
  date: Date;
  slotType: string;
  eventName: string;
  eventType: string;
  department: string;
  year: string;
  coordinatorName: string;
  coordinatorEmail: string;
  contactNumber: string;
  remarks: string;
  arangamName?: string;
}

const BookingForm = ({ selectedDate, selectedSlot, selectedArangam, onSubmit }: BookingFormProps) => {
  const { user } = useAuth();
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

  const [showEventTypeSuggestions, setShowEventTypeSuggestions] = useState(false);
  const [showDepartmentSuggestions, setShowDepartmentSuggestions] = useState(false);
  const [filteredEventTypes, setFilteredEventTypes] = useState<string[]>([]);
  const [filteredDepartments, setFilteredDepartments] = useState<string[]>([]);

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

  // Auto-fill user data when component mounts
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        coordinatorName: user.name,
        coordinatorEmail: user.email
      }));
    }
  }, [user]);

  // Filter suggestions based on input
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

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateEmail = (email: string) => {
    return email.endsWith("@mahendra.info");
  };

  const validatePhone = (phone: string) => {
    return /^[0-9]{10}$/.test(phone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      const dateStr = selectedDate.toISOString().split('T')[0];
      const arangamName = getArangamName(selectedArangam);

      const availability = await BookingService.isSlotAvailable(dateStr, selectedSlot, arangamName || undefined);

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
      const result = await BookingService.createBooking(bookingData);

      if (result.success) {
        onSubmit(bookingData);
        toast({
          title: "Arangam has booked successfully! 🎉",
          description: "To download details visit View Booked Details.",
          duration: 5000,
        });
        setFormData({
          eventName: "",
          eventType: "",
          department: "",
          year: "",
          coordinatorName: "",
          coordinatorEmail: "",
          contactNumber: "",
          remarks: "",
        });
        // Refresh the page after successful booking
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast({
          title: "Booking Failed",
          description: result.error || "Failed to submit booking request. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const inputClasses = "transition-all duration-300 focus:ring-2 focus:ring-accent focus:border-accent hover:border-primary/50";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Selected Date & Slot Display */}
      <div className="p-4 bg-secondary/50 rounded-lg border-l-4 border-l-primary space-y-2 border-2 border-gray-300">
        <div className="flex items-center gap-2 text-sm">
          <Building className="w-4 h-4 text-green-600" />
          <span className="font-medium">Selected Arangam:</span>
          <span className={selectedArangam ? "text-green-600 font-bold" : "text-muted-foreground"}>
            {getArangamName(selectedArangam) || "Not selected"}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <CalendarDays className="w-4 h-4 text-primary" />
          <span className="font-medium">Selected Date:</span>
          <span className={selectedDate ? "text-primary font-semibold" : "text-muted-foreground"}>
            {selectedDate ? selectedDate.toLocaleDateString('en-IN', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }) : "Not selected"}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-accent" />
          <span className="font-medium">Selected Slot:</span>
          <span className={selectedSlot ? "text-accent font-semibold" : "text-muted-foreground"}>
            {selectedSlot || "Not selected"}
          </span>
        </div>
        {(errors.date || errors.slot) && (
          <p className="text-destructive text-xs mt-1">
            {errors.date || errors.slot}
          </p>
        )}
      </div>

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
            className={inputClasses}
          />
          {errors.eventName && <p className="text-destructive text-xs">{errors.eventName}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="eventType" className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
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
              className={inputClasses}
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
            <Building className="w-4 h-4 text-primary" />
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
              className={inputClasses}
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
            <SelectTrigger className={inputClasses}>
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
      <div className="pt-4 border-t border-border p-4 border-2 border-gray-300 rounded-lg">
        <h3 className="font-display text-lg font-semibold text-primary mb-4 flex items-center gap-2">
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
              className={inputClasses}
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
              className={inputClasses}
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
              className={inputClasses}
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
          className={`min-h-[100px] ${inputClasses}`}
        />
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full btn-accent-gradient text-accent-foreground font-semibold py-6 text-lg shadow-accent hover:shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
      >
        Submit Booking Request
      </Button>
    </form>
  );
};

export default BookingForm;

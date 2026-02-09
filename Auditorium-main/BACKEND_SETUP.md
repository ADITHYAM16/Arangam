# Auditorium Booking System - Backend Setup Guide

## 🚀 Complete Backend Integration with Supabase

This project now includes a fully functional backend with Supabase integration for auditorium booking management.

### ✅ Features Implemented

- **100% Working Backend**: Complete CRUD operations with Supabase
- **Real-time Availability**: Live slot availability checking
- **View Booked Details**: Comprehensive booking details page
- **Time Conflict Prevention**: Automatic slot booking validation
- **Database Storage**: All booking data stored in Supabase
- **Responsive UI**: Modern interface with real-time updates

### 🛠️ Setup Instructions

#### 1. Environment Configuration
The `.env` file has been created with your Supabase credentials:
```
VITE_SUPABASE_URL=https://ddrtiuliypapemjfcezm.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 2. Install Dependencies
```bash
npm install
```

#### 3. Database Setup
When you first run the application, you'll see a database setup screen. Follow these steps:

1. **Open Supabase Dashboard**: Go to https://supabase.com/dashboard
2. **Navigate to SQL Editor**: In your project dashboard
3. **Run the SQL Script**: Copy and paste the provided SQL script
4. **Verify Setup**: Click "Check Database Status" in the app

#### 4. Start the Application
```bash
npm run dev
```

### 📊 Database Schema

The `bookings` table includes:
- `id`: Unique identifier (UUID)
- `event_name`: Name of the event
- `event_type`: Type of event (Technical, Cultural, etc.)
- `department`: Department organizing the event
- `year`: Target year/audience
- `coordinator_name`: Event coordinator name
- `coordinator_email`: Coordinator email (@mahendra.info only)
- `contact_number`: 10-digit phone number
- `remarks`: Additional notes
- `booking_date`: Date of the event
- `slot_type`: Time slot (full-day, forenoon, afternoon)
- `arangam_name`: Selected auditorium (VOC, Thiruvalluvar, etc.)
- `status`: Booking status (pending, approved, rejected)
- `created_at`: Timestamp when booking was created
- `updated_at`: Timestamp when booking was last updated

### 🎯 Key Features

#### Real-time Slot Availability
- Automatically checks if a slot is already booked
- Prevents double booking for the same time slot
- Shows real-time availability status

#### View Booked Details Page
- Comprehensive list of all bookings
- Detailed information for each booking
- Status indicators (Pending, Approved, Rejected)
- Timestamp information
- Coordinator details

#### Smart Booking Form
- Auto-fills user information
- Validates email domain (@mahendra.info only)
- Phone number validation (10 digits)
- Real-time availability checking before submission

### 🔧 Backend Services

#### BookingService
- `createBooking()`: Create new booking
- `getAllBookings()`: Fetch all bookings
- `getBookingsByDateAndSlot()`: Check slot availability
- `isSlotAvailable()`: Validate slot availability
- `updateBookingStatus()`: Update booking status
- `deleteBooking()`: Remove booking
- `getBookingsByCoordinator()`: Get user's bookings

#### DatabaseService
- `initializeDatabase()`: Setup database tables
- `testConnection()`: Verify database connectivity
- `getStats()`: Get booking statistics

### 🎨 UI Components

#### ViewBookedDetails Page
- Clean, modern interface
- Card-based layout for each booking
- Status badges with color coding
- Responsive design
- Back navigation

#### Enhanced SlotSelector
- Real-time availability checking
- Visual indicators for booked slots
- Arangam selection integration
- Hover effects and animations

### 🔒 Security Features

- Row Level Security (RLS) enabled
- Email domain validation
- Input sanitization
- Error handling and validation

### 📱 User Experience

1. **Select Arangam**: Choose from 5 available auditoriums
2. **Pick Date**: Calendar with disabled past dates
3. **Choose Slot**: Real-time availability checking
4. **Fill Details**: Auto-populated coordinator information
5. **Submit**: Instant validation and confirmation
6. **View Bookings**: Comprehensive booking details page

### 🚨 Important Notes

- The application will show a setup screen on first run
- Database table must be created in Supabase before use
- All bookings are stored with timestamps
- Email validation requires @mahendra.info domain
- Phone numbers must be exactly 10 digits

### 🎉 Ready to Use!

Your auditorium booking system is now fully functional with:
- ✅ Complete backend integration
- ✅ Real-time availability checking
- ✅ Comprehensive booking management
- ✅ Modern, responsive UI
- ✅ Data persistence in Supabase
- ✅ View booked details functionality

The system is production-ready and includes all requested features!
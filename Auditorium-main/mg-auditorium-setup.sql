-- MG Auditorium Bookings Table Setup
-- This table has the same schema as the bookings table but is exclusively for MG Auditorium bookings
-- Note: arangam_name column is omitted since this table is only for MG Auditorium

-- Create mg_auditorium_bookings table
CREATE TABLE IF NOT EXISTS mg_auditorium_bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_name VARCHAR(255) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    department VARCHAR(255) NOT NULL,
    year VARCHAR(50) NOT NULL,
    coordinator_name VARCHAR(255) NOT NULL,
    coordinator_email VARCHAR(255) NOT NULL,
    contact_number VARCHAR(15) NOT NULL,
    remarks TEXT,
    booking_date DATE NOT NULL,
    slot_type VARCHAR(20) NOT NULL CHECK (slot_type IN ('full-day', 'forenoon', 'afternoon')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_mg_bookings_date_slot ON mg_auditorium_bookings(booking_date, slot_type);
CREATE INDEX IF NOT EXISTS idx_mg_bookings_coordinator ON mg_auditorium_bookings(coordinator_email);
CREATE INDEX IF NOT EXISTS idx_mg_bookings_status ON mg_auditorium_bookings(status);

-- Enable Row Level Security
ALTER TABLE mg_auditorium_bookings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (matching the bookings table policy)
DROP POLICY IF EXISTS "Allow all operations on mg_auditorium_bookings" ON mg_auditorium_bookings;
CREATE POLICY "Allow all operations on mg_auditorium_bookings" ON mg_auditorium_bookings FOR ALL USING (true);

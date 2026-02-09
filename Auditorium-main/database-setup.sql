-- Drop table if exists to start fresh
DROP TABLE IF EXISTS bookings;

-- Create bookings table with all required columns
CREATE TABLE bookings (
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
    arangam_name VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'booked', 'rejected', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_bookings_date_slot ON bookings(booking_date, slot_type);
CREATE INDEX idx_bookings_coordinator ON bookings(coordinator_email);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_arangam ON bookings(arangam_name);

-- Enable RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Allow all operations on bookings" ON bookings FOR ALL USING (true);

-- Insert sample data with cancelled status example
INSERT INTO bookings (event_name, event_type, department, year, coordinator_name, coordinator_email, contact_number, remarks, booking_date, slot_type, arangam_name, status) VALUES
('Annual Tech Fest', 'Technical Symposium', 'Computer Science and Engineering', 'All Years', 'Dr. John Smith', 'john.smith@mahendra.info', '9876543210', 'Main auditorium required for keynote', '2024-03-15', 'full-day', 'VOC Arangam', 'approved'),
('Cultural Evening', 'Cultural Event', 'English', 'II Year', 'Prof. Jane Doe', 'jane.doe@mahendra.info', '9876543211', 'Dance and music performances', '2024-03-20', 'afternoon', 'Thiruvalluvar Arangam', 'pending'),
('Workshop Cancelled', 'Workshop', 'Mechanical Engineering', 'III Year', 'Dr. Mike Johnson', 'mike.johnson@mahendra.info', '9876543212', 'CANCELLED: Due to speaker unavailability', '2024-03-18', 'forenoon', 'Bharathiyar Arangam', 'cancelled');
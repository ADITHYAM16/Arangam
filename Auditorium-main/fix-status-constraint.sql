-- Fix the status constraint to include 'cancelled'
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;

-- Add new constraint that includes 'cancelled' status
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check 
CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled'));

-- Update any existing records if needed
UPDATE bookings SET status = 'cancelled' WHERE status NOT IN ('pending', 'approved', 'rejected', 'cancelled');
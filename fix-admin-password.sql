-- Fix admin_users to use plain text password (no bcrypt)
-- Run this in Supabase SQL Editor

-- Update the default admin user to plain text password
UPDATE admin_users SET password_hash = 'admin123' WHERE username = 'Admin';

-- If no row exists, insert one
INSERT INTO admin_users (username, password_hash)
VALUES ('Admin', 'admin123')
ON CONFLICT (username) DO UPDATE SET password_hash = 'admin123';

-- Ensure RLS policies exist
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access for login" ON admin_users;
CREATE POLICY "Allow public read access for login" ON admin_users
FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow public update access" ON admin_users;
CREATE POLICY "Allow public update access" ON admin_users
FOR UPDATE TO public USING (true) WITH CHECK (true);

-- Ensure arangams RLS is open
ALTER TABLE arangams ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on arangams" ON arangams;
CREATE POLICY "Allow all operations on arangams" ON arangams FOR ALL TO public USING (true) WITH CHECK (true);

-- Ensure bookings RLS is open
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on bookings" ON bookings;
CREATE POLICY "Allow all operations on bookings" ON bookings FOR ALL TO public USING (true) WITH CHECK (true);

-- Ensure mg_auditorium_bookings RLS is open
ALTER TABLE mg_auditorium_bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on mg_auditorium_bookings" ON mg_auditorium_bookings;
CREATE POLICY "Allow all operations on mg_auditorium_bookings" ON mg_auditorium_bookings FOR ALL TO public USING (true) WITH CHECK (true);

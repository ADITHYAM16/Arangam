-- Enable Row Level Security
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read admin_users (for login)
CREATE POLICY "Allow public read access for login" ON admin_users
FOR SELECT
TO public
USING (true);

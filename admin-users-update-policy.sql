-- Add policy to allow updating admin credentials
CREATE POLICY "Allow public update access" ON admin_users
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

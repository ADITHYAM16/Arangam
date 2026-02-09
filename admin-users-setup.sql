-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin user with hashed password
-- Username: Admin
-- Password: admin123
-- Hash generated using bcrypt with salt rounds 10
INSERT INTO admin_users (username, password_hash) 
VALUES ('Admin', '$2a$10$8K1p/a0dL3.I9/YS4sSSzO7TNfhBIpIEn8b9/7H4gKqH.mh5EXYvC')
ON CONFLICT (username) DO NOTHING;

-- Create index for faster username lookups
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);

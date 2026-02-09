# Admin Authentication Setup

## Database Setup

1. Run the SQL script to create the admin_users table:
   ```bash
   # Execute the admin-users-setup.sql file in your Supabase SQL editor
   ```

2. The script will create:
   - `admin_users` table with username and hashed password
   - Default admin user with credentials:
     - Username: `Admin`
     - Password: `admin123`

## Installation

Install the required dependencies:

```bash
cd Auditorium-Admin
npm install
```

This will install:
- `bcryptjs` - For password hashing and comparison
- `@types/bcryptjs` - TypeScript types for bcryptjs

## Login Credentials

**Default Admin Account:**
- Username: `Admin`
- Password: `admin123`

The password is stored as a bcrypt hash in the database for security.

## How It Works

1. User enters username and password
2. System fetches user from `admin_users` table
3. Password is compared with stored bcrypt hash
4. If valid, user is logged in
5. Demo credentials section has been removed from the login page

## Security Features

- Passwords are hashed using bcrypt (10 salt rounds)
- No plain text passwords stored in database
- Username lookup is case-sensitive
- Failed login attempts show generic error message

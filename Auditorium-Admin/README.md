# Auditorium Admin Dashboard

A separate React admin dashboard for managing the Arangam booking system.

## Features

- **Admin Authentication**: Secure login system
- **Booking Management**: View, approve, reject bookings
- **Dashboard Overview**: Statistics and recent bookings
- **Real-time Updates**: Manage bookings from the main system
- **Responsive Design**: Works on desktop and mobile

## Setup Instructions

1. **Install Dependencies**
   ```bash
   cd Auditorium-Admin
   npm install
   ```

2. **Configure Backend Connection**
   - Open `src/services/bookingService.ts`
   - Replace `YOUR_SUPABASE_URL` and `YOUR_SUPABASE_ANON_KEY` with your actual Supabase credentials
   - Uncomment the Supabase implementation section

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Build for Production**
   ```bash
   npm run build
   ```

## Default Admin Credentials

- **Username**: admin
- **Password**: admin123

## Project Structure

```
Auditorium-Admin/
├── src/
│   ├── components/
│   │   ├── AdminLogin.tsx      # Login component
│   │   └── AdminDashboard.tsx  # Main dashboard
│   ├── services/
│   │   └── bookingService.ts   # API service
│   ├── App.tsx                 # Main app component
│   └── main.tsx               # Entry point
├── package.json
└── README.md
```

## Admin Dashboard Features

### Overview Tab
- Total bookings count
- Pending approvals
- Approved bookings
- Today's events
- Recent bookings table

### Manage Bookings Tab
- Complete bookings list
- Approve/Reject functionality
- Booking details view
- Status management

### Settings Tab
- System configuration
- Notification settings
- Auto-approval options

## Connecting to Main Project

The admin dashboard connects to the same Supabase backend as the main booking system. To integrate:

1. Use the same Supabase project credentials
2. Ensure proper database permissions for admin operations
3. Deploy both projects separately or together

## Deployment

You can deploy this admin dashboard separately from the main booking system:

1. **Vercel/Netlify**: Connect your repository and deploy
2. **Custom Server**: Build and serve the `dist` folder
3. **Same Domain**: Deploy as a subdirectory (e.g., `/admin`)

## Security Notes

- Change default admin credentials in production
- Implement proper authentication with JWT tokens
- Add role-based access control
- Use environment variables for sensitive data
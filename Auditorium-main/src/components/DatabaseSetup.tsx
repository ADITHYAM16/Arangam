import { useState, useEffect } from 'react'
import { Database, CheckCircle, XCircle, AlertTriangle, Copy, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DatabaseService } from '@/services/databaseService'
import { toast } from '@/hooks/use-toast'

interface DatabaseSetupProps {
  onSetupComplete: () => void
}

const DatabaseSetup = ({ onSetupComplete }: DatabaseSetupProps) => {
  const [setupStatus, setSetupStatus] = useState<'checking' | 'needs-setup' | 'ready' | 'error'>('checking')
  const [errorMessage, setErrorMessage] = useState<string>('')

  useEffect(() => {
    checkDatabaseStatus()
  }, [])

  const checkDatabaseStatus = async () => {
    setSetupStatus('checking')
    
    const result = await DatabaseService.testConnection()
    
    if (result.success) {
      setSetupStatus('ready')
      setTimeout(() => {
        onSetupComplete()
      }, 2000)
    } else {
      setSetupStatus('needs-setup')
      setErrorMessage(result.error || 'Database setup required')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: "SQL script copied to clipboard",
    })
  }

  const sqlScript = `-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
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
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bookings_date_slot ON bookings(booking_date, slot_type);
CREATE INDEX IF NOT EXISTS idx_bookings_coordinator ON bookings(coordinator_email);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_arangam ON bookings(arangam_name);

-- Enable Row Level Security
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Allow all operations on bookings" ON bookings FOR ALL USING (true);`

  if (setupStatus === 'checking') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold mb-2">Checking Database</h3>
            <p className="text-muted-foreground">Verifying database connection...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (setupStatus === 'ready') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-green-600 mb-2">Database Ready!</h3>
            <p className="text-muted-foreground">Redirecting to application...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <Database className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-primary mb-2">Database Setup Required</h1>
          <p className="text-muted-foreground">Please set up the database table in Supabase to continue</p>
        </div>

        <div className="grid gap-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              The bookings table needs to be created in your Supabase database. Follow the steps below to set it up.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>Step 1: Open Supabase Dashboard</span>
                <ExternalLink className="w-4 h-4" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Go to your Supabase project dashboard:</p>
              <Button
                onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
                variant="outline"
                className="flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Open Supabase Dashboard
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Step 2: Run SQL Script</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Navigate to SQL Editor in your Supabase dashboard and run this script:</p>
              <div className="relative">
                <pre className="bg-secondary p-4 rounded-lg text-sm overflow-x-auto max-h-96 overflow-y-auto">
                  <code>{sqlScript}</code>
                </pre>
                <Button
                  onClick={() => copyToClipboard(sqlScript)}
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2 flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  Copy
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Step 3: Verify Setup</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">After running the SQL script, click the button below to verify the setup:</p>
              <Button
                onClick={checkDatabaseStatus}
                className="flex items-center gap-2"
              >
                <Database className="w-4 h-4" />
                Check Database Status
              </Button>
              {errorMessage && (
                <Alert className="mt-4" variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p>• Make sure you're using the correct Supabase project</p>
                <p>• Ensure your API keys are correctly configured in the .env file</p>
                <p>• Check that Row Level Security policies are properly set</p>
                <p>• Verify your internet connection</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default DatabaseSetup
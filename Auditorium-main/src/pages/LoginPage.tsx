import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Lock, User, Shield, Eye, EyeOff } from 'lucide-react';
import mecCollegeLogo from '@/assets/mec-college-logo.png';

const LoginPage = () => {
  const { login, signup } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('login');
  const [showPassword, setShowPassword] = useState({ login: false, signup: false, confirm: false });
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ name: '', email: '', password: '', confirmPassword: '' });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(loginData.email, loginData.password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    if (signupData.password !== signupData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (signupData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    try {
      await signup(signupData.email, signupData.password, signupData.name);
      setSuccess('Account created successfully! Please login.');
      setSignupData({ name: '', email: '', password: '', confirmPassword: '' });
      setTimeout(() => {
        setActiveTab('login');
        setSuccess('');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-100 to-slate-200 relative overflow-hidden flex items-center justify-center p-4">
      {/* Professional Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-green-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex flex-col items-center justify-center gap-4 mb-6">
            <div className="transform hover:scale-105 transition-all duration-300 mb-2">
              <img
                src="/MEC-NKL1_logo.png"
                alt="MEC College Logo"
                className="mx-auto h-40 w-auto object-contain drop-shadow-xl mix-blend-multiply"
              />
            </div>
            <div className="text-center">
              <h1 className="font-display text-3xl font-bold text-red-900 mb-2">MEC Arangam</h1>
              <p className="text-lg text-gray-600 font-medium">Faculty Portal</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-white bg-sky-500 px-6 py-3 rounded-full inline-flex shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
            <Shield className="w-4 h-4" />
            <span className="font-medium">Faculty Access Only</span>
          </div>
        </div>

        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm hover:shadow-3xl transition-all duration-300">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-orange-600 bg-clip-text text-transparent mb-2">Welcome Back</CardTitle>
            <CardDescription className="text-lg text-gray-600 font-medium">
              Arangam Booking Portal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-lg">
                <TabsTrigger value="login" className="data-[state=active]:bg-green-500 data-[state=active]:text-white transition-all duration-300 hover:bg-gray-200">Login</TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-green-500 data-[state=active]:text-white transition-all duration-300 hover:bg-gray-200">Sign Up</TabsTrigger>
              </TabsList>

              {error && (
                <Alert className="mt-4 border-destructive/50 text-destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="mt-4 border-green-500/50 text-green-600">
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="Enter your email"
                        value={loginData.email}
                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                        className="pl-10 border-gray-200 focus:border-green-500 focus:ring-green-500 hover:border-orange-300 transition-all duration-200"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type={showPassword.login ? "text" : "password"}
                        placeholder="Enter your password"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        className="pl-10 pr-10 border-gray-200 focus:border-green-500 focus:ring-green-500 hover:border-orange-300 transition-all duration-200"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-orange-100 hover:text-orange-600 transition-all duration-200"
                        onClick={() => setShowPassword(prev => ({ ...prev, login: !prev.login }))}
                      >
                        {showPassword.login ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200" disabled={isLoading}>
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Dr. John Doe"
                        value={signupData.name}
                        onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                        className="pl-10 border-gray-200 focus:border-green-500 focus:ring-green-500 hover:border-orange-300 transition-all duration-200"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="Enter your email"
                        value={signupData.email}
                        onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                        className="pl-10 border-gray-200 focus:border-green-500 focus:ring-green-500 hover:border-orange-300 transition-all duration-200"
                        required
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Authorized personnel only
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type={showPassword.signup ? "text" : "password"}
                        placeholder="Create a password"
                        value={signupData.password}
                        onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                        className="pl-10 pr-10 border-gray-200 focus:border-green-500 focus:ring-green-500 hover:border-orange-300 transition-all duration-200"
                        required
                        minLength={6}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-orange-100 hover:text-orange-600 transition-all duration-200"
                        onClick={() => setShowPassword(prev => ({ ...prev, signup: !prev.signup }))}
                      >
                        {showPassword.signup ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-confirm"
                        type={showPassword.confirm ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={signupData.confirmPassword}
                        onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                        className={`pl-10 pr-10 border-gray-200 focus:border-green-500 focus:ring-green-500 hover:border-orange-300 transition-all duration-200 ${signupData.confirmPassword && signupData.password !== signupData.confirmPassword
                          ? 'border-red-500 focus:border-red-500'
                          : signupData.confirmPassword && signupData.password === signupData.confirmPassword
                            ? 'border-green-500 focus:border-green-500'
                            : ''
                          }`}
                        required
                        minLength={6}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-orange-100 hover:text-orange-600 transition-all duration-200"
                        onClick={() => setShowPassword(prev => ({ ...prev, confirm: !prev.confirm }))}
                      >
                        {showPassword.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {signupData.confirmPassword && signupData.password !== signupData.confirmPassword && (
                      <p className="text-xs text-red-500">Passwords do not match</p>
                    )}
                    {signupData.confirmPassword && signupData.password === signupData.confirmPassword && (
                      <p className="text-xs text-green-600">Passwords match ✓</p>
                    )}
                  </div>
                  <Button type="submit" className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200" disabled={isLoading}>
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="text-center mt-8 text-sm text-gray-600">
          <p className="font-semibold">© {new Date().getFullYear()} Mahendra Engineering College</p>
          <p className="mt-1">For support: Contact administrator</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
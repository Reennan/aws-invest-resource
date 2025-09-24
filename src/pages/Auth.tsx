import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff, Cloud, Shield, BarChart3 } from 'lucide-react';
import { z } from 'zod';

const signInSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100)
});

const signUpSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address').max(255),
  phone: z.string().trim().max(20).optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const Auth = () => {
  const { user, signIn, signUp, loading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [signInData, setSignInData] = useState({
    email: '',
    password: ''
  });
  
  const [signUpData, setSignUpData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState<any>({});

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    try {
      const validatedData = signInSchema.parse(signInData);
      setIsSubmitting(true);
      
      const { error } = await signIn(validatedData.email, validatedData.password);
      
      if (!error) {
        // Navigate will happen automatically via auth state change
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: any = {};
        error.errors.forEach((err) => {
          if (err.path) {
            fieldErrors[err.path[0]] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    try {
      const validatedData = signUpSchema.parse(signUpData);
      setIsSubmitting(true);
      
      const { error } = await signUp(
        validatedData.email,
        validatedData.password,
        validatedData.name,
        validatedData.phone || undefined
      );
      
      if (!error) {
        // Show success message and switch to sign in tab
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: any = {};
        error.errors.forEach((err) => {
          if (err.path) {
            fieldErrors[err.path[0]] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/50 to-primary/5 px-4">
      <div className="max-w-6xl w-full flex items-center gap-12">
        {/* Hero Section */}
        <div className="flex-1 hidden lg:block">
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-primary flex items-center justify-center">
                  <Cloud className="h-6 w-6 text-primary-foreground" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  AWS Resource Monitor
                </h1>
              </div>
              <p className="text-xl text-muted-foreground">
                Monitor, analyze, and optimize your AWS resources in real-time
              </p>
            </div>
            
            <div className="grid gap-6">
              <div className="flex items-center gap-4 p-4 rounded-lg bg-card border shadow-soft">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Real-time Analytics</h3>
                  <p className="text-sm text-muted-foreground">
                    Track resource usage and costs across all your AWS accounts
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-4 rounded-lg bg-card border shadow-soft">
                <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold">Secure Access Control</h3>
                  <p className="text-sm text-muted-foreground">
                    Role-based permissions with cluster-level access management
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Auth Form */}
        <div className="flex-1 max-w-md mx-auto">
          <Card className="shadow-large border-border/50">
            <CardHeader className="text-center space-y-2">
              <div className="mx-auto h-12 w-12 rounded-xl bg-gradient-primary flex items-center justify-center lg:hidden">
                <Cloud className="h-6 w-6 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl">Welcome</CardTitle>
              <CardDescription>
                Sign in to your account or create a new one
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <Tabs defaultValue="signin" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
                
                <TabsContent value="signin" className="space-y-4">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email</Label>
                      <Input
                        id="signin-email"
                        type="email"
                        value={signInData.email}
                        onChange={(e) => setSignInData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="your.email@company.com"
                        className={errors.email ? 'border-destructive' : ''}
                        disabled={isSubmitting}
                      />
                      {errors.email && (
                        <p className="text-sm text-destructive">{errors.email}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signin-password">Password</Label>
                      <div className="relative">
                        <Input
                          id="signin-password"
                          type={showPassword ? 'text' : 'password'}
                          value={signInData.password}
                          onChange={(e) => setSignInData(prev => ({ ...prev, password: e.target.value }))}
                          placeholder="Enter your password"
                          className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
                          disabled={isSubmitting}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isSubmitting}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                      {errors.password && (
                        <p className="text-sm text-destructive">{errors.password}</p>
                      )}
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-primary border-0" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Signing in...' : 'Sign In'}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="signup" className="space-y-4">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Full Name</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        value={signUpData.name}
                        onChange={(e) => setSignUpData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="John Doe"
                        className={errors.name ? 'border-destructive' : ''}
                        disabled={isSubmitting}
                      />
                      {errors.name && (
                        <p className="text-sm text-destructive">{errors.name}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        value={signUpData.email}
                        onChange={(e) => setSignUpData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="your.email@company.com"
                        className={errors.email ? 'border-destructive' : ''}
                        disabled={isSubmitting}
                      />
                      {errors.email && (
                        <p className="text-sm text-destructive">{errors.email}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-phone">Phone (Optional)</Label>
                      <Input
                        id="signup-phone"
                        type="tel"
                        value={signUpData.phone}
                        onChange={(e) => setSignUpData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+1 (555) 123-4567"
                        className={errors.phone ? 'border-destructive' : ''}
                        disabled={isSubmitting}
                      />
                      {errors.phone && (
                        <p className="text-sm text-destructive">{errors.phone}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <div className="relative">
                        <Input
                          id="signup-password"
                          type={showPassword ? 'text' : 'password'}
                          value={signUpData.password}
                          onChange={(e) => setSignUpData(prev => ({ ...prev, password: e.target.value }))}
                          placeholder="Choose a strong password"
                          className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
                          disabled={isSubmitting}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isSubmitting}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                      {errors.password && (
                        <p className="text-sm text-destructive">{errors.password}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                      <div className="relative">
                        <Input
                          id="signup-confirm-password"
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={signUpData.confirmPassword}
                          onChange={(e) => setSignUpData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          placeholder="Confirm your password"
                          className={errors.confirmPassword ? 'border-destructive pr-10' : 'pr-10'}
                          disabled={isSubmitting}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          disabled={isSubmitting}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                      )}
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-primary border-0" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Creating account...' : 'Create Account'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;
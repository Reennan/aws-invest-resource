import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Cloud } from 'lucide-react';
import { z } from 'zod';

const signInSchema = z.object({
  email: z.string().email('E-mail inválido').max(255),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').max(100)
});

const signUpSchema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório').max(100),
  email: z.string().email('E-mail inválido').max(255),
  phone: z.string().trim().max(20).optional(),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').max(100),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
});

const Auth = () => {
  const { user, signIn, signUp, loading } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
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
      <div className="min-h-screen flex items-center justify-center bg-background">
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
        // Show success message and switch to sign in
        setIsSignUp(false);
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
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Welcome */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary text-primary-foreground flex-col justify-center px-12">
        <div className="max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-12 w-12 rounded-lg bg-background flex items-center justify-center">
              <Cloud className="h-6 w-6 text-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">AWS Resource Monitor</h1>
              <p className="text-muted-foreground text-sm">Dashboard de Recursos</p>
            </div>
          </div>
          
          <h2 className="text-4xl font-bold mb-6">
            Bem-vindo
          </h2>
          
          <p className="text-xl text-primary-foreground/80 mb-8">
            Monitore e analise seus recursos AWS em tempo real com nossa plataforma profissional.
          </p>
          
          <div className="space-y-4 text-primary-foreground/70">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-accent rounded-full"></div>
              <span>Monitoramento em tempo real</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-accent rounded-full"></div>
              <span>Controle de acesso baseado em funções</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-accent rounded-full"></div>
              <span>Relatórios detalhados e exportação</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="text-center mb-8 lg:hidden">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                <Cloud className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold text-foreground">AWS Resource Monitor</h1>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Bem-vindo</h2>
            <p className="text-muted-foreground">Acesse sua conta ou crie uma nova</p>
          </div>

          {/* Auth Toggle */}
          <div className="flex mb-8">
            <button
              type="button"
              onClick={() => setIsSignUp(false)}
              className={`flex-1 py-3 px-4 text-center font-medium transition-all duration-200 ${
                !isSignUp 
                  ? 'text-foreground border-b-2 border-primary' 
                  : 'text-muted-foreground border-b border-border hover:text-foreground'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setIsSignUp(true)}
              className={`flex-1 py-3 px-4 text-center font-medium transition-all duration-200 ${
                isSignUp 
                  ? 'text-foreground border-b-2 border-primary' 
                  : 'text-muted-foreground border-b border-border hover:text-foreground'
              }`}
            >
              Criar Conta
            </button>
          </div>

          {/* Sign In Form */}
          {!isSignUp && (
            <form onSubmit={handleSignIn} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="signin-email" className="text-foreground font-medium">E-mail</Label>
                <Input
                  id="signin-email"
                  type="email"
                  value={signInData.email}
                  onChange={(e) => setSignInData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="seu.email@empresa.com"
                  className={`h-12 ${
                    errors.email ? 'border-destructive' : ''
                  }`}
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signin-password" className="text-foreground font-medium">Senha</Label>
                <div className="relative">
                  <Input
                    id="signin-password"
                    type={showPassword ? 'text' : 'password'}
                    value={signInData.password}
                    onChange={(e) => setSignInData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Digite sua senha"
                    className={`h-12 pr-12 ${
                      errors.password ? 'border-destructive' : ''
                    }`}
                    disabled={isSubmitting}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-12 px-3 hover:bg-transparent"
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
                className="w-full h-12" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
          )}

          {/* Sign Up Form */}
          {isSignUp && (
            <form onSubmit={handleSignUp} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="signup-name" className="text-foreground font-medium">Nome Completo</Label>
                <Input
                  id="signup-name"
                  type="text"
                  value={signUpData.name}
                  onChange={(e) => setSignUpData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="João Silva"
                  className={`h-12 ${
                    errors.name ? 'border-destructive' : ''
                  }`}
                  disabled={isSubmitting}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signup-email" className="text-foreground font-medium">E-mail</Label>
                <Input
                  id="signup-email"
                  type="email"
                  value={signUpData.email}
                  onChange={(e) => setSignUpData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="seu.email@empresa.com"
                  className={`h-12 ${
                    errors.email ? 'border-destructive' : ''
                  }`}
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signup-phone" className="text-foreground font-medium">Telefone (Opcional)</Label>
                <Input
                  id="signup-phone"
                  type="tel"
                  value={signUpData.phone}
                  onChange={(e) => setSignUpData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(11) 99999-9999"
                  className={`h-12 ${
                    errors.phone ? 'border-destructive' : ''
                  }`}
                  disabled={isSubmitting}
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signup-password" className="text-foreground font-medium">Senha</Label>
                <div className="relative">
                  <Input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    value={signUpData.password}
                    onChange={(e) => setSignUpData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Escolha uma senha forte"
                    className={`h-12 pr-12 ${
                      errors.password ? 'border-destructive' : ''
                    }`}
                    disabled={isSubmitting}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-12 px-3 hover:bg-transparent"
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
                <Label htmlFor="signup-confirm-password" className="text-foreground font-medium">Confirmar Senha</Label>
                <div className="relative">
                  <Input
                    id="signup-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={signUpData.confirmPassword}
                    onChange={(e) => setSignUpData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirme sua senha"
                    className={`h-12 pr-12 ${
                      errors.confirmPassword ? 'border-destructive' : ''
                    }`}
                    disabled={isSubmitting}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-12 px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
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
                className="w-full h-12" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Criando conta...' : 'Criar Conta'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PasswordResetFormProps {
  token: string;
  email: string;
}

export const PasswordResetForm = ({ token, email }: PasswordResetFormProps) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase.functions.invoke('reset-password', {
        body: {
          email,
          token,
          newPassword,
          action: 'reset'
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Sucesso",
        description: "Senha alterada com sucesso! Você pode fazer login agora.",
      });
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/auth');
      }, 2000);
      
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao redefinir senha. O link pode ter expirado.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Nova Senha</CardTitle>
          <CardDescription>
            Digite sua nova senha abaixo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova Senha</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite sua nova senha"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirme sua nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Alterar Senha
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
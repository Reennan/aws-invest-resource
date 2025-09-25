import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface PasswordResetDialogProps {
  children: React.ReactNode;
}

export const PasswordResetDialog = ({ children }: PasswordResetDialogProps) => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Erro",
        description: "Por favor, insira seu e-mail",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase.functions.invoke('reset-password', {
        body: {
          email,
          action: 'request'
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Sucesso",
        description: "Se o e-mail estiver cadastrado, você receberá as instruções para redefinir sua senha",
      });
      
      setOpen(false);
      setEmail('');
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar e-mail de recuperação",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Redefinir Senha</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reset-email">E-mail</Label>
            <Input
              id="reset-email"
              type="email"
              placeholder="Digite seu e-mail cadastrado"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar E-mail
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
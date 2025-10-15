import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
}

interface UserProfile {
  id: string;
  auth_user_id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: 'viewer' | 'admin' | 'editor';
  last_login: string | null;
  created_at: string;
  is_active: boolean;
  can_view_dashboard: boolean;
  can_view_clusters: boolean;
  can_view_reports: boolean;
  can_manage_users: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signingOut: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name: string, phone?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setLoading(false);
        return;
      }

      const data = await apiClient.getUser();
      setUser({ id: data.user.id, email: data.user.email });
      setProfile(data.profile);
    } catch (error) {
      console.error('Error checking auth:', error);
      localStorage.removeItem('auth_token');
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 [FRONTEND] Iniciando signIn...');
      const data = await apiClient.signIn(email, password);
      console.log('✅ [FRONTEND] Dados recebidos do backend:', data);
      
      setUser({ id: data.user.id, email: data.user.email });
      setProfile(data.profile);
      console.log('✅ [FRONTEND] Estado atualizado - user e profile setados');

      toast({
        title: "Sucesso",
        description: "Login realizado com sucesso!",
      });
      
      console.log('✅ [FRONTEND] signIn completo, retornando sucesso');
      return { error: null };
    } catch (error: any) {
      console.error('❌ [FRONTEND] Sign in error:', error);
      
      let errorMessage = error.message || 'Erro ao fazer login';
      
      if (errorMessage.includes('Invalid credentials') || errorMessage.includes('Credenciais inválidas')) {
        errorMessage = 'Email ou senha incorretos';
      }

      toast({
        title: "Erro ao fazer login",
        description: errorMessage,
        variant: "destructive",
      });
      return { error };
    }
  };

  const signUp = async (email: string, password: string, name: string, phone?: string) => {
    try {
      console.log('📝 [FRONTEND] Iniciando signUp...');
      if (!name || name.trim().length === 0) {
        toast({
          title: "Erro",
          description: "Nome é obrigatório",
          variant: "destructive",
        });
        return { error: new Error("Name is required") };
      }

      const data = await apiClient.signUp(email, password, name.trim());
      console.log('✅ [FRONTEND] Conta criada, dados recebidos:', data);
      
      setUser({ id: data.user.id, email: data.user.email });
      setProfile(data.profile);
      console.log('✅ [FRONTEND] Estado atualizado - user e profile setados');

      toast({
        title: "Conta criada com sucesso!",
        description: "Bem-vindo ao AWS Resource Monitor!",
      });

      console.log('✅ [FRONTEND] signUp completo, retornando sucesso');
      return { error: null };
    } catch (error: any) {
      console.error('❌ [FRONTEND] Sign up error:', error);
      
      let errorMessage = error.message || 'Erro ao criar conta';
      
      if (errorMessage.includes('already exists') || errorMessage.includes('já existe') || errorMessage.includes('duplicate key')) {
        errorMessage = 'Este email já está cadastrado. Faça login.';
      }

      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      return { error };
    }
  };

  const signOut = async () => {
    if (signingOut) return;
    
    try {
      setSigningOut(true);
      
      await apiClient.signOut();
      
      setUser(null);
      setProfile(null);
      
      toast({
        title: "Logout realizado",
        description: "Você saiu da sua conta",
      });
      
      setTimeout(() => {
        window.location.href = '/auth';
      }, 500);
    } catch (error) {
      console.error('Error during sign out:', error);
      
      // Mesmo com erro, limpa os dados locais
      setUser(null);
      setProfile(null);
      localStorage.removeItem('auth_token');
      
      toast({
        title: "Sessão finalizada",
        description: "Você foi desconectado",
      });
      
      setTimeout(() => {
        window.location.href = '/auth';
      }, 500);
    } finally {
      setSigningOut(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      if (!user) throw new Error('No user logged in');

      const data = await apiClient.updateProfile(updates);
      setProfile(data.profile);

      toast({
        title: "Sucesso",
        description: "Perfil atualizado com sucesso!",
      });

      return { error: null };
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Falha ao atualizar perfil",
        variant: "destructive",
      });
      return { error };
    }
  };

  const value = {
    user,
    profile,
    loading,
    signingOut,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

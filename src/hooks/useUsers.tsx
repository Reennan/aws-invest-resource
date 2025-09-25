import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface User {
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

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users_profile')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: "Erro",
          description: "Não foi possível carregar os usuários",
          variant: "destructive",
        });
        return;
      }

      setUsers(data || []);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar usuários",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, role: 'viewer' | 'admin' | 'editor') => {
    try {
      const { error } = await supabase
        .from('users_profile')
        .update({ role })
        .eq('id', userId);

      if (error) {
        toast({
          title: "Erro",
          description: "Não foi possível atualizar o papel do usuário",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Sucesso",
        description: "Papel do usuário atualizado com sucesso",
      });
      
      await fetchUsers();
      return true;
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado ao atualizar usuário",
        variant: "destructive",
      });
      return false;
    }
  };

  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('users_profile')
        .update({ is_active: isActive })
        .eq('id', userId);

      if (error) {
        toast({
          title: "Erro",
          description: "Não foi possível atualizar o status do usuário",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Sucesso",
        description: `Usuário ${isActive ? 'ativado' : 'desativado'} com sucesso`,
      });
      
      await fetchUsers();
      return true;
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado ao atualizar status",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('users_profile')
        .delete()
        .eq('id', userId);

      if (error) {
        toast({
          title: "Erro",
          description: "Não foi possível excluir o usuário",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Sucesso",
        description: "Usuário excluído com sucesso",
      });
      
      await fetchUsers();
      return true;
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado ao excluir usuário",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    refetch: fetchUsers,
    updateUserRole,
    toggleUserStatus,
    deleteUser,
  };
};
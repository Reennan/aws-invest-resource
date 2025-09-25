import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserClusterPermission {
  id: string;
  user_id: string;
  cluster_id: string;
  can_view: boolean;
}

export const useUserClusterPermissions = () => {
  const [permissions, setPermissions] = useState<UserClusterPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPermissions = async () => {
    try {
      const { data, error } = await supabase
        .from('user_cluster_permissions')
        .select('*');

      if (error) {
        toast({
          title: "Erro",
          description: "Não foi possível carregar as permissões",
          variant: "destructive",
        });
        return;
      }

      setPermissions(data || []);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar permissões",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserClusterPermission = async (
    userId: string,
    clusterId: string,
    canView: boolean
  ) => {
    try {
      // Verifica se já existe uma permissão
      const existingPermission = permissions.find(
        p => p.user_id === userId && p.cluster_id === clusterId
      );

      let error;

      if (existingPermission) {
        if (canView) {
          // Atualiza para permitir
          ({ error } = await supabase
            .from('user_cluster_permissions')
            .update({ can_view: true })
            .eq('id', existingPermission.id));
        } else {
          // Remove a permissão
          ({ error } = await supabase
            .from('user_cluster_permissions')
            .delete()
            .eq('id', existingPermission.id));
        }
      } else if (canView) {
        // Cria nova permissão
        ({ error } = await supabase
          .from('user_cluster_permissions')
          .insert({
            user_id: userId,
            cluster_id: clusterId,
            can_view: true
          }));
      }

      if (error) {
        toast({
          title: "Erro",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      await fetchPermissions();
      toast({
        title: "Sucesso",
        description: "Permissão atualizada com sucesso!",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar permissão",
        variant: "destructive",
      });
    }
  };

  const getUserClusterPermissions = (userId: string) => {
    return permissions.filter(p => p.user_id === userId);
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  return {
    permissions,
    loading,
    refetch: fetchPermissions,
    updateUserClusterPermission,
    getUserClusterPermissions,
  };
};
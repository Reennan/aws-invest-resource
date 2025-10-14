import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
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
      const data = await apiClient.getUserClusterPermissions();
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
      const existingPermission = permissions.find(
        p => p.user_id === userId && p.cluster_id === clusterId
      );

      if (existingPermission && !canView) {
        // Remove a permissão
        await apiClient.deleteUserClusterPermission(userId, clusterId);
      } else {
        // Cria ou atualiza a permissão
        await apiClient.updateUserClusterPermission(userId, clusterId, canView);
      }

      await fetchPermissions();
      toast({
        title: "Sucesso",
        description: "Permissão atualizada com sucesso!",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar permissão",
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
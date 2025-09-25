import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Cluster {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export const useClusters = () => {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchClusters = async () => {
    try {
      // Para administradores, mostra todos os clusters
      const { data: profile } = await supabase
        .from('users_profile')
        .select('role')
        .eq('auth_user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      let query = supabase.from('clusters').select('*');

      // Se não for admin, filtra apenas os clusters com permissão
      if (profile?.role !== 'admin') {
        const { data: userProfileId } = await supabase.rpc('get_user_profile_id');
        
        const { data: permissions } = await supabase
          .from('user_cluster_permissions')
          .select('cluster_id')
          .eq('user_id', userProfileId)
          .eq('can_view', true);

        const clusterIds = permissions?.map(p => p.cluster_id) || [];
        
        if (clusterIds.length === 0) {
          setClusters([]);
          return;
        }

        query = query.in('id', clusterIds);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        toast({
          title: "Erro",
          description: "Não foi possível carregar os clusters",
          variant: "destructive",
        });
        return;
      }

      setClusters(data || []);
    } catch (error) {
      toast({
        title: "Erro", 
        description: "Erro inesperado ao carregar clusters",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClusters();
  }, []);

  return {
    clusters,
    loading,
    refetch: fetchClusters,
  };
};
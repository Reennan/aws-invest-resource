import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ResourceCreated {
  id: string;
  cluster_id: string;
  run_id: string;
  name: string;
  type: string;
  account_name: string;
  console_link: string;
  manage_status: string;
  created_at: string;
  raw: any;
}

interface ResourceUnused {
  id: string;
  cluster_id: string;
  run_id: string;
  name: string;
  type: string;
  resource_id: string;
  account_name: string;
  console_link: string;
  status: string;
  days_without_use: number;
  raw: any;
  metrics: any;
}

export const useResources = () => {
  const [createdResources, setCreatedResources] = useState<ResourceCreated[]>([]);
  const [unusedResources, setUnusedResources] = useState<ResourceUnused[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchResources = async () => {
    try {
      // Primeiro verifica se é admin
      const { data: profile } = await supabase
        .from('users_profile')
        .select('role')
        .eq('auth_user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      let clusterIds: string[] = [];

      // Se for admin, pega todos os clusters
      if (profile?.role === 'admin') {
        const { data: allClusters } = await supabase
          .from('clusters')
          .select('id');
        
        clusterIds = allClusters?.map(c => c.id) || [];
      } else {
        // Se não for admin, pega apenas clusters permitidos
        const { data: userProfileId } = await supabase.rpc('get_user_profile_id');
        
        const { data: permittedClusters, error: clusterError } = await supabase
          .from('user_cluster_permissions')
          .select('cluster_id')
          .eq('user_id', userProfileId)
          .eq('can_view', true);

        if (clusterError) {
          console.error('Error fetching permitted clusters:', clusterError);
          return;
        }

        clusterIds = permittedClusters?.map(p => p.cluster_id) || [];
      }

      if (clusterIds.length === 0) {
        setCreatedResources([]);
        setUnusedResources([]);
        return;
      }

      const [createdResult, unusedResult] = await Promise.all([
        supabase
          .from('resources_created')
          .select('*')
          .in('cluster_id', clusterIds)
          .order('created_at', { ascending: false }),
        supabase
          .from('resources_unused')
          .select('*')
          .in('cluster_id', clusterIds)
          .order('days_without_use', { ascending: false })
      ]);

      if (createdResult.error) {
        console.error('Error fetching created resources:', createdResult.error);
      } else {
        setCreatedResources(createdResult.data || []);
      }

      if (unusedResult.error) {
        console.error('Error fetching unused resources:', unusedResult.error);
      } else {
        setUnusedResources(unusedResult.data || []);
      }

    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar recursos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  return {
    createdResources,
    unusedResources,
    loading,
    refetch: fetchResources,
  };
};
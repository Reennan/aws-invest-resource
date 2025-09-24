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
      const { data, error } = await supabase
        .from('clusters')
        .select('*')
        .order('created_at', { ascending: false });

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
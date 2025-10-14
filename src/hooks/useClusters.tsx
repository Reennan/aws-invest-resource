import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
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
      const data = await apiClient.getClusters();
      setClusters(data || []);
    } catch (error) {
      toast({
        title: "Erro", 
        description: "Erro ao carregar clusters",
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
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
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
      const [createdData, unusedData] = await Promise.all([
        apiClient.getResourcesCreated(),
        apiClient.getResourcesUnused()
      ]);

      setCreatedResources(createdData || []);
      setUnusedResources(unusedData || []);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar recursos",
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
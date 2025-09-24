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
      const [createdResult, unusedResult] = await Promise.all([
        supabase
          .from('resources_created')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('resources_unused')
          .select('*')
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
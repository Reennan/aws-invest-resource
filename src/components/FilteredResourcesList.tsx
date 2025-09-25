import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Calendar, Server, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FilteredResourcesListProps {
  selectedCluster: string;
  selectedType: string;
  refreshTrigger?: number;
}

interface Resource {
  id: string;
  name: string;
  type: string;
  account_name: string;
  console_link?: string;
  created_at?: string;
  cluster_id: string;
}

export const FilteredResourcesList = ({ 
  selectedCluster, 
  selectedType, 
  refreshTrigger 
}: FilteredResourcesListProps) => {
  const [createdResources, setCreatedResources] = useState<Resource[]>([]);
  const [unusedResources, setUnusedResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchResources = async () => {
    setLoading(true);
    try {
      // Build query for created resources
      let createdQuery = supabase
        .from('resources_created')
        .select('*')
        .order('created_at', { ascending: false });

      if (selectedCluster !== 'all') {
        createdQuery = createdQuery.eq('cluster_id', selectedCluster);
      }

      if (selectedType !== 'all') {
        createdQuery = createdQuery.eq('type', selectedType);
      }

      // Build query for unused resources  
      let unusedQuery = supabase
        .from('resources_unused')
        .select('*')
        .order('id', { ascending: false });

      if (selectedCluster !== 'all') {
        unusedQuery = unusedQuery.eq('cluster_id', selectedCluster);
      }

      if (selectedType !== 'all') {
        unusedQuery = unusedQuery.eq('type', selectedType);
      }

      const [createdResult, unusedResult] = await Promise.all([
        createdQuery,
        unusedQuery
      ]);

      if (createdResult.error) throw createdResult.error;
      if (unusedResult.error) throw unusedResult.error;

      setCreatedResources(createdResult.data || []);
      setUnusedResources(unusedResult.data || []);
    } catch (error) {
      console.error('Error fetching filtered resources:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [selectedCluster, selectedType, refreshTrigger]);

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'ec2': 'bg-blue-100 text-blue-800',
      'lambda': 'bg-orange-100 text-orange-800',
      'elb': 'bg-green-100 text-green-800',
      's3': 'bg-purple-100 text-purple-800',
      'rds': 'bg-red-100 text-red-800',
      'cloudwatch': 'bg-yellow-100 text-yellow-800',
    };
    return colors[type?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="w-32 h-6 bg-muted animate-pulse rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="p-4 border rounded-lg animate-pulse">
                    <div className="space-y-2">
                      <div className="w-48 h-4 bg-muted rounded"></div>
                      <div className="w-32 h-3 bg-muted rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Created Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-green-600" />
            Recursos Criados ({createdResources.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {createdResources.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum recurso criado encontrado
            </div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto">
              {createdResources.map((resource) => (
                <div key={resource.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{resource.name}</h4>
                        <Badge className={getTypeColor(resource.type)}>
                          {resource.type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Server className="h-3 w-3" />
                          {resource.account_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(resource.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                    {resource.console_link && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(resource.console_link, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Unused Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-orange-600" />
            Recursos Sem Uso ({unusedResources.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {unusedResources.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum recurso sem uso encontrado
            </div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto">
              {unusedResources.map((resource) => (
                <div key={resource.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{resource.name}</h4>
                        <Badge className={getTypeColor(resource.type)}>
                          {resource.type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Server className="h-3 w-3" />
                          {resource.account_name}
                        </span>
                        {(resource as any).days_without_use && (
                          <span>
                            {(resource as any).days_without_use} dias sem uso
                          </span>
                        )}
                      </div>
                    </div>
                    {resource.console_link && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(resource.console_link, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
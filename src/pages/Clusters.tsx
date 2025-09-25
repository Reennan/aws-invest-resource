import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useClusters } from '@/hooks/useClusters';
import { useResources } from '@/hooks/useResources';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Server, Activity, AlertTriangle } from 'lucide-react';
import { ResourceFilters } from '@/components/ResourceFilters';
import { PaginatedResourceTable } from '@/components/PaginatedResourceTable';

const Clusters = () => {
  const { profile } = useAuth();
  const { clusters, loading: clustersLoading } = useClusters();
  const { createdResources, unusedResources, loading: resourcesLoading } = useResources();
  const [selectedCluster, setSelectedCluster] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [activeTab, setActiveTab] = useState('created');

  // Reset filters when changing tabs - HOOK MOVED TO TOP
  useEffect(() => {
    setSelectedCluster('all');
    setSelectedType('all');
  }, [activeTab]);

  if (!profile?.can_view_clusters) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Acesso Negado</h1>
          <p className="text-muted-foreground mt-2">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    );
  }

  const loading = clustersLoading || resourcesLoading;

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Filtra recursos baseado nos filtros selecionados
  const getFilteredResources = () => {
    let created = [...createdResources];
    let unused = [...unusedResources];

    // Filtro por cluster
    if (selectedCluster !== 'all') {
      created = created.filter(r => r.cluster_id === selectedCluster);
      unused = unused.filter(r => r.cluster_id === selectedCluster);
    }

    // Filtro por tipo
    if (selectedType !== 'all') {
      created = created.filter(r => r.type === selectedType);
      unused = unused.filter(r => r.type === selectedType);
    }

    return { created, unused };
  };

  const filteredResources = getFilteredResources();

  const handleClearFilters = () => {
    setSelectedCluster('all');
    setSelectedType('all');
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Clusters</h1>
        <p className="text-muted-foreground">Gerencie e visualize recursos dos clusters AWS</p>
      </div>

      {/* Resumo dos Clusters */}
      <div className="grid gap-6">
        {clusters.map((cluster) => {
          const clusterCreated = createdResources.filter(r => r.cluster_id === cluster.id);
          const clusterUnused = unusedResources.filter(r => r.cluster_id === cluster.id);
          
          return (
            <Card key={cluster.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                      <Server className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{cluster.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={cluster.is_active ? 'default' : 'secondary'}>
                          {cluster.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Criado em {new Date(cluster.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-success">{clusterCreated.length}</div>
                      <div className="text-xs text-muted-foreground">Recursos</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-warning">{clusterUnused.length}</div>
                      <div className="text-xs text-muted-foreground">Sem Uso</div>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      {/* Recursos com Filtros e Paginação */}
      <Card>
        <CardHeader>
          <CardTitle>Recursos dos Clusters</CardTitle>
          <p className="text-muted-foreground">
            Visualize e filtre recursos criados e sem uso nos clusters
          </p>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="created" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Recursos Criados ({filteredResources.created.length})
              </TabsTrigger>
              <TabsTrigger value="unused" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Recursos Sem Uso ({filteredResources.unused.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="created" className="mt-6 space-y-6">
              <ResourceFilters
                selectedCluster={selectedCluster}
                selectedType={selectedType}
                onClusterChange={setSelectedCluster}
                onTypeChange={setSelectedType}
                onClearFilters={handleClearFilters}
                clusters={clusters}
              />
              
              <PaginatedResourceTable 
                resources={filteredResources.created}
                type="created"
              />
            </TabsContent>
            
            <TabsContent value="unused" className="mt-6 space-y-6">
              <ResourceFilters
                selectedCluster={selectedCluster}
                selectedType={selectedType}
                onClusterChange={setSelectedCluster}
                onTypeChange={setSelectedType}
                onClearFilters={handleClearFilters}
                clusters={clusters}
              />
              
              <PaginatedResourceTable 
                resources={filteredResources.unused}
                type="unused"
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Clusters;
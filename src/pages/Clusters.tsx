import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useClusters } from '@/hooks/useClusters';
import { useResources } from '@/hooks/useResources';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Server, Activity, AlertTriangle, ArrowLeft, Database, TrendingUp, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResourceFilters } from '@/components/ResourceFilters';
import { PaginatedResourceTable } from '@/components/PaginatedResourceTable';

const Clusters = () => {
  const { profile } = useAuth();
  const { clusters, loading: clustersLoading } = useClusters();
  const { createdResources, unusedResources, loading: resourcesLoading } = useResources();
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState('all');
  const [activeTab, setActiveTab] = useState('created');

  useEffect(() => {
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

  const getFilteredResources = () => {
    if (!selectedCluster) return { created: [], unused: [] };
    
    let created = createdResources.filter(r => r.cluster_id === selectedCluster);
    let unused = unusedResources.filter(r => r.cluster_id === selectedCluster);

    if (selectedType !== 'all') {
      created = created.filter(r => r.type === selectedType);
      unused = unused.filter(r => r.type === selectedType);
    }

    return { created, unused };
  };

  const filteredResources = getFilteredResources();
  const selectedClusterData = clusters.find(c => c.id === selectedCluster);

  const handleClearFilters = () => {
    setSelectedType('all');
  };

  const handleBackToClusters = () => {
    setSelectedCluster(null);
    setSelectedType('all');
  };

  // Cluster List View
  if (!selectedCluster) {
    const totalResources = createdResources.length;
    const totalUnused = unusedResources.length;
    const activeClusters = clusters.filter(c => c.is_active).length;

    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
        <div className="max-w-[1600px] mx-auto p-6 space-y-8 animate-fade-in">
          
          {/* Hero Header */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-accent p-8 shadow-xl border-2 border-accent/20">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48 blur-3xl"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                  <Server className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white tracking-tight">Clusters AWS</h1>
                  <p className="text-white/90 text-lg mt-1">Gerencie e monitore seus clusters de recursos</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="bg-white/20 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/30">
                  <div className="text-2xl font-bold text-white">{clusters.length}</div>
                  <div className="text-white/80 text-sm">Total</div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/30">
                  <div className="text-2xl font-bold text-white">{activeClusters}</div>
                  <div className="text-white/80 text-sm">Ativos</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-card to-primary/5">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-xl bg-gradient-primary flex items-center justify-center shadow-lg">
                    <Database className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Total de Recursos</p>
                    <p className="text-3xl font-bold">{totalResources}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-card to-warning/5">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-xl bg-gradient-danger flex items-center justify-center shadow-lg">
                    <AlertTriangle className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Recursos Sem Uso</p>
                    <p className="text-3xl font-bold text-warning">{totalUnused}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-card to-success/5">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-xl bg-gradient-accent flex items-center justify-center shadow-lg">
                    <TrendingUp className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Taxa de Utilização</p>
                    <p className="text-3xl font-bold text-success">
                      {totalResources > 0 ? Math.round(((totalResources - totalUnused) / totalResources) * 100) : 0}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Clusters Grid */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-1 bg-gradient-primary rounded-full"></div>
              <h2 className="text-2xl font-bold">Selecione um Cluster</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {clusters.map((cluster) => {
                const clusterCreated = createdResources.filter(r => r.cluster_id === cluster.id);
                const clusterUnused = unusedResources.filter(r => r.cluster_id === cluster.id);
                const utilizationRate = clusterCreated.length > 0 
                  ? Math.round(((clusterCreated.length - clusterUnused.length) / clusterCreated.length) * 100)
                  : 0;
                
                return (
                  <Card 
                    key={cluster.id} 
                    className="group cursor-pointer hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 border-2 hover:border-primary/50 bg-gradient-to-br from-card to-accent/5"
                    onClick={() => setSelectedCluster(cluster.id)}
                  >
                    <CardHeader className="border-b bg-muted/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <Server className="h-6 w-6 text-primary-foreground" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{cluster.name}</CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={cluster.is_active ? 'default' : 'secondary'} className="text-xs">
                                {cluster.is_active ? 'Ativo' : 'Inativo'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 bg-success/10 rounded-lg border border-success/20">
                            <div className="text-2xl font-bold text-success">{clusterCreated.length}</div>
                            <div className="text-xs text-muted-foreground mt-1">Recursos</div>
                          </div>
                          <div className="text-center p-3 bg-warning/10 rounded-lg border border-warning/20">
                            <div className="text-2xl font-bold text-warning">{clusterUnused.length}</div>
                            <div className="text-xs text-muted-foreground mt-1">Sem Uso</div>
                          </div>
                        </div>
                        
                        <div className="pt-2">
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-muted-foreground">Taxa de Utilização</span>
                            <span className="font-bold text-primary">{utilizationRate}%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-primary transition-all duration-500"
                              style={{ width: `${utilizationRate}%` }}
                            />
                          </div>
                        </div>

                        <div className="text-xs text-muted-foreground text-center pt-2">
                          Criado em {new Date(cluster.created_at).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Cluster Detail View
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="max-w-[1600px] mx-auto p-6 space-y-8 animate-fade-in">
        
        {/* Header with Back Button */}
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="lg"
            onClick={handleBackToClusters}
            className="gap-2 border-2 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
            Voltar aos Clusters
          </Button>
          
          <div className="flex-1">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-gradient-primary flex items-center justify-center shadow-lg">
                <Server className="h-7 w-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{selectedClusterData?.name}</h1>
                <p className="text-muted-foreground text-lg">Visualize e gerencie os recursos deste cluster</p>
              </div>
            </div>
          </div>

          <Badge 
            variant={selectedClusterData?.is_active ? 'default' : 'secondary'}
            className="h-8 px-4 text-sm"
          >
            {selectedClusterData?.is_active ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>

        {/* Resources Tabs */}
        <Card className="border-2 shadow-xl">
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-14 p-1 bg-muted/50">
                <TabsTrigger 
                  value="created" 
                  className="flex items-center gap-3 text-base data-[state=active]:bg-gradient-primary data-[state=active]:text-white"
                >
                  <Activity className="h-5 w-5" />
                  <span>Recursos Criados</span>
                  <Badge variant="secondary" className="ml-auto">
                    {filteredResources.created.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger 
                  value="unused"
                  className="flex items-center gap-3 text-base data-[state=active]:bg-gradient-danger data-[state=active]:text-white"
                >
                  <AlertTriangle className="h-5 w-5" />
                  <span>Recursos Sem Uso</span>
                  <Badge variant="secondary" className="ml-auto">
                    {filteredResources.unused.length}
                  </Badge>
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
                  hideClusterFilter={true}
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
                  hideClusterFilter={true}
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
    </div>
  );
};

export default Clusters;
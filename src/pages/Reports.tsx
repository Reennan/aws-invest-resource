import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useResources } from '@/hooks/useResources';
import { useClusters } from '@/hooks/useClusters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, AlertTriangle, Calendar } from 'lucide-react';
import { ReportsFilters } from '@/components/ReportsFilters';
import { PaginatedResourceTable } from '@/components/PaginatedResourceTable';
import { useToast } from '@/hooks/use-toast';

const Reports = () => {
  const { profile } = useAuth();
  const { createdResources, unusedResources, loading } = useResources();
  const { clusters } = useClusters();
  const { toast } = useToast();
  
  // Estados dos filtros
  const [selectedClusters, setSelectedClusters] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  if (!profile?.can_view_reports) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Acesso Negado</h1>
          <p className="text-muted-foreground mt-2">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    );
  }

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
    if (selectedClusters.length > 0) {
      created = created.filter(r => selectedClusters.includes(r.cluster_id));
      unused = unused.filter(r => selectedClusters.includes(r.cluster_id));
    }

    // Filtro por tipo
    if (selectedTypes.length > 0) {
      created = created.filter(r => selectedTypes.includes(r.type));
      unused = unused.filter(r => selectedTypes.includes(r.type));
    }

    // Filtro por data
    if (startDate) {
      created = created.filter(r => r.created_at && new Date(r.created_at) >= startDate);
    }
    if (endDate) {
      created = created.filter(r => r.created_at && new Date(r.created_at) <= endDate);
    }

    return { created, unused };
  };

  const filteredResources = getFilteredResources();

  // Estatísticas gerais (sempre baseadas no total, não filtrado)
  const totalResources = createdResources.length;
  const totalUnused = unusedResources.length;
  const unusedPercentage = totalResources > 0 ? ((totalUnused / totalResources) * 100).toFixed(1) : '0';

  const handleClearFilters = () => {
    setSelectedClusters([]);
    setSelectedTypes([]);
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const handleExportReport = (format: 'csv' | 'xlsx') => {
    // Simular exportação
    toast({
      title: "Exportação",
      description: `Relatório ${format.toUpperCase()} será baixado em breve!`,
    });
    
    // Aqui seria implementada a lógica de exportação real
    console.log('Exporting report:', format, {
      selectedClusters,
      selectedTypes,
      startDate,
      endDate,
      filteredResources
    });
  };

  // Recursos por tipo (filtrados)
  const resourcesByType = filteredResources.created.reduce((acc, resource) => {
    acc[resource.type] = (acc[resource.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Recursos sem uso por tipo (filtrados)
  const unusedByType = filteredResources.unused.reduce((acc, resource) => {
    acc[resource.type] = (acc[resource.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-6 pt-2 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Relatórios</h1>
        <p className="text-muted-foreground">Análise detalhada e exportação de recursos AWS</p>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Recursos</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalResources}</div>
            <p className="text-xs text-muted-foreground">Em todos os clusters</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recursos Sem Uso</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{totalUnused}</div>  
            <p className="text-xs text-muted-foreground">{unusedPercentage}% do total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clusters Ativos</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{clusters.filter(c => c.is_active).length}</div>
            <p className="text-xs text-muted-foreground">De {clusters.length} clusters</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Último Update</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Hoje</div>
            <p className="text-xs text-muted-foreground">Dados atualizados</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <ReportsFilters
        selectedClusters={selectedClusters}
        selectedTypes={selectedTypes}
        startDate={startDate}
        endDate={endDate}
        onClustersChange={setSelectedClusters}
        onTypesChange={setSelectedTypes}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onClearFilters={handleClearFilters}
        onExportReport={handleExportReport}
        clusters={clusters}
      />

      {/* Relatório com Abas */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="resources">Recursos Detalhados</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recursos Criados por Tipo</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {Object.keys(resourcesByType).length > 0 ? 'Baseado nos filtros aplicados' : 'Nenhum recurso encontrado'}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(resourcesByType).length > 0 ? (
                    Object.entries(resourcesByType).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{type.toUpperCase()}</Badge>
                        </div>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-4 text-muted-foreground">
                      Nenhum recurso criado encontrado com os filtros aplicados
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recursos Sem Uso por Tipo</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {Object.keys(unusedByType).length > 0 ? 'Baseado nos filtros aplicados' : 'Nenhum recurso sem uso encontrado'}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(unusedByType).length > 0 ? (
                    Object.entries(unusedByType).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive">{type.toUpperCase()}</Badge>
                        </div>
                        <span className="font-medium text-warning">{count}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-4 text-muted-foreground">
                      Nenhum recurso sem uso encontrado com os filtros aplicados
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="resources" className="space-y-6">
          <Tabs defaultValue="created" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="created">Recursos Criados</TabsTrigger>
              <TabsTrigger value="unused">Recursos Sem Uso</TabsTrigger>
              <TabsTrigger value="all">Todos os Recursos</TabsTrigger>
            </TabsList>
            
            <TabsContent value="created">
              <Card>
                <CardHeader>
                  <CardTitle>Recursos Criados</CardTitle>
                  <p className="text-muted-foreground">
                    {filteredResources.created.length} recursos encontrados
                  </p>
                </CardHeader>
                <CardContent>
                  <PaginatedResourceTable 
                    resources={filteredResources.created}
                    type="created"
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="unused">
              <Card>
                <CardHeader>
                  <CardTitle>Recursos Sem Uso</CardTitle>
                  <p className="text-muted-foreground">
                    {filteredResources.unused.length} recursos encontrados
                  </p>
                </CardHeader>
                <CardContent>
                  <PaginatedResourceTable 
                    resources={filteredResources.unused}
                    type="unused"
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="all">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recursos Criados</CardTitle>
                    <p className="text-muted-foreground">
                      {filteredResources.created.length} recursos encontrados
                    </p>
                  </CardHeader>
                  <CardContent>
                    <PaginatedResourceTable 
                      resources={filteredResources.created}
                      type="created"
                    />
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Recursos Sem Uso</CardTitle>
                    <p className="text-muted-foreground">
                      {filteredResources.unused.length} recursos encontrados
                    </p>
                  </CardHeader>
                  <CardContent>
                    <PaginatedResourceTable 
                      resources={filteredResources.unused}
                      type="unused"
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
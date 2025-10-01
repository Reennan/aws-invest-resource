import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useResources } from '@/hooks/useResources';
import { useClusters } from '@/hooks/useClusters';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  Calendar, 
  FileText,
  Download,
  PieChart,
  Activity
} from 'lucide-react';
import { ReportsFilters } from '@/components/ReportsFilters';
import { PaginatedResourceTable } from '@/components/PaginatedResourceTable';
import { useToast } from '@/hooks/use-toast';
import { exportToCSV, exportToExcel } from '@/lib/exportUtils';

const Reports = () => {
  const { profile } = useAuth();
  const { createdResources, unusedResources, loading } = useResources();
  const { clusters } = useClusters();
  const { toast } = useToast();
  
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

  const getFilteredResources = () => {
    let created = [...createdResources];
    let unused = [...unusedResources];

    if (selectedClusters.length > 0) {
      created = created.filter(r => selectedClusters.includes(r.cluster_id));
      unused = unused.filter(r => selectedClusters.includes(r.cluster_id));
    }

    if (selectedTypes.length > 0) {
      created = created.filter(r => selectedTypes.includes(r.type));
      unused = unused.filter(r => selectedTypes.includes(r.type));
    }

    if (startDate) {
      created = created.filter(r => r.created_at && new Date(r.created_at) >= startDate);
    }
    if (endDate) {
      created = created.filter(r => r.created_at && new Date(r.created_at) <= endDate);
    }

    return { created, unused };
  };

  const filteredResources = getFilteredResources();
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
    try {
      const clustersMap = clusters.reduce((acc, cluster) => {
        acc[cluster.id] = cluster.name;
        return acc;
      }, {} as Record<string, string>);

      if (format === 'csv') {
        exportToCSV(filteredResources.created, filteredResources.unused, clustersMap);
      } else if (format === 'xlsx') {
        exportToExcel(filteredResources.created, filteredResources.unused, clustersMap);
      }

      toast({
        title: "Exportação Concluída",
        description: `Relatório ${format.toUpperCase()} foi baixado com sucesso!`,
      });
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast({
        title: "Erro na Exportação",
        description: `Ocorreu um erro ao gerar o arquivo ${format.toUpperCase()}`,
        variant: "destructive",
      });
    }
  };

  const resourcesByType = filteredResources.created.reduce((acc, resource) => {
    acc[resource.type] = (acc[resource.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const unusedByType = filteredResources.unused.reduce((acc, resource) => {
    acc[resource.type] = (acc[resource.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-info/5">
      <div className="max-w-[1600px] mx-auto p-6 space-y-8 animate-fade-in">
        
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-info to-primary p-8 shadow-xl border-2 border-primary/20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full -ml-32 -mb-32 blur-3xl"></div>
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white tracking-tight">Relatórios & Análises</h1>
                <p className="text-white/90 text-lg mt-1">Análise detalhada e exportação de recursos AWS</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="bg-white/20 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/30">
                <Download className="h-6 w-6 text-white mx-auto mb-1" />
                <div className="text-white/80 text-xs text-center">Exportar</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-card to-primary/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Total de Recursos
              </CardTitle>
              <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-primary-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalResources}</div>
              <p className="text-xs text-muted-foreground mt-1">Em todos os clusters</p>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-card to-warning/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Recursos Sem Uso
              </CardTitle>
              <div className="h-10 w-10 rounded-lg bg-gradient-danger flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-warning">{totalUnused}</div>  
              <p className="text-xs text-muted-foreground mt-1">{unusedPercentage}% do total</p>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-card to-success/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Clusters Ativos
              </CardTitle>
              <div className="h-10 w-10 rounded-lg bg-gradient-accent flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">{clusters.filter(c => c.is_active).length}</div>
              <p className="text-xs text-muted-foreground mt-1">De {clusters.length} clusters</p>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-card to-info/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Último Update
              </CardTitle>
              <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Calendar className="h-5 w-5 text-primary-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">Hoje</div>
              <p className="text-xs text-muted-foreground mt-1">Dados atualizados</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-1 bg-gradient-primary rounded-full"></div>
            <h2 className="text-2xl font-bold">Filtros e Exportação</h2>
          </div>
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
        </div>

        {/* Reports Tabs */}
        <Card className="border-2 shadow-xl">
          <Tabs defaultValue="overview" className="w-full">
            <CardHeader className="border-b bg-muted/30">
              <TabsList className="grid w-full grid-cols-2 h-14 p-1 bg-background">
                <TabsTrigger 
                  value="overview" 
                  className="flex items-center gap-2 text-base data-[state=active]:bg-gradient-primary data-[state=active]:text-white"
                >
                  <PieChart className="h-5 w-5" />
                  Overview Geral
                </TabsTrigger>
                <TabsTrigger 
                  value="resources"
                  className="flex items-center gap-2 text-base data-[state=active]:bg-gradient-accent data-[state=active]:text-white"
                >
                  <Activity className="h-5 w-5" />
                  Recursos Detalhados
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="p-6">
              <TabsContent value="overview" className="mt-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border-2 shadow-md">
                    <CardHeader className="bg-gradient-to-r from-success/5 to-transparent">
                      <CardTitle className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-gradient-accent flex items-center justify-center">
                          <BarChart3 className="h-4 w-4 text-white" />
                        </div>
                        Recursos Criados por Tipo
                      </CardTitle>
                      <CardDescription>
                        {Object.keys(resourcesByType).length > 0 ? 'Baseado nos filtros aplicados' : 'Nenhum recurso encontrado'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        {Object.entries(resourcesByType).length > 0 ? (
                          Object.entries(resourcesByType)
                            .sort(([, a], [, b]) => b - a)
                            .map(([type, count]) => (
                              <div key={type} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border hover:bg-muted/50 transition-colors">
                                <div className="flex items-center gap-3">
                                  <Badge variant="outline" className="font-mono">{type.toUpperCase()}</Badge>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="text-right">
                                    <div className="font-bold text-lg">{count}</div>
                                    <div className="text-xs text-muted-foreground">recursos</div>
                                  </div>
                                </div>
                              </div>
                            ))
                        ) : (
                          <p className="text-center py-8 text-muted-foreground">
                            Nenhum recurso criado encontrado com os filtros aplicados
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 shadow-md">
                    <CardHeader className="bg-gradient-to-r from-destructive/5 to-transparent">
                      <CardTitle className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-gradient-danger flex items-center justify-center">
                          <AlertTriangle className="h-4 w-4 text-white" />
                        </div>
                        Recursos Sem Uso por Tipo
                      </CardTitle>
                      <CardDescription>
                        {Object.keys(unusedByType).length > 0 ? 'Baseado nos filtros aplicados' : 'Nenhum recurso sem uso encontrado'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        {Object.entries(unusedByType).length > 0 ? (
                          Object.entries(unusedByType)
                            .sort(([, a], [, b]) => b - a)
                            .map(([type, count]) => (
                              <div key={type} className="flex items-center justify-between p-3 bg-warning/5 rounded-lg border border-warning/20 hover:bg-warning/10 transition-colors">
                                <div className="flex items-center gap-3">
                                  <Badge variant="destructive" className="font-mono">{type.toUpperCase()}</Badge>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="text-right">
                                    <div className="font-bold text-lg text-warning">{count}</div>
                                    <div className="text-xs text-muted-foreground">sem uso</div>
                                  </div>
                                </div>
                              </div>
                            ))
                        ) : (
                          <p className="text-center py-8 text-muted-foreground">
                            Nenhum recurso sem uso encontrado com os filtros aplicados
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="resources" className="mt-0">
                <Tabs defaultValue="created" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="created">Recursos Criados</TabsTrigger>
                    <TabsTrigger value="unused">Recursos Sem Uso</TabsTrigger>
                    <TabsTrigger value="all">Todos os Recursos</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="created">
                    <Card className="border-2">
                      <CardHeader className="bg-gradient-to-r from-success/5 to-transparent border-b">
                        <CardTitle className="flex items-center gap-2">
                          <Activity className="h-5 w-5 text-success" />
                          Recursos Criados
                        </CardTitle>
                        <CardDescription>
                          {filteredResources.created.length} recursos encontrados
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <PaginatedResourceTable 
                          resources={filteredResources.created}
                          type="created"
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="unused">
                    <Card className="border-2">
                      <CardHeader className="bg-gradient-to-r from-warning/5 to-transparent border-b">
                        <CardTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-warning" />
                          Recursos Sem Uso
                        </CardTitle>
                        <CardDescription>
                          {filteredResources.unused.length} recursos encontrados
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <PaginatedResourceTable 
                          resources={filteredResources.unused}
                          type="unused"
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="all">
                    <div className="space-y-6">
                      <Card className="border-2">
                        <CardHeader className="bg-gradient-to-r from-success/5 to-transparent border-b">
                          <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5 text-success" />
                            Recursos Criados
                          </CardTitle>
                          <CardDescription>
                            {filteredResources.created.length} recursos encontrados
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                          <PaginatedResourceTable 
                            resources={filteredResources.created}
                            type="created"
                          />
                        </CardContent>
                      </Card>
                      
                      <Card className="border-2">
                        <CardHeader className="bg-gradient-to-r from-warning/5 to-transparent border-b">
                          <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-warning" />
                            Recursos Sem Uso
                          </CardTitle>
                          <CardDescription>
                            {filteredResources.unused.length} recursos encontrados
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
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
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
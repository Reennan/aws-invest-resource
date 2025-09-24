import { useAuth } from '@/hooks/useAuth';
import { useResources } from '@/hooks/useResources';
import { useClusters } from '@/hooks/useClusters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, AlertTriangle, Clock, Calendar, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Reports = () => {
  const { profile } = useAuth();
  const { createdResources, unusedResources, loading } = useResources();
  const { clusters } = useClusters();

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

  // Estatísticas gerais
  const totalResources = createdResources.length;
  const totalUnused = unusedResources.length;
  const unusedPercentage = totalResources > 0 ? ((totalUnused / totalResources) * 100).toFixed(1) : '0';

  // Recursos por tipo
  const resourcesByType = createdResources.reduce((acc, resource) => {
    acc[resource.type] = (acc[resource.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Recursos sem uso por tipo
  const unusedByType = unusedResources.reduce((acc, resource) => {
    acc[resource.type] = (acc[resource.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Recursos mais antigos sem uso
  const oldestUnused = [...unusedResources]
    .sort((a, b) => b.days_without_use - a.days_without_use)
    .slice(0, 10);

  // Clusters com mais recursos sem uso
  const clusterStats = clusters.map(cluster => {
    const clusterUnused = unusedResources.filter(r => r.cluster_id === cluster.id);
    const clusterTotal = createdResources.filter(r => r.cluster_id === cluster.id);
    return {
      name: cluster.name,
      unused: clusterUnused.length,
      total: clusterTotal.length,
      percentage: clusterTotal.length > 0 ? ((clusterUnused.length / clusterTotal.length) * 100).toFixed(1) : '0'
    };
  }).sort((a, b) => b.unused - a.unused);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground">Análise detalhada dos recursos AWS</p>
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Exportar Relatório
        </Button>
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

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="by-type">Por Tipo</TabsTrigger>
          <TabsTrigger value="by-cluster">Por Cluster</TabsTrigger>
          <TabsTrigger value="old-resources">Recursos Antigos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recursos por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(resourcesByType).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{type}</Badge>
                      </div>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recursos Sem Uso por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(unusedByType).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive">{type}</Badge>
                      </div>
                      <span className="font-medium text-warning">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="by-cluster" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Análise por Cluster</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cluster</TableHead>
                    <TableHead>Total de Recursos</TableHead>
                    <TableHead>Recursos Sem Uso</TableHead>
                    <TableHead>Percentual</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clusterStats.map((cluster) => (
                    <TableRow key={cluster.name}>
                      <TableCell className="font-medium">{cluster.name}</TableCell>
                      <TableCell>{cluster.total}</TableCell>
                      <TableCell>
                        <span className="text-warning font-medium">{cluster.unused}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={Number(cluster.percentage) > 20 ? 'destructive' : 'secondary'}>
                          {cluster.percentage}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="old-resources" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recursos com Maior Tempo Sem Uso</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Conta</TableHead>
                    <TableHead>Dias sem Uso</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {oldestUnused.map((resource) => (
                    <TableRow key={resource.id}>
                      <TableCell className="font-medium">{resource.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{resource.type}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{resource.account_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-warning" />
                          <span className="font-medium text-warning">{resource.days_without_use} dias</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive">{resource.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
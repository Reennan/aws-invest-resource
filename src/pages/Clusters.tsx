import { useAuth } from '@/hooks/useAuth';
import { useClusters } from '@/hooks/useClusters';
import { useResources } from '@/hooks/useResources';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExternalLink, Server, Activity, Clock, AlertTriangle } from 'lucide-react';

const Clusters = () => {
  const { profile } = useAuth();
  const { clusters, loading: clustersLoading } = useClusters();
  const { createdResources, unusedResources, loading: resourcesLoading } = useResources();

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

  const getResourcesByCluster = (clusterId: string) => {
    const created = createdResources.filter(r => r.cluster_id === clusterId);
    const unused = unusedResources.filter(r => r.cluster_id === clusterId);
    return { created, unused };
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Clusters</h1>
        <p className="text-muted-foreground">Gerencie seus clusters AWS</p>
      </div>

      <div className="grid gap-6">
        {clusters.map((cluster) => {
          const { created, unused } = getResourcesByCluster(cluster.id);
          
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
                  <div className="flex gap-2">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-success">{created.length}</div>
                      <div className="text-xs text-muted-foreground">Recursos</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-warning">{unused.length}</div>
                      <div className="text-xs text-muted-foreground">Sem Uso</div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="created" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="created" className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Recursos Criados ({created.length})
                    </TabsTrigger>
                    <TabsTrigger value="unused" className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Recursos Sem Uso ({unused.length})
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="created" className="mt-4">
                    {created.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Conta</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Criado</TableHead>
                            <TableHead>Console</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {created.map((resource) => (
                            <TableRow key={resource.id}>
                              <TableCell className="font-medium">{resource.name}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{resource.type}</Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">{resource.account_name}</TableCell>
                              <TableCell>
                                <Badge variant={resource.manage_status === 'active' ? 'default' : 'secondary'}>
                                  {resource.manage_status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm">
                                {new Date(resource.created_at).toLocaleDateString('pt-BR')}
                              </TableCell>
                              <TableCell>
                                <Button size="sm" variant="ghost" asChild>
                                  <a href={resource.console_link} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        Nenhum recurso criado encontrado
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="unused" className="mt-4">
                    {unused.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Conta</TableHead>
                            <TableHead>Dias sem Uso</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Console</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {unused.map((resource) => (
                            <TableRow key={resource.id}>
                              <TableCell className="font-medium">{resource.name}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{resource.type}</Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">{resource.account_name}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-warning" />
                                  <span className="font-medium">{resource.days_without_use} dias</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="destructive">{resource.status}</Badge>
                              </TableCell>
                              <TableCell>
                                <Button size="sm" variant="ghost" asChild>
                                  <a href={resource.console_link} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        Nenhum recurso sem uso encontrado
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Clusters;
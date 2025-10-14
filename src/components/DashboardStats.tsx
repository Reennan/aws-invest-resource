import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Database, AlertTriangle, CheckCircle, TrendingUp, Users, ExternalLink } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PaginatedResourceTable } from '@/components/PaginatedResourceTable';
import { useRealtime } from '@/hooks/useRealtime';
import { Server, Plus, RefreshCw } from 'lucide-react';

interface DashboardStatsProps {
  statsOnly?: boolean;
  sectionsOnly?: boolean;
}

interface DashboardTotals {
  generated_at: string;
  clusters_disponiveis: number;
  recursos_criados_periodo: number;
  recursos_sem_uso_periodo: number;
}

interface RecentResource {
  id: string;
  name: string;
  type: string;
  created_at: string;
  console_link: string;
  account_name: string;
  cluster_id: string;
}

interface UnusedByType {
  type: string;
  total: number;
}

const DashboardStats = ({ statsOnly = false, sectionsOnly = false }: DashboardStatsProps = {}) => {
  const [totals, setTotals] = useState<DashboardTotals | null>(null);
  const [recentResources, setRecentResources] = useState<RecentResource[]>([]);
  const [unusedByType, setUnusedByType] = useState<UnusedByType[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingResources, setLoadingResources] = useState(false);
  const [loadingUnusedTypes, setLoadingUnusedTypes] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      
      // Fetch dashboard stats (totals)
      const dashboardData = await apiClient.getDashboardStats();
      setTotals(dashboardData);

      // Fetch recent resources (last 10)
      setLoadingResources(true);
      const recentData = await apiClient.getResourcesCreated();
      setRecentResources(recentData?.slice(0, 10) || []);
      setLoadingResources(false);

      // Fetch unused by type
      setLoadingUnusedTypes(true);
      const unusedData = await apiClient.getUnusedByType();
      setUnusedByType(unusedData?.slice(0, 8) || []);
      setLoadingUnusedTypes(false);

    } catch (error) {
      console.error('Error in fetchDashboardData:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const { connected, lastUpdate } = useRealtime((data) => {
    // Refresh data when realtime updates occur
    fetchDashboardData();
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-muted rounded w-24"></div>
              <div className="h-4 w-4 bg-muted rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-16 mb-2"></div>
              <div className="h-3 bg-muted rounded w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'EC2': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      'S3': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
      'RDS': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      'Lambda': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      'ELB': 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
      'CloudWatch': 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300',
    };
    return colors[type] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
  };

  // Return only main stats if statsOnly is true
  if (statsOnly) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-medium border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clusters Ativos</CardTitle>
            <Server className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals?.clusters_disponiveis || 0}</div>
            <p className="text-xs text-muted-foreground">
              Clusters de contas AWS
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-medium border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recursos Criados</CardTitle>
            <Plus className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {totals?.recursos_criados_periodo || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Últimos 30 dias
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-medium border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recursos Sem Uso</CardTitle>
            <AlertTriangle className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-600">
              {totals?.recursos_sem_uso_periodo || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Precisam de atenção
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-medium border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status Tempo Real</CardTitle>
            <Activity className={`h-4 w-4 ${connected ? 'text-success' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${connected ? 'bg-success animate-pulse' : 'bg-muted-foreground'}`} />
              <span className="text-sm font-medium">
                {connected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {lastUpdate ? `Atualizado ${lastUpdate.toLocaleTimeString()}` : 'Nenhuma atualização ainda'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Return only sections if sectionsOnly is true
  if (sectionsOnly) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Resources */}
        <Card className="shadow-medium border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Criados Recentemente</CardTitle>
            <RefreshCw className={`h-4 w-4 text-muted-foreground ${refreshing ? 'animate-spin' : ''}`} />
          </CardHeader>
          <CardContent>
            {loadingResources ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <div className="h-8 w-8 bg-muted rounded animate-pulse"></div>
                    <div className="space-y-1 flex-1">
                      <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
                      <div className="h-3 bg-muted rounded w-1/2 animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentResources.length > 0 ? (
              <PaginatedResourceTable 
                resources={recentResources} 
                type="created" 
                itemsPerPage={5}
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhum recurso criado recentemente</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Unused by Type */}
        <Card className="shadow-medium border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Sem Uso por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingUnusedTypes ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="h-4 bg-muted rounded w-1/3 animate-pulse"></div>
                    <div className="h-4 bg-muted rounded w-16 animate-pulse"></div>
                  </div>
                ))}
              </div>
            ) : unusedByType.length > 0 ? (
              <PaginatedResourceTable 
                resources={unusedByType.map(item => ({
                  id: item.type || 'unknown',
                  name: item.type || 'Desconhecido',
                  type: item.type || 'unknown',
                  account_name: `${item.total || 0} recursos`,
                  cluster_id: '',
                  days_without_use: item.total || 0,
                  status: 'sem uso'
                }))} 
                type="unused" 
                itemsPerPage={5}
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhum recurso sem uso encontrado</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-medium border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clusters Ativos</CardTitle>
            <Server className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals?.clusters_disponiveis || 0}</div>
            <p className="text-xs text-muted-foreground">
              Clusters de contas AWS
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-medium border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recursos Criados</CardTitle>
            <Plus className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {totals?.recursos_criados_periodo || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Últimos 30 dias
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-medium border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recursos Sem Uso</CardTitle>
            <AlertTriangle className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-600">
              {totals?.recursos_sem_uso_periodo || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Precisam de atenção
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-medium border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status Tempo Real</CardTitle>
            <Activity className={`h-4 w-4 ${connected ? 'text-success' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${connected ? 'bg-success animate-pulse' : 'bg-muted-foreground'}`} />
              <span className="text-sm font-medium">
                {connected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {lastUpdate ? `Atualizado ${lastUpdate.toLocaleTimeString()}` : 'Nenhuma atualização ainda'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Resources and Unused Types */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Resources */}
        <Card className="shadow-medium border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Criados Recentemente</CardTitle>
            <RefreshCw className={`h-4 w-4 text-muted-foreground ${refreshing ? 'animate-spin' : ''}`} />
          </CardHeader>
          <CardContent>
            {loadingResources ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <div className="h-8 w-8 bg-muted rounded animate-pulse"></div>
                    <div className="space-y-1 flex-1">
                      <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
                      <div className="h-3 bg-muted rounded w-1/2 animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentResources.length > 0 ? (
              <PaginatedResourceTable 
                resources={recentResources} 
                type="created" 
                itemsPerPage={5}
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhum recurso criado recentemente</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Unused by Type */}
        <Card className="shadow-medium border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Sem Uso por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingUnusedTypes ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="h-4 bg-muted rounded w-1/3 animate-pulse"></div>
                    <div className="h-4 bg-muted rounded w-16 animate-pulse"></div>
                  </div>
                ))}
              </div>
            ) : unusedByType.length > 0 ? (
              <PaginatedResourceTable 
                resources={unusedByType.map(item => ({
                  id: item.type || 'unknown',
                  name: item.type || 'Desconhecido',
                  type: item.type || 'unknown',
                  account_name: `${item.total || 0} recursos`,
                  cluster_id: '',
                  days_without_use: item.total || 0,
                  status: 'sem uso'
                }))} 
                type="unused" 
                itemsPerPage={5}
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhum recurso sem uso encontrado</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardStats;
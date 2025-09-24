import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRealtime } from '@/hooks/useRealtime';
import { Server, Plus, AlertTriangle, Activity, RefreshCw } from 'lucide-react';

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
}

interface UnusedByType {
  type: string;
  total: number;
}

const DashboardStats = () => {
  const [totals, setTotals] = useState<DashboardTotals | null>(null);
  const [recentResources, setRecentResources] = useState<RecentResource[]>([]);
  const [unusedByType, setUnusedByType] = useState<UnusedByType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      
      // Fetch dashboard totals
      const { data: totalsData, error: totalsError } = await supabase
        .from('v_dashboard_totals')
        .select('*')
        .single();

      if (totalsError) {
        console.error('Error fetching totals:', totalsError);
      } else {
        setTotals(totalsData);
      }

      // Fetch recent resources (last 10)
      const { data: recentData, error: recentError } = await supabase
        .from('resources_created')
        .select('id, name, type, created_at, console_link, account_name')
        .order('created_at', { ascending: false })
        .limit(10);

      if (recentError) {
        console.error('Error fetching recent resources:', recentError);
      } else {
        setRecentResources(recentData || []);
      }

      // Fetch unused by type
      const { data: unusedData, error: unusedError } = await supabase
        .from('v_unused_by_type')
        .select('*')
        .order('total', { ascending: false })
        .limit(8);

      if (unusedError) {
        console.error('Error fetching unused by type:', unusedError);
      } else {
        setUnusedByType(unusedData || []);
      }

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

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-medium border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Clusters</CardTitle>
            <Server className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals?.clusters_disponiveis || 0}</div>
            <p className="text-xs text-muted-foreground">
              AWS account clusters
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-medium border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resources Created</CardTitle>
            <Plus className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {totals?.recursos_criados_periodo || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-medium border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unused Resources</CardTitle>
            <AlertTriangle className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-600">
              {totals?.recursos_sem_uso_periodo || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Need attention
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-medium border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Real-time Status</CardTitle>
            <Activity className={`h-4 w-4 ${connected ? 'text-success' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${connected ? 'bg-success animate-pulse' : 'bg-muted-foreground'}`} />
              <span className="text-sm font-medium">
                {connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {lastUpdate ? `Updated ${lastUpdate.toLocaleTimeString()}` : 'No updates yet'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Resources and Unused Types */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Resources */}
        <Card className="shadow-medium border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Recently Created</CardTitle>
            <RefreshCw className={`h-4 w-4 text-muted-foreground ${refreshing ? 'animate-spin' : ''}`} />
          </CardHeader>
          <CardContent className="space-y-4">
            {recentResources.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No recent resources found
              </p>
            ) : (
              recentResources.slice(0, 5).map((resource) => (
                <div key={resource.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{resource.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getTypeColor(resource.type)} variant="secondary">
                        {resource.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {resource.account_name}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {new Date(resource.created_at).toLocaleDateString()}
                    </p>
                    {resource.console_link && (
                      <a
                        href={resource.console_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        AWS Console →
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Unused by Type */}
        <Card className="shadow-medium border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Unused by Type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {unusedByType.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No unused resources found
              </p>
            ) : (
              unusedByType.map((item) => (
                <div key={item.type} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge className={getTypeColor(item.type)} variant="secondary">
                      {item.type}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-semibold text-slate-600">{item.total}</span>
                    <p className="text-xs text-muted-foreground">resources</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardStats;
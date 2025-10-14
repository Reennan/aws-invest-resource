import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/apiClient';
import { Clock, Server } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LatestExecutionsProps {
  refreshTrigger?: number;
}

interface ExecutionData {
  cluster_id: string;
  cluster_name: string;
  created_count: number;
  unused_count: number;
  run_ts: string;
  succeeded: boolean;
}

export const LatestExecutions = ({ refreshTrigger }: LatestExecutionsProps) => {
  const [executions, setExecutions] = useState<ExecutionData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLatestExecutions = async () => {
    try {
      // Get latest runs (limited to 10)
      const runsData = await apiClient.getRuns({ limit: 10 });
      
      // Get all clusters to map cluster names
      const clustersData = await apiClient.getClusters();
      const clustersMap = new Map(clustersData?.map(c => [c.id, c.name]) || []);

      // Group by cluster and get latest execution for each
      const clusterMap = new Map<string, ExecutionData>();
      
      runsData?.forEach(run => {
        if (!clusterMap.has(run.cluster_id)) {
          clusterMap.set(run.cluster_id, {
            cluster_id: run.cluster_id,
            cluster_name: clustersMap.get(run.cluster_id) || 'Cluster Desconhecido',
            created_count: run.created_count,
            unused_count: run.unused_count,
            run_ts: run.run_ts,
            succeeded: run.succeeded
          });
        }
      });

      setExecutions(Array.from(clusterMap.values()));
    } catch (error) {
      console.error('Error fetching latest executions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestExecutions();
  }, [refreshTrigger]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Últimas Execuções
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-muted rounded"></div>
                  <div className="space-y-1">
                    <div className="w-32 h-4 bg-muted rounded"></div>
                    <div className="w-24 h-3 bg-muted rounded"></div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="w-16 h-6 bg-muted rounded"></div>
                  <div className="w-16 h-6 bg-muted rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Últimas Execuções por Cluster
        </CardTitle>
      </CardHeader>
      <CardContent>
        {executions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma execução encontrada
          </div>
        ) : (
          <div className="space-y-3">
            {executions.map((execution) => (
              <div
                key={execution.cluster_id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${execution.succeeded ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    <Server className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">{execution.cluster_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(execution.run_ts), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    +{execution.created_count} criados
                  </Badge>
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                    {execution.unused_count} sem uso
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
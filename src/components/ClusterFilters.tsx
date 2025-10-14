import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/lib/apiClient';
import { Filter } from 'lucide-react';

interface ClusterFiltersProps {
  selectedCluster: string;
  selectedType: string;
  onClusterChange: (clusterId: string) => void;
  onTypeChange: (type: string) => void;
}

interface Cluster {
  id: string;
  name: string;
}

const resourceTypes = [
  { value: 'all', label: 'Todos os Recursos' },
  { value: 'ec2', label: 'EC2' },
  { value: 'lambda', label: 'Lambda' },
  { value: 'elb', label: 'ELB' },
  { value: 's3', label: 'S3' },
  { value: 'rds', label: 'RDS' },
  { value: 'cloudwatch', label: 'CloudWatch' },
];

export const ClusterFilters = ({ 
  selectedCluster, 
  selectedType, 
  onClusterChange, 
  onTypeChange 
}: ClusterFiltersProps) => {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClusters = async () => {
      try {
        const data = await apiClient.getClusters();
        const activeClusters = data?.filter(cluster => cluster.is_active) || [];
        setClusters(activeClusters);
      } catch (error) {
        console.error('Error fetching clusters:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClusters();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filtros
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Cluster Filter */}
          <div className="space-y-2">
            <Label htmlFor="cluster-select">Cluster</Label>
            <Select 
              value={selectedCluster} 
              onValueChange={onClusterChange}
              disabled={loading}
            >
              <SelectTrigger id="cluster-select">
                <SelectValue placeholder="Selecione um cluster" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Clusters</SelectItem>
                {clusters.map((cluster) => (
                  <SelectItem key={cluster.id} value={cluster.id}>
                    {cluster.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Resource Type Filter */}
          <div className="space-y-2">
            <Label htmlFor="type-select">Tipo de Recurso</Label>
            <Select value={selectedType} onValueChange={onTypeChange}>
              <SelectTrigger id="type-select">
                <SelectValue placeholder="Selecione um tipo" />
              </SelectTrigger>
              <SelectContent>
                {resourceTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
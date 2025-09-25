import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Filter, X } from 'lucide-react';

interface ResourceFiltersProps {
  selectedCluster: string;
  selectedType: string;
  onClusterChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onClearFilters: () => void;
  clusters: { id: string; name: string }[];
}

const resourceTypes = [
  { value: 'all', label: 'Todos os Tipos' },
  { value: 'ec2', label: 'EC2' },
  { value: 'lambda', label: 'Lambda' },
  { value: 'rds', label: 'RDS' },
  { value: 's3', label: 'S3' },
  { value: 'elb', label: 'ELB' },
  { value: 'cloudformation', label: 'CloudFormation' },
  { value: 'ecs', label: 'ECS' },
  { value: 'vpc', label: 'VPC' },
];

export const ResourceFilters = ({
  selectedCluster,
  selectedType,
  onClusterChange,
  onTypeChange,
  onClearFilters,
  clusters
}: ResourceFiltersProps) => {
  const hasActiveFilters = selectedCluster !== 'all' || selectedType !== 'all';

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
          {hasActiveFilters && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onClearFilters}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Limpar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Cluster</label>
            <Select value={selectedCluster} onValueChange={onClusterChange}>
              <SelectTrigger>
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

          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de Recurso</label>
            <Select value={selectedType} onValueChange={onTypeChange}>
              <SelectTrigger>
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
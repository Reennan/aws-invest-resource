import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Filter, X, Calendar as CalendarIcon, Download } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ReportsFiltersProps {
  selectedCluster: string;
  selectedType: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
  onClusterChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  onClearFilters: () => void;
  onExportReport: (format: 'csv' | 'xlsx') => void;
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

export const ReportsFilters = ({
  selectedCluster,
  selectedType,
  startDate,
  endDate,
  onClusterChange,
  onTypeChange,
  onStartDateChange,
  onEndDateChange,
  onClearFilters,
  onExportReport,
  clusters
}: ReportsFiltersProps) => {
  const hasActiveFilters = selectedCluster !== 'all' || selectedType !== 'all' || startDate || endDate;

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Relatório
          </CardTitle>
          <div className="flex gap-2">
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
            
            <Popover>
              <PopoverTrigger asChild>
                <Button className="gap-2">
                  <Download className="h-4 w-4" />
                  Exportar
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48" align="end">
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => onExportReport('csv')}
                  >
                    Exportar CSV
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => onExportReport('xlsx')}
                  >
                    Exportar Excel
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Filtro por Cluster */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Cluster</Label>
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

          {/* Filtro por Tipo */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Tipo de Recurso</Label>
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

          {/* Data de Início */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Data de Início</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? (
                    format(startDate, "PPP", { locale: ptBR })
                  ) : (
                    <span>Selecione a data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={onStartDateChange}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Data de Fim */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Data de Fim</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? (
                    format(endDate, "PPP", { locale: ptBR })
                  ) : (
                    <span>Selecione a data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={onEndDateChange}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
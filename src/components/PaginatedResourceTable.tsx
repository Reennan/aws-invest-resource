import { usePagination } from '@/hooks/usePagination';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Resource {
  id: string;
  name: string;
  type: string;
  account_name: string;
  console_link?: string;
  created_at?: string;
  cluster_id: string;
  days_without_use?: number;
  status?: string;
}

interface PaginatedResourceTableProps {
  resources: Resource[];
  type: 'created' | 'unused';
  itemsPerPage?: number;
}

const getTypeColor = (type: string) => {
  const colors: { [key: string]: string } = {
    'ec2': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    's3': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    'rds': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    'lambda': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    'elb': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
    'cloudformation': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
  };
  
  return colors[type.toLowerCase()] || colors.default;
};

export const PaginatedResourceTable = ({ 
  resources, 
  type, 
  itemsPerPage = 5 
}: PaginatedResourceTableProps) => {
  const {
    currentData,
    currentPage,
    totalPages,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    hasNextPage,
    hasPreviousPage,
    totalItems,
    startIndex,
    endIndex
  } = usePagination({ data: resources, itemsPerPage });

  if (resources.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          {type === 'created' ? 'Nenhum recurso criado' : 'Nenhum recurso sem uso'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Resources List */}
      <div className="space-y-3">
        {currentData.map((resource) => (
          <div key={resource.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30 hover:bg-muted/50 transition-colors">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className={`h-8 w-8 rounded-lg ${type === 'created' ? 'bg-primary/10' : 'bg-destructive/10'} flex items-center justify-center flex-shrink-0`}>
                <span className={`text-xs font-semibold ${type === 'created' ? 'text-primary' : 'text-destructive'}`}>
                  {resource.type.substring(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    {resource.name}
                  </p>
                  {resource.console_link && (
                    <a
                      href={resource.console_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(resource.type)}`}>
                    {resource.type}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {resource.account_name}
                  </span>
                  {type === 'unused' && resource.status && (
                    <span className="text-xs text-muted-foreground">
                      • {resource.status}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              {type === 'created' ? (
                <p className="text-xs text-muted-foreground">
                  {resource.created_at ? format(new Date(resource.created_at), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                </p>
              ) : (
                <div className="text-right">
                  <p className="text-sm font-semibold text-destructive">
                    {resource.days_without_use || 0} dias
                  </p>
                  <p className="text-xs text-muted-foreground">sem uso</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-border/30">
          <div className="text-sm text-muted-foreground">
            Mostrando {startIndex} - {endIndex} de {totalItems} recursos
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousPage}
              disabled={!hasPreviousPage}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => goToPage(page)}
                  className="h-8 w-8 p-0 text-xs"
                >
                  {page}
                </Button>
              ))}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={!hasNextPage}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
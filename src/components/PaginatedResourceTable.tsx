import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious,
  PaginationEllipsis
} from '@/components/ui/pagination';
import { ExternalLink, Clock } from 'lucide-react';
import { usePagination } from '@/hooks/usePagination';

interface Resource {
  id: string;
  name: string;
  type: string;
  account_name: string;
  console_link?: string;
  created_at?: string;
  manage_status?: string;
  days_without_use?: number;
  status?: string;
}

interface PaginatedResourceTableProps {
  resources: Resource[];
  type: 'created' | 'unused';
}

export const PaginatedResourceTable = ({ resources, type }: PaginatedResourceTableProps) => {
  const {
    currentData,
    currentPage,
    totalPages,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    hasNextPage,
    hasPreviousPage,
    startIndex,
    endIndex,
    totalItems,
  } = usePagination({ data: resources, itemsPerPage: 10 });

  const getTypeColor = (resourceType: string) => {
    const colors: { [key: string]: string } = {
      'ec2': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      'lambda': 'bg-orange-500/10 text-orange-600 border-orange-500/20',
      'rds': 'bg-green-500/10 text-green-600 border-green-500/20',
      's3': 'bg-purple-500/10 text-purple-600 border-purple-500/20',
      'elb': 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
      'cloudformation': 'bg-pink-500/10 text-pink-600 border-pink-500/20',
      'ecs': 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
      'vpc': 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
    };
    return colors[resourceType] || 'bg-gray-500/10 text-gray-600 border-gray-500/20';
  };

  const getPaginationNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    
    return pages;
  };

  if (resources.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {type === 'created' ? 'Nenhum recurso criado encontrado' : 'Nenhum recurso sem uso encontrado'}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Informações da paginação */}
      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <span>
          Mostrando {startIndex} a {endIndex} de {totalItems} recursos
        </span>
        <span>
          Página {currentPage} de {totalPages}
        </span>
      </div>

      {/* Tabela */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Conta</TableHead>
            {type === 'created' && (
              <>
                <TableHead>Status</TableHead>
                <TableHead>Criado</TableHead>
              </>
            )}
            {type === 'unused' && (
              <>
                <TableHead>Dias sem Uso</TableHead>
                <TableHead>Status</TableHead>
              </>
            )}
            <TableHead>Console</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentData.map((resource) => (
            <TableRow key={resource.id}>
              <TableCell className="font-medium">{resource.name}</TableCell>
              <TableCell>
                <Badge variant="outline" className={getTypeColor(resource.type)}>
                  {resource.type.toUpperCase()}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {resource.account_name}
              </TableCell>
              
              {type === 'created' && (
                <>
                  <TableCell>
                    <Badge variant={resource.manage_status === 'active' ? 'default' : 'secondary'}>
                      {resource.manage_status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {resource.created_at ? new Date(resource.created_at).toLocaleDateString('pt-BR') : '-'}
                  </TableCell>
                </>
              )}
              
              {type === 'unused' && (
                <>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-warning" />
                      <span className="font-medium">{resource.days_without_use || 0} dias</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="destructive">{resource.status}</Badge>
                  </TableCell>
                </>
              )}
              
              <TableCell>
                {resource.console_link && (
                  <Button size="sm" variant="ghost" asChild>
                    <a href={resource.console_link} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Controles de paginação */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={goToPreviousPage}
                className={hasPreviousPage ? "cursor-pointer" : "cursor-not-allowed opacity-50"}
              />
            </PaginationItem>
            
            {getPaginationNumbers().map((page, index) => (
              <PaginationItem key={index}>
                {page === '...' ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationLink
                    onClick={() => goToPage(page as number)}
                    isActive={currentPage === page}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}
            
            <PaginationItem>
              <PaginationNext 
                onClick={goToNextPage}
                className={hasNextPage ? "cursor-pointer" : "cursor-not-allowed opacity-50"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};
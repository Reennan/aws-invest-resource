import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Settings, Server, Check, X } from 'lucide-react';
import { useClusters } from '@/hooks/useClusters';
import { useUserClusterPermissions } from '@/hooks/useUserClusterPermissions';

interface UserClusterPermissionsProps {
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

export const UserClusterPermissions = ({ user }: UserClusterPermissionsProps) => {
  const { clusters } = useClusters();
  const { 
    permissions, 
    updateUserClusterPermission, 
    getUserClusterPermissions 
  } = useUserClusterPermissions();
  const [isOpen, setIsOpen] = useState(false);

  const userPermissions = getUserClusterPermissions(user.id);
  const allowedClusterIds = userPermissions.filter(p => p.can_view).map(p => p.cluster_id);
  
  const handlePermissionToggle = async (clusterId: string, canView: boolean) => {
    await updateUserClusterPermission(user.id, clusterId, canView);
  };

  const hasPermissionForCluster = (clusterId: string) => {
    return allowedClusterIds.includes(clusterId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          Clusters ({allowedClusterIds.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Permissões de Clusters</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Gerencie quais clusters <strong>{user.name || user.email}</strong> pode visualizar
          </p>
        </DialogHeader>
        
        <ScrollArea className="max-h-[400px] pr-4">
          <div className="space-y-4">
            {clusters.map((cluster) => {
              const hasPermission = hasPermissionForCluster(cluster.id);
              
              return (
                <div 
                  key={cluster.id} 
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                      <Server className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{cluster.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={cluster.is_active ? 'default' : 'secondary'} className="text-xs">
                          {cluster.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`cluster-${cluster.id}`}
                      checked={hasPermission}
                      onCheckedChange={(checked) => 
                        handlePermissionToggle(cluster.id, checked as boolean)
                      }
                    />
                    {hasPermission ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              );
            })}
            
            {clusters.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Server className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum cluster disponível</p>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total de clusters permitidos:</span>
            <Badge variant="outline">{allowedClusterIds.length} de {clusters.length}</Badge>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
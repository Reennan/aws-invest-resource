import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const Account = () => {
  const { profile, user } = useAuth();

  return (
    <div className="p-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Configurações da Conta</h1>
          <p className="text-muted-foreground">Gerencie suas informações pessoais</p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nome</label>
                <p className="text-sm text-muted-foreground">{profile?.name || 'Não informado'}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <p className="text-sm text-muted-foreground">{profile?.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Telefone</label>
                <p className="text-sm text-muted-foreground">{profile?.phone || 'Não informado'}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Permissões</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Função</label>
                <div className="mt-1">
                  <Badge variant={profile?.role === 'admin' ? 'default' : 'secondary'}>
                    {profile?.role}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${profile?.can_view_dashboard ? 'bg-success' : 'bg-muted'}`}></span>
                  <span className="text-sm">Visualizar Dashboard</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${profile?.can_view_clusters ? 'bg-success' : 'bg-muted'}`}></span>
                  <span className="text-sm">Visualizar Clusters</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${profile?.can_view_reports ? 'bg-success' : 'bg-muted'}`}></span>
                  <span className="text-sm">Visualizar Relatórios</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${profile?.can_manage_users ? 'bg-success' : 'bg-muted'}`}></span>
                  <span className="text-sm">Gerenciar Usuários</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Account;
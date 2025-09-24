import { useAuth } from '@/hooks/useAuth';

const AdminUsers = () => {
  const { profile } = useAuth();

  if (!profile?.can_manage_users || profile.role !== 'admin') {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Acesso Negado</h1>
          <p className="text-muted-foreground mt-2">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Usuários</h1>
          <p className="text-muted-foreground">Gerencie usuários do sistema</p>
        </div>
        
        <div className="bg-card rounded-lg p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Em Desenvolvimento</h2>
          <p className="text-muted-foreground">Esta funcionalidade será implementada em breve.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
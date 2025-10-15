import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUsers } from '@/hooks/useUsers';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, 
  Search, 
  MoreVertical, 
  UserCheck, 
  Shield, 
  Eye, 
  Key, 
  Edit, 
  Trash2,
  UserCog,
  Activity
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { UserClusterPermissions } from '@/components/UserClusterPermissions';
import { Separator } from '@/components/ui/separator';

const AdminUsers = () => {
  const { profile } = useAuth();
  const { users, loading, updateUserRole, toggleUserStatus, deleteUser, changeUserPassword } = useUsers();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const { toast } = useToast();

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

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeUsers = users.filter(u => u.is_active).length;
  const adminUsers = users.filter(u => u.role === 'admin').length;
  const editorUsers = users.filter(u => u.role === 'editor').length;
  const viewerUsers = users.filter(u => u.role === 'viewer').length;

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'default';
      case 'editor': return 'secondary';
      case 'viewer': return 'outline';
      default: return 'outline';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'editor': return 'Editor';
      case 'viewer': return 'Visualizador';
      default: return role;
    }
  };

  const getStatusBadgeVariant = (isActive: boolean) => {
    return isActive ? 'default' : 'destructive';
  };

  const handleRoleChange = async (userId: string, newRole: 'viewer' | 'admin' | 'editor') => {
    await updateUserRole(userId, newRole);
  };

  const handleStatusToggle = async (userId: string, currentStatus: boolean) => {
    await toggleUserStatus(userId, !currentStatus);
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o usuário "${userName}"? Esta ação não pode ser desfeita.`)) {
      await deleteUser(userId);
    }
  };

  const handleChangeUserPassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    setPasswordLoading(true);
    try {
      await changeUserPassword(selectedUser.id, newPassword);
      setIsPasswordDialogOpen(false);
      setNewPassword('');
      setConfirmPassword('');
      setSelectedUser(null);
    } catch (error) {
      // Erro já tratado no hook
    } finally {
      setPasswordLoading(false);
    }
  };

  const openPasswordDialog = (user: any) => {
    setSelectedUser(user);
    setIsPasswordDialogOpen(true);
  };

  const formatLastLogin = (lastLogin: string | null) => {
    if (!lastLogin) return 'Nunca';
    return new Date(lastLogin).toLocaleDateString('pt-BR');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="max-w-[1600px] mx-auto p-6 space-y-8 animate-fade-in">
        
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-secondary via-muted to-secondary p-8 shadow-xl border-2">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full -mr-48 -mt-48 blur-3xl"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-lg">
                <UserCog className="h-8 w-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight">Gerenciamento de Usuários</h1>
                <p className="text-muted-foreground text-lg mt-1">Gerencie usuários e suas permissões no sistema</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="bg-card px-4 py-3 rounded-xl border-2 shadow-md">
                <div className="text-2xl font-bold text-primary">{users.length}</div>
                <div className="text-muted-foreground text-sm">Total</div>
              </div>
              <div className="bg-card px-4 py-3 rounded-xl border-2 shadow-md">
                <div className="text-2xl font-bold text-success">{activeUsers}</div>
                <div className="text-muted-foreground text-sm">Ativos</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-card to-primary/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Total de Usuários
              </CardTitle>
              <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Users className="h-5 w-5 text-primary-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{users.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Cadastrados no sistema</p>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-card to-success/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Usuários Ativos
              </CardTitle>
              <div className="h-10 w-10 rounded-lg bg-gradient-accent flex items-center justify-center">
                <UserCheck className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">{activeUsers}</div>
              <p className="text-xs text-muted-foreground mt-1">Com acesso liberado</p>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-card to-secondary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Administradores
              </CardTitle>
              <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{adminUsers}</div>
              <p className="text-xs text-muted-foreground mt-1">Com privilégios admin</p>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-card to-muted/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Editores & Viewers
              </CardTitle>
              <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                <Edit className="h-5 w-5 text-secondary-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{editorUsers + viewerUsers}</div>
              <p className="text-xs text-muted-foreground mt-1">{editorUsers} editores, {viewerUsers} viewers</p>
            </CardContent>
          </Card>
        </div>

        {/* Users List Card */}
        <Card className="border-2 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Activity className="h-6 w-6 text-primary" />
                  Lista de Usuários
                </CardTitle>
                <CardDescription className="text-base mt-1">
                  Gerencie funções, status e permissões de cada usuário
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 border-2 focus:border-primary transition-colors"
                />
              </div>
            </div>

            <Separator className="my-4" />

            {/* Users Table */}
            <div className="rounded-lg border-2 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="font-bold">Usuário</TableHead>
                    <TableHead className="font-bold">Papel</TableHead>
                    <TableHead className="font-bold">Status</TableHead>
                    <TableHead className="font-bold">Último Login</TableHead>
                    <TableHead className="font-bold">Permissões</TableHead>
                    <TableHead className="font-bold text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user, index) => (
                    <TableRow 
                      key={user.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border-2 border-primary/20">
                            <AvatarFallback className="bg-gradient-primary text-primary-foreground text-sm font-bold">
                              {getInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold">{user.name || 'Sem nome'}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                            {user.phone && (
                              <div className="text-xs text-muted-foreground">{user.phone}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)} className="font-semibold">
                          {getRoleLabel(user.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={getStatusBadgeVariant(user.is_active)}
                          className="font-semibold"
                        >
                          {user.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {formatLastLogin(user.last_login)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.can_view_dashboard && (
                            <Badge variant="outline" className="text-xs">Dashboard</Badge>
                          )}
                          {user.can_view_clusters && (
                            <Badge variant="outline" className="text-xs">Clusters</Badge>
                          )}
                          {user.can_view_reports && (
                            <Badge variant="outline" className="text-xs">Relatórios</Badge>
                          )}
                          {user.can_manage_users && (
                            <Badge variant="outline" className="text-xs">Usuários</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" className="h-9 w-9 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              {user.role === 'admin' && (
                                <>
                                  <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'editor')}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Tornar Editor
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'viewer')}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Tornar Visualizador
                                  </DropdownMenuItem>
                                </>
                              )}
                              {user.role === 'editor' && (
                                <>
                                  <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'admin')}>
                                    <Shield className="mr-2 h-4 w-4" />
                                    Tornar Admin
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'viewer')}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Tornar Visualizador
                                  </DropdownMenuItem>
                                </>
                              )}
                              {user.role === 'viewer' && (
                                <>
                                  <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'admin')}>
                                    <Shield className="mr-2 h-4 w-4" />
                                    Tornar Admin
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'editor')}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Tornar Editor
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuItem 
                                onClick={() => handleStatusToggle(user.id, user.is_active)}
                              >
                                <Activity className="mr-2 h-4 w-4" />
                                {user.is_active ? 'Desativar' : 'Ativar'}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => openPasswordDialog(user)}
                              >
                                <Key className="mr-2 h-4 w-4" />
                                Alterar Senha
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteUser(user.id, user.name || user.email)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir Usuário
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          
                          <UserClusterPermissions user={user} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">Nenhum usuário encontrado</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Password Change Dialog */}
        <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Key className="h-5 w-5 text-primary" />
                Alterar Senha do Usuário
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 pt-4">
              <div className="p-4 bg-muted/50 rounded-lg border">
                <p className="text-sm text-muted-foreground">
                  Alterando senha para:
                </p>
                <p className="font-bold text-lg mt-1">{selectedUser?.name || selectedUser?.email}</p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-sm font-semibold">Nova Senha</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Digite a nova senha"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-semibold">Confirmar Nova Senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirme a nova senha"
                    className="h-11"
                  />
                </div>
              </div>
              
              <Separator />
              
              <div className="flex gap-3">
                <Button 
                  onClick={handleChangeUserPassword} 
                  disabled={passwordLoading}
                  className="flex-1 h-11 bg-gradient-primary hover:opacity-90"
                >
                  {passwordLoading ? 'Alterando...' : 'Alterar Senha'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsPasswordDialogOpen(false);
                    setNewPassword('');
                    setConfirmPassword('');
                    setSelectedUser(null);
                  }}
                  disabled={passwordLoading}
                  className="h-11"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminUsers;
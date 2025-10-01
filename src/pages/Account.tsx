import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Edit2, 
  Save, 
  X, 
  Key, 
  User, 
  Mail, 
  Phone, 
  Shield, 
  CheckCircle2,
  XCircle,
  Settings,
  Lock
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const Account = () => {
  const { profile, user, updateProfile } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const { error } = await updateProfile({
        name: formData.name,
        phone: formData.phone,
      });

      if (!error) {
        setIsEditing(false);
        toast({
          title: "Sucesso",
          description: "Perfil atualizado com sucesso!",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado ao atualizar perfil",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) {
        toast({
          title: "Erro",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setIsChangingPassword(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        toast({
          title: "Sucesso",
          description: "Senha alterada com sucesso!",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado ao alterar senha",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      name: profile?.name || '',
      email: profile?.email || '',
      phone: profile?.phone || '',
    });
  };

  const handleCancelPassword = () => {
    setIsChangingPassword(false);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="max-w-7xl mx-auto p-6 space-y-8 animate-fade-in">
        {/* Header Section */}
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-lg">
            <Settings className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Configurações da Conta</h1>
            <p className="text-muted-foreground text-lg">Gerencie suas informações pessoais e preferências</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          
          {/* Left Column - Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Personal Information Card */}
            <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                      <User className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Informações Pessoais</CardTitle>
                      <CardDescription>Seus dados cadastrais no sistema</CardDescription>
                    </div>
                  </div>
                  {!isEditing && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setIsEditing(true)}
                      className="gap-2 hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      <Edit2 className="h-4 w-4" />
                      Editar
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {isEditing ? (
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="name" className="text-sm font-semibold flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        Nome Completo
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Seu nome completo"
                        className="h-11 border-2 focus:border-primary transition-colors"
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <Label htmlFor="email" className="text-sm font-semibold flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        Email
                      </Label>
                      <Input
                        id="email"
                        value={formData.email}
                        disabled
                        className="h-11 bg-muted/50 border-2 cursor-not-allowed"
                      />
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        O email não pode ser alterado por questões de segurança
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <Label htmlFor="phone" className="text-sm font-semibold flex items-center gap-2">
                        <Phone className="h-4 w-4 text-primary" />
                        Telefone
                      </Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="(11) 99999-9999"
                        className="h-11 border-2 focus:border-primary transition-colors"
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex gap-3 pt-2">
                      <Button 
                        onClick={handleSaveProfile} 
                        disabled={loading}
                        className="flex-1 gap-2 h-11 bg-gradient-primary hover:opacity-90 transition-opacity"
                      >
                        <Save className="h-4 w-4" />
                        {loading ? 'Salvando...' : 'Salvar Alterações'}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={handleCancel}
                        disabled={loading}
                        className="gap-2 h-11 border-2 hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors"
                      >
                        <X className="h-4 w-4" />
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nome</label>
                        <p className="text-base font-medium mt-1">{profile?.name || 'Não informado'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
                      <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                        <Mail className="h-5 w-5 text-accent" />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Email</label>
                        <p className="text-base font-medium mt-1">{profile?.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
                      <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                        <Phone className="h-5 w-5 text-success" />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Telefone</label>
                        <p className="text-base font-medium mt-1">{profile?.phone || 'Não informado'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Security Card */}
            <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="bg-gradient-to-r from-destructive/5 to-transparent border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-danger flex items-center justify-center">
                      <Key className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Segurança</CardTitle>
                      <CardDescription>Gerencie sua senha e configurações de acesso</CardDescription>
                    </div>
                  </div>
                  {!isChangingPassword && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setIsChangingPassword(true)}
                      className="gap-2 hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    >
                      <Key className="h-4 w-4" />
                      Alterar Senha
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {isChangingPassword ? (
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="newPassword" className="text-sm font-semibold flex items-center gap-2">
                        <Lock className="h-4 w-4 text-primary" />
                        Nova Senha
                      </Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                        placeholder="Digite sua nova senha"
                        className="h-11 border-2 focus:border-primary transition-colors"
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <Label htmlFor="confirmPassword" className="text-sm font-semibold flex items-center gap-2">
                        <Lock className="h-4 w-4 text-primary" />
                        Confirmar Nova Senha
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                        placeholder="Confirme sua nova senha"
                        className="h-11 border-2 focus:border-primary transition-colors"
                      />
                    </div>
                    
                    <div className="p-4 bg-info/5 border border-info/20 rounded-lg">
                      <p className="text-sm text-info-foreground/80">
                        <strong>Dica:</strong> Use uma senha forte com pelo menos 6 caracteres, incluindo letras e números.
                      </p>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex gap-3 pt-2">
                      <Button 
                        onClick={handleChangePassword} 
                        disabled={loading}
                        className="flex-1 gap-2 h-11 bg-gradient-danger hover:opacity-90 transition-opacity"
                      >
                        <Save className="h-4 w-4" />
                        {loading ? 'Alterando...' : 'Alterar Senha'}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={handleCancelPassword}
                        disabled={loading}
                        className="gap-2 h-11 border-2 hover:bg-muted transition-colors"
                      >
                        <X className="h-4 w-4" />
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="inline-flex h-16 w-16 rounded-full bg-success/10 items-center justify-center mb-4">
                      <CheckCircle2 className="h-8 w-8 text-success" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Sua senha está protegida. Clique em "Alterar Senha" para modificá-la.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Role & Permissions */}
          <div className="space-y-6">
            
            {/* Role Card */}
            <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-card to-primary/5">
              <CardHeader className="border-b bg-white/50 dark:bg-black/20">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                    <Shield className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Função no Sistema</CardTitle>
                    <CardDescription>Seu nível de acesso</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <Badge 
                    variant={getRoleBadgeVariant(profile?.role || '')} 
                    className="text-base px-6 py-2 font-semibold"
                  >
                    {getRoleLabel(profile?.role || '')}
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    {profile?.role === 'admin' 
                      ? 'Você tem acesso completo ao sistema'
                      : profile?.role === 'editor'
                      ? 'Você pode editar e visualizar recursos'
                      : 'Você tem acesso de visualização'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Permissions Card */}
            <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="border-b">
                <CardTitle className="text-lg">Permissões</CardTitle>
                <CardDescription>Recursos que você pode acessar</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <PermissionItem
                    enabled={profile?.can_view_dashboard || false}
                    label="Visualizar Dashboard"
                  />
                  <PermissionItem
                    enabled={profile?.can_view_clusters || false}
                    label="Visualizar Clusters"
                  />
                  <PermissionItem
                    enabled={profile?.can_view_reports || false}
                    label="Visualizar Relatórios"
                  />
                  <PermissionItem
                    enabled={profile?.can_manage_users || false}
                    label="Gerenciar Usuários"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Account Info Card */}
            <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-card to-accent/5">
              <CardHeader className="border-b">
                <CardTitle className="text-lg">Informações da Conta</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4 text-sm">
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <span className="text-muted-foreground">ID do Usuário</span>
                    <code className="text-xs font-mono bg-background px-2 py-1 rounded">
                      {user?.id.substring(0, 8)}...
                    </code>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <span className="text-muted-foreground">Conta Criada</span>
                    <span className="font-medium">
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg border border-success/20">
                    <span className="text-success font-medium">Status</span>
                    <Badge variant="default" className="bg-success">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Ativo
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Component for Permission Items
const PermissionItem = ({ enabled, label }: { enabled: boolean; label: string }) => (
  <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
    <span className="text-sm font-medium">{label}</span>
    {enabled ? (
      <CheckCircle2 className="h-5 w-5 text-success" />
    ) : (
      <XCircle className="h-5 w-5 text-muted-foreground" />
    )}
  </div>
);

export default Account;
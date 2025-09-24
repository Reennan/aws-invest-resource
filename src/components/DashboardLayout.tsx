import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { 
  Cloud, 
  BarChart3, 
  Server, 
  FileText, 
  Users, 
  Settings, 
  LogOut,
  Menu,
  X,
  Activity
} from 'lucide-react';

const DashboardLayout = () => {
  const { user, profile, signOut, loading, signingOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (signingOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <div>
            <h2 className="text-xl font-semibold">Desconectando...</h2>
            <p className="text-muted-foreground">Aguarde um momento</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground">Carregando perfil...</p>
            </div>
      </div>
    );
  }

  const navigation = [
    {
      name: 'Dashboard',
      href: '/',
      icon: BarChart3,
      current: location.pathname === '/',
      permission: profile.can_view_dashboard
    },
    {
      name: 'Clusters',
      href: '/clusters',
      icon: Server,
      current: location.pathname === '/clusters',
      permission: profile.can_view_clusters
    },
    {
      name: 'Relatórios',
      href: '/reports',
      icon: FileText,
      current: location.pathname === '/reports',
      permission: profile.can_view_reports
    },
    {
      name: 'Usuários',
      href: '/admin/users',
      icon: Users,
      current: location.pathname === '/admin/users',
      permission: profile.can_manage_users && profile.role === 'admin'
    },
  ];

  const filteredNavigation = navigation.filter(item => item.permission);

  const handleSignOut = async () => {
    await signOut();
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleBadgeVariant = (role: string) => {
    return role === 'admin' ? 'default' : 'secondary';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-25 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Cloud className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-sm font-semibold">AWS Monitor</h1>
                <p className="text-xs text-muted-foreground">Resource Dashboard</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {filteredNavigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors
                  ${item.current 
                    ? 'bg-primary text-primary-foreground shadow-soft' 
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  }
                `}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            ))}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-border">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start p-2 h-auto">
                  <div className="flex items-center gap-3 w-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">
                        {getInitials(profile.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium truncate">
                        {profile.name || 'User'}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={getRoleBadgeVariant(profile.role)} 
                          className="text-xs px-2 py-0"
                        >
                          {profile.role === 'admin' ? 'Admin' : 'Viewer'}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Activity className="h-3 w-3 text-success" />
              <span className="text-xs text-success">Online</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{profile.name || 'User'}</p>
                    <p className="text-xs text-muted-foreground">{profile.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/account" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Configurações da Conta</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <div className="sticky top-0 z-40 flex h-16 items-center gap-x-4 border-b border-border bg-card px-4 shadow-soft lg:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">
                {getInitials(profile.name)}
              </AvatarFallback>
            </Avatar>
            <Badge variant={getRoleBadgeVariant(profile.role)} className="text-xs">
              {profile.role === 'admin' ? 'Admin' : 'Viewer'}
            </Badge>
            <div className="flex items-center gap-1">
              <Activity className="h-3 w-3 text-success" />
              <span className="text-xs text-success">Online</span>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
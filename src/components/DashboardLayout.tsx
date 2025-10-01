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
    switch (role) {
      case 'admin': return 'default';
      case 'editor': return 'secondary';
      case 'viewer': return 'outline';
      default: return 'outline';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'editor': return 'Editor';
      case 'viewer': return 'Viewer';
      default: return role;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Header Bar - Fixed */}
      <header className="fixed top-0 left-0 right-0 z-50 h-20 bg-card/95 backdrop-blur-xl border-b-2 border-border shadow-lg">
        <div className="flex items-center justify-between h-full px-6">
          {/* Left Side - Logo & Brand */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden h-10 w-10 p-0"
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-lg">
                <Cloud className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">AWS Monitor</h1>
                <p className="text-xs text-muted-foreground font-medium">Resource Dashboard</p>
              </div>
            </div>
          </div>

          {/* Right Side - User Info */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-muted/50 rounded-xl border">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-success animate-pulse" />
                <span className="text-sm font-semibold text-success">Online</span>
              </div>
              <div className="h-6 w-px bg-border"></div>
              <Badge variant={getRoleBadgeVariant(profile.role)} className="font-semibold">
                {getRoleLabel(profile.role)}
              </Badge>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-12 px-3 hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border-2 border-primary/20">
                      <AvatarFallback className="bg-gradient-primary text-primary-foreground text-sm font-bold">
                        {getInitials(profile.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden lg:block text-left">
                      <p className="text-sm font-semibold leading-none mb-1">
                        {profile.name || 'User'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {profile.email}
                      </p>
                    </div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-2">
                    <p className="text-sm font-semibold">{profile.name || 'User'}</p>
                    <p className="text-xs text-muted-foreground">{profile.email}</p>
                    <div className="flex items-center gap-2 pt-1">
                      <Badge variant={getRoleBadgeVariant(profile.role)} className="text-xs">
                        {getRoleLabel(profile.role)}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Activity className="h-3 w-3 text-success" />
                        <span className="text-xs text-success font-medium">Online</span>
                      </div>
                    </div>
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
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Centered and Elegant */}
      <aside className={`
        fixed left-1/2 bottom-8 -translate-x-1/2 z-50
        w-auto
        bg-card/95 backdrop-blur-xl
        border-2 border-border/50
        rounded-2xl
        shadow-2xl
        transition-all duration-500 ease-out
        ${sidebarOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none lg:opacity-100 lg:translate-y-0 lg:pointer-events-auto'}
      `}>
        <nav className="p-2">
          <div className="flex items-center gap-2">
            {filteredNavigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  group relative flex flex-col items-center gap-2 px-6 py-4 rounded-xl
                  transition-all duration-300 ease-out
                  ${item.current 
                    ? 'bg-gradient-primary text-primary-foreground shadow-lg scale-105' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:scale-105'
                  }
                `}
              >
                <div className={`
                  h-12 w-12 rounded-xl flex items-center justify-center
                  transition-all duration-300
                  ${item.current 
                    ? 'bg-white/20 shadow-lg' 
                    : 'bg-muted/30 group-hover:bg-primary/10 group-hover:shadow-md'
                  }
                `}>
                  <item.icon className={`
                    h-6 w-6 transition-all duration-300
                    ${item.current ? '' : 'group-hover:scale-110'}
                  `} />
                </div>
                <span className={`
                  text-xs font-bold tracking-wide uppercase
                  ${item.current ? 'text-white' : 'group-hover:text-primary'}
                `}>
                  {item.name}
                </span>
                
                {/* Active Indicator */}
                {item.current && (
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rounded-full shadow-lg animate-pulse" />
                )}
              </Link>
            ))}
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="pt-20 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
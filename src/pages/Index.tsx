import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import DashboardStats from '@/components/DashboardStats';
import { DashboardCharts } from '@/components/DashboardCharts';
import { LatestExecutions } from '@/components/LatestExecutions';
import { Button } from '@/components/ui/button';
import { RefreshCw, Cloud } from 'lucide-react';

const Index = () => {
  const { profile, loading } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile?.can_view_dashboard) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Cloud className="h-12 w-12 text-muted-foreground mx-auto" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Acesso Restrito</h1>
            <p className="text-muted-foreground">
              Você não tem permissão para visualizar o dashboard. Entre em contato com seu administrador para obter acesso.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleRefresh = async () => {
    setRefreshing(true);
    // This will trigger a re-render of DashboardStats which will fetch fresh data
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <div className="flex-1 space-y-4 px-4 md:px-6 pb-4 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral de monitoramento e análise de recursos AWS
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleRefresh}
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* 1ª Fileira: Dashboard Stats */}
      <DashboardStats key={refreshing ? 'refreshing' : 'normal'} statsOnly />

      {/* 2ª Fileira: Charts */}
      <DashboardCharts refreshTrigger={refreshing ? Date.now() : 0} />

      {/* 3ª Fileira: Recent Resources and Unused Types */}
      <DashboardStats key={`${refreshing ? 'refreshing' : 'normal'}-sections`} sectionsOnly />

      {/* 4ª Fileira: Latest Executions */}
      <LatestExecutions refreshTrigger={refreshing ? Date.now() : 0} />

        {/* Welcome Message for new users */}
        {(!profile.can_view_clusters && !profile.can_view_reports) && (
          <div className="bg-gradient-to-r from-blue-50 to-slate-50 border border-blue-100 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0">
              <Cloud className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Bem-vindo ao AWS Resource Monitor!</h3>
              <p className="text-muted-foreground mb-4">
                Você está visualizando o dashboard com acesso limitado. Para desbloquear mais recursos como gerenciamento de clusters e relatórios detalhados, entre em contato com seu administrador para atualizar suas permissões.
              </p>
              <div className="flex gap-2 text-sm">
                <span className="px-2 py-1 bg-muted rounded text-muted-foreground">
                  Função: {profile.role}
                </span>
                <span className="px-2 py-1 bg-success/10 text-success rounded">
                  Acesso ao Dashboard ✓
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;

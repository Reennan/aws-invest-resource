import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import DashboardStats from '@/components/DashboardStats';
import { DashboardCharts } from '@/components/DashboardCharts';
import { LatestExecutions } from '@/components/LatestExecutions';
import { Button } from '@/components/ui/button';
import { RefreshCw, Cloud, TrendingUp, Activity, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

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
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="max-w-[1600px] mx-auto p-6 space-y-8 animate-fade-in">
        
        {/* Hero Header Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-primary p-8 shadow-xl border-2 border-primary/20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full -ml-32 -mb-32 blur-3xl"></div>
          
          <div className="relative flex items-center justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                  <Activity className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white tracking-tight">Dashboard AWS Monitor</h1>
                  <p className="text-white/90 text-lg mt-1">
                    Visão geral completa de monitoramento e análise de recursos AWS
                  </p>
                </div>
              </div>
              
              {/* Quick Stats in Header */}
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/30">
                  <TrendingUp className="h-4 w-4 text-white" />
                  <span className="text-white font-semibold text-sm">Sistema Ativo</span>
                </div>
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/30">
                  <Zap className="h-4 w-4 text-white" />
                  <span className="text-white font-semibold text-sm">Monitoramento em Tempo Real</span>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={handleRefresh}
              disabled={refreshing}
              size="lg"
              className="gap-3 h-12 px-6 bg-white text-primary hover:bg-white/90 font-semibold shadow-lg"
            >
              <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
              Atualizar Dados
            </Button>
          </div>
        </div>

        {/* Stats Cards Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-1 bg-gradient-primary rounded-full"></div>
            <h2 className="text-2xl font-bold">Visão Geral de Recursos</h2>
          </div>
          <DashboardStats key={refreshing ? 'refreshing' : 'normal'} statsOnly />
        </div>

        {/* Charts Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-1 bg-gradient-accent rounded-full"></div>
            <h2 className="text-2xl font-bold">Análise de Dados</h2>
          </div>
          <DashboardCharts refreshTrigger={refreshing ? Date.now() : 0} />
        </div>

        {/* Resources Sections */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-1 bg-gradient-primary rounded-full"></div>
            <h2 className="text-2xl font-bold">Recursos Recentes</h2>
          </div>
          <DashboardStats key={`${refreshing ? 'refreshing' : 'normal'}-sections`} sectionsOnly />
        </div>

        {/* Latest Executions */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-1 bg-gradient-danger rounded-full"></div>
            <h2 className="text-2xl font-bold">Últimas Execuções</h2>
          </div>
          <LatestExecutions refreshTrigger={refreshing ? Date.now() : 0} />
        </div>

        {/* Welcome Message for Limited Access Users */}
        {(!profile.can_view_clusters && !profile.can_view_reports) && (
          <Card className="border-2 shadow-lg bg-gradient-to-br from-card to-info/5">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-primary flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Cloud className="h-6 w-6 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">Bem-vindo ao AWS Resource Monitor! 🎉</h3>
                  <p className="text-muted-foreground mb-4">
                    Você está visualizando o dashboard com acesso limitado. Para desbloquear mais recursos como gerenciamento de clusters e relatórios detalhados, entre em contato com seu administrador para atualizar suas permissões.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <div className="px-3 py-1.5 bg-muted rounded-lg text-sm font-medium">
                      Função: <span className="text-primary">{profile.role}</span>
                    </div>
                    <div className="px-3 py-1.5 bg-success/10 text-success rounded-lg text-sm font-medium border border-success/20">
                      ✓ Acesso ao Dashboard
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Index;
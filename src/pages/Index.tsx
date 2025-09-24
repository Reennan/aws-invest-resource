import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import DashboardStats from '@/components/DashboardStats';
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
            <h1 className="text-2xl font-bold text-foreground">Access Restricted</h1>
            <p className="text-muted-foreground">
              You don't have permission to view the dashboard. Contact your administrator for access.
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
    <div className="flex-1 space-y-8 p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            AWS Resource monitoring and analytics overview
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleRefresh}
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Dashboard Stats */}
      <DashboardStats key={refreshing ? 'refreshing' : 'normal'} />

      {/* Welcome Message for new users */}
      {(!profile.can_view_clusters && !profile.can_view_reports) && (
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0">
              <Cloud className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Welcome to AWS Resource Monitor!</h3>
              <p className="text-muted-foreground mb-4">
                You're currently viewing the dashboard with limited access. To unlock more features like cluster management and detailed reports, contact your administrator to update your permissions.
              </p>
              <div className="flex gap-2 text-sm">
                <span className="px-2 py-1 bg-muted rounded text-muted-foreground">
                  Role: {profile.role}
                </span>
                <span className="px-2 py-1 bg-success/10 text-success rounded">
                  Dashboard Access ✓
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

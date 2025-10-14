import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar1 } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/apiClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface DashboardChartsProps {
  refreshTrigger?: number;
}

interface ChartData {
  date: string;
  created: number;
  unused: number;
}

interface PieData {
  name: string;
  value: number;
  percentage: number;
}

const CHART_COLORS = [
  'hsl(var(--chart-pie-1))',
  'hsl(var(--chart-pie-2))', 
  'hsl(var(--chart-pie-3))',
  'hsl(var(--chart-pie-4))',
  'hsl(var(--chart-pie-5))',
  'hsl(var(--chart-pie-6))'
];

export const DashboardCharts = ({ refreshTrigger }: DashboardChartsProps) => {
  const [periodDays, setPeriodDays] = useState<number>(7);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [pieData, setPieData] = useState<PieData[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchChartData = async () => {
    const startDate = subDays(new Date(), periodDays);
    const endDate = new Date();
    
    setLoading(true);
    try {
      // Fetch all resources created
      const createdData = await apiClient.getResourcesCreated();
      
      // Filter by date range
      const filteredCreated = createdData?.filter(item => {
        const itemDate = new Date(item.created_at);
        return itemDate >= startDate && itemDate <= endDate;
      }) || [];

      // Fetch runs data
      const runsData = await apiClient.getRuns();
      
      // Filter runs by date range
      const filteredRuns = runsData?.filter(run => {
        const runDate = new Date(run.run_ts);
        return runDate >= startDate && runDate <= endDate;
      }) || [];

      // Process data by date
      const dateMap = new Map<string, { created: number; unused: number }>();
      
      // Initialize all dates in range
      const current = new Date(startDate);
      while (current <= endDate) {
        const dateKey = format(current, 'yyyy-MM-dd');
        dateMap.set(dateKey, { created: 0, unused: 0 });
        current.setDate(current.getDate() + 1);
      }

      // Count created resources by date
      filteredCreated.forEach(item => {
        const dateKey = format(new Date(item.created_at), 'yyyy-MM-dd');
        const existing = dateMap.get(dateKey);
        if (existing) {
          existing.created++;
        }
      });

      // Count unused resources by date (from runs)
      filteredRuns.forEach(run => {
        const dateKey = format(new Date(run.run_ts), 'yyyy-MM-dd');
        const existing = dateMap.get(dateKey);
        if (existing) {
          existing.unused += run.unused_count;
        }
      });

      // Convert to chart format
      const formattedData: ChartData[] = Array.from(dateMap.entries()).map(([date, counts]) => ({
        date: format(new Date(date), 'dd/MM', { locale: ptBR }),
        created: counts.created,
        unused: counts.unused,
      }));

      setChartData(formattedData);

      // Fetch unused resources by type for pie chart
      const unusedByType = await apiClient.getUnusedByType();

      if (unusedByType && unusedByType.length > 0) {
        const total = unusedByType.reduce((sum, item) => sum + (item.total || 0), 0);
        const pieFormattedData: PieData[] = unusedByType.map(item => ({
          name: item.type || 'Desconhecido',
          value: item.total || 0,
          percentage: total > 0 ? Math.round(((item.total || 0) / total) * 100) : 0,
        }));
        setPieData(pieFormattedData);
      }

    } catch (error) {
      console.error('Error fetching chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChartData();
  }, [periodDays, refreshTrigger]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Bar Chart */}
      <Card className="bg-gradient-to-br from-card to-card/50 border-0 shadow-chart overflow-hidden">
        <CardHeader className="bg-gradient-subtle border-b border-border/50 pb-6">
          <CardTitle className="flex items-center justify-between text-xl font-semibold text-foreground">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-chart-created"></div>
              Recursos por Dia
            </div>
            <div className="flex items-center gap-2">
              <Calendar1 className="h-4 w-4 text-muted-foreground" />
              <Select value={periodDays.toString()} onValueChange={(value) => setPeriodDays(Number(value))}>
                <SelectTrigger className="w-[140px] border-border/50 bg-background/80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Últimos 7 dias</SelectItem>
                  <SelectItem value="15">Últimos 15 dias</SelectItem>
                  <SelectItem value="30">Últimos 30 dias</SelectItem>
                  <SelectItem value="60">Últimos 60 dias</SelectItem>
                  <SelectItem value="90">Últimos 90 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 bg-gradient-to-b from-background/50 to-background">
          {loading ? (
            <div className="h-[350px] flex items-center justify-center">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span className="text-muted-foreground">Carregando dados...</span>
              </div>
            </div>
          ) : (
            <div className="bg-background/80 backdrop-blur-sm rounded-xl p-4 border border-border/30">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="createdGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--chart-created))" stopOpacity={0.9}/>
                      <stop offset="100%" stopColor="hsl(var(--chart-created))" stopOpacity={0.6}/>
                    </linearGradient>
                    <linearGradient id="unusedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--chart-unused))" stopOpacity={0.9}/>
                      <stop offset="100%" stopColor="hsl(var(--chart-unused))" stopOpacity={0.6}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="hsl(var(--border))" 
                    strokeOpacity={0.3}
                  />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      boxShadow: 'var(--shadow-elegant)',
                      backdropFilter: 'blur(8px)'
                    }}
                    cursor={{ fill: 'hsl(var(--muted))', fillOpacity: 0.1 }}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                  />
                  <Bar 
                    dataKey="created" 
                    fill="url(#createdGradient)"
                    name="Recursos Criados"
                    radius={[6, 6, 0, 0]}
                    stroke="hsl(var(--chart-created))"
                    strokeWidth={1}
                  />
                  <Bar 
                    dataKey="unused" 
                    fill="url(#unusedGradient)"
                    name="Recursos Sem Uso"
                    radius={[6, 6, 0, 0]}
                    stroke="hsl(var(--chart-unused))"
                    strokeWidth={1}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pie Chart */}
      <Card className="bg-gradient-to-br from-card to-card/50 border-0 shadow-chart overflow-hidden">
        <CardHeader className="bg-gradient-subtle border-b border-border/50 pb-6">
          <CardTitle className="flex items-center gap-3 text-xl font-semibold text-foreground">
            <div className="h-2 w-2 rounded-full bg-chart-unused"></div>
            Recursos Sem Uso por Tipo
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 bg-gradient-to-b from-background/50 to-background">
          {loading ? (
            <div className="h-[400px] flex items-center justify-center">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span className="text-muted-foreground">Carregando dados...</span>
              </div>
            </div>
          ) : (
            <div className="bg-background/80 backdrop-blur-sm rounded-xl p-4 border border-border/30">
              <ResponsiveContainer width="100%" height={400}>
                <div className="space-y-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <defs>
                        {pieData.map((_, index) => (
                          <linearGradient key={index} id={`pieGradient${index}`} x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor={`hsl(var(--chart-pie-${(index % 6) + 1}))`} stopOpacity={0.9}/>
                            <stop offset="100%" stopColor={`hsl(var(--chart-pie-${(index % 6) + 1}))`} stopOpacity={0.7}/>
                          </linearGradient>
                        ))}
                      </defs>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        innerRadius={50}
                        dataKey="value"
                        stroke="hsl(var(--background))"
                        strokeWidth={2}
                      >
                        {pieData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={`url(#pieGradient${index})`}
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value, name) => [`${value} recursos`, name]}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '12px',
                          boxShadow: 'var(--shadow-elegant)',
                          backdropFilter: 'blur(8px)'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Custom Legend */}
                  <div className="grid grid-cols-1 gap-2 max-h-[120px] overflow-y-auto">
                    {pieData.map((item, index) => (
                      <div key={item.name} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/30">
                        <div className="flex items-center gap-3">
                          <div 
                            className="h-3 w-3 rounded-full border border-border/50"
                            style={{ backgroundColor: `hsl(var(--chart-pie-${(index % 6) + 1}))` }}
                          ></div>
                          <span className="text-sm font-medium text-foreground truncate">{item.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-foreground">{item.value}</div>
                          <div className="text-xs text-muted-foreground">{item.percentage}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </ResponsiveContainer>
            </div>
          )}
          {!loading && pieData.length === 0 && (
            <div className="h-[400px] flex items-center justify-center">
              <div className="text-center space-y-2">
                <div className="text-muted-foreground">Nenhum dado disponível</div>
                <div className="text-xs text-muted-foreground/70">Aguarde novas execuções para ver os dados</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar1 } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
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
      // Fetch resources created by day
      const { data: createdData, error: createdError } = await supabase
        .from('resources_created')
        .select('created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (createdError) throw createdError;

      // Fetch resources unused by day (using runs table to get the period)
      const { data: runsData, error: runsError } = await supabase
        .from('runs')
        .select('run_ts, unused_count')
        .gte('run_ts', startDate.toISOString())
        .lte('run_ts', endDate.toISOString());

      if (runsError) throw runsError;

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
      createdData?.forEach(item => {
        const dateKey = format(new Date(item.created_at), 'yyyy-MM-dd');
        const existing = dateMap.get(dateKey);
        if (existing) {
          existing.created++;
        }
      });

      // Count unused resources by date (from runs)
      runsData?.forEach(run => {
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
      const { data: unusedByType, error: pieError } = await supabase
        .from('v_unused_by_type')
        .select('*');

      if (pieError) throw pieError;

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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      {/* Bar Chart */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-xl font-semibold">
            Recursos por Dia
            <div className="flex items-center gap-2">
              <Calendar1 className="h-4 w-4 text-muted-foreground" />
              <Select value={periodDays.toString()} onValueChange={(value) => setPeriodDays(Number(value))}>
                <SelectTrigger className="w-[140px]">
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
        <CardContent>
          {loading ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="text-muted-foreground">Carregando...</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: 'var(--shadow-medium)'
                  }}
                />
                <Legend />
                <Bar 
                  dataKey="created" 
                  fill="hsl(var(--chart-created))" 
                  name="Recursos Criados"
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="unused" 
                  fill="hsl(var(--chart-unused))" 
                  name="Recursos Sem Uso"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Pie Chart */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Recursos Sem Uso por Tipo</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-[480px] flex items-center justify-center">
              <div className="text-muted-foreground">Carregando...</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={480}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={140}
                  innerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  stroke="hsl(var(--background))"
                  strokeWidth={3}
                >
                  {pieData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={`hsl(var(--chart-pie-${(index % 6) + 1}))`}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name) => [`${value} recursos`, name]}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: 'var(--shadow-medium)'
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={60}
                  formatter={(value, entry) => {
                    const item = pieData.find(d => d.name === value);
                    return (
                      <span style={{ color: entry.color }}>
                        {value}: {item?.value} ({item?.percentage}%)
                      </span>
                    );
                  }}
                  wrapperStyle={{
                    paddingTop: '20px',
                    fontSize: '14px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
          {!loading && pieData.length === 0 && (
            <div className="h-[480px] flex items-center justify-center">
              <div className="text-muted-foreground">Nenhum dado disponível</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
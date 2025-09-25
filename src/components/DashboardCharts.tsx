import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

export const DashboardCharts = ({ refreshTrigger }: DashboardChartsProps) => {
  const [startDate, setStartDate] = useState<Date | undefined>(subDays(new Date(), 7));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [pieData, setPieData] = useState<PieData[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchChartData = async () => {
    if (!startDate || !endDate) return;
    
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
  }, [startDate, endDate, refreshTrigger]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      {/* Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Recursos por Dia
            <div className="flex space-x-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Data inicial'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Data final'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="text-muted-foreground">Carregando...</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="created" fill="#10b981" name="Recursos Criados" />
                <Bar dataKey="unused" fill="#f59e0b" name="Recursos Sem Uso" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Recursos Sem Uso por Tipo</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="text-muted-foreground">Carregando...</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value, name]} />
              </PieChart>
            </ResponsiveContainer>
          )}
          {!loading && pieData.length === 0 && (
            <div className="h-[300px] flex items-center justify-center">
              <div className="text-muted-foreground">Nenhum dado disponível</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ICEEvolutionChartProps {
  companyId: string;
  perspective?: string;
}

interface DataPoint {
  date: string;
  averageICE: number;
  count: number;
  initiatives: string[];
}

export const ICEEvolutionChart = ({ companyId, perspective }: ICEEvolutionChartProps) => {
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvolutionData();
  }, [companyId, perspective]);

  const loadEvolutionData = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('initiatives')
        .select(`
          id,
          title,
          ice_score,
          created_at,
          updated_at,
          strategic_objectives (
            company_id,
            perspective
          )
        `)
        .eq('strategic_objectives.company_id', companyId)
        .not('ice_score', 'is', null)
        .order('updated_at', { ascending: true });

      if (perspective) {
        query = query.eq('strategic_objectives.perspective', perspective);
      }

      const { data: initiatives, error } = await query;

      if (error) throw error;

      // Agrupar por data (updated_at) e calcular média do ICE Score
      const groupedByDate = new Map<string, { scores: number[]; titles: string[] }>();

      initiatives?.forEach((initiative: any) => {
        const dateKey = format(new Date(initiative.updated_at), 'yyyy-MM-dd');
        
        if (!groupedByDate.has(dateKey)) {
          groupedByDate.set(dateKey, { scores: [], titles: [] });
        }

        const group = groupedByDate.get(dateKey)!;
        group.scores.push(initiative.ice_score);
        group.titles.push(initiative.title);
      });

      // Converter para array de dados do gráfico
      const chartData: DataPoint[] = Array.from(groupedByDate.entries())
        .map(([date, { scores, titles }]) => ({
          date: format(new Date(date), 'dd/MMM', { locale: ptBR }),
          averageICE: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
          count: scores.length,
          initiatives: titles,
        }))
        .slice(-30); // Últimos 30 pontos de dados

      setData(chartData);
    } catch (error) {
      console.error('Erro ao carregar evolução ICE:', error);
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border p-3 rounded-lg shadow-lg">
          <p className="font-medium mb-1">{data.date}</p>
          <p className="text-sm text-muted-foreground mb-2">
            {data.count} iniciativa(s) atualizadas
          </p>
          <p className="text-lg font-bold text-primary">
            ICE Médio: {data.averageICE}
          </p>
          {data.initiatives.length > 0 && (
            <div className="mt-2 pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-1">Iniciativas:</p>
              <ul className="text-xs space-y-1">
                {data.initiatives.slice(0, 3).map((title: string, idx: number) => (
                  <li key={idx}>• {title}</li>
                ))}
                {data.initiatives.length > 3 && (
                  <li className="text-muted-foreground">+ {data.initiatives.length - 3} mais</li>
                )}
              </ul>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Carregando evolução...</p>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle>Evolução ICE Score</CardTitle>
          </div>
          <CardDescription>
            Acompanhe a evolução do ICE Score médio ao longo do tempo
          </CardDescription>
        </CardHeader>
        <CardContent className="py-8 text-center text-muted-foreground">
          <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Dados insuficientes para gerar gráfico de evolução</p>
          <p className="text-xs mt-1">Atualize as iniciativas para ver a evolução</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <CardTitle>Evolução ICE Score</CardTitle>
        </div>
        <CardDescription>
          {perspective
            ? `Evolução do ICE Score médio - Perspectiva: ${perspective}`
            : 'Evolução do ICE Score médio de todas as iniciativas'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              domain={[0, 1000]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="averageICE"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--primary))', r: 4 }}
              activeDot={{ r: 6 }}
              name="ICE Score Médio"
            />
          </LineChart>
        </ResponsiveContainer>

        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {Math.round(data.reduce((acc, d) => acc + d.averageICE, 0) / data.length)}
            </div>
            <div className="text-xs text-muted-foreground">Média Geral</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {Math.max(...data.map(d => d.averageICE))}
            </div>
            <div className="text-xs text-muted-foreground">Máximo</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {Math.min(...data.map(d => d.averageICE))}
            </div>
            <div className="text-xs text-muted-foreground">Mínimo</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

interface BurndownChartProps {
  companyId: string;
}

export const BurndownChart = ({ companyId }: BurndownChartProps) => {
  const { data: burndownData } = useQuery({
    queryKey: ["burndown-chart", companyId],
    queryFn: async () => {
      // Get all initiatives for the company
      const { data: initiatives } = await supabase
        .from("initiatives")
        .select(`
          id,
          created_at,
          status,
          strategic_objectives!inner(company_id)
        `)
        .eq("strategic_objectives.company_id", companyId);

      if (!initiatives || initiatives.length === 0) return [];

      // Get activity log to track completions over time
      const { data: activities } = await supabase
        .from("activity_log")
        .select("created_at, action_type, entity_type")
        .eq("company_id", companyId)
        .eq("entity_type", "initiative")
        .eq("action_type", "completed")
        .order("created_at", { ascending: true });

      const today = new Date();
      const startDate = subDays(today, 30);
      const dateRange = eachDayOfInterval({ start: startDate, end: today });

      const totalInitiatives = initiatives.length;
      let completedCount = 0;

      const chartData = dateRange.map((date) => {
        const dateStr = format(date, "yyyy-MM-dd");
        
        // Count completions up to this date
        const completionsUpToDate = activities?.filter(
          (a) => new Date(a.created_at) <= date
        ).length || 0;

        completedCount = completionsUpToDate;
        const remaining = totalInitiatives - completedCount;
        const idealRemaining = totalInitiatives * (1 - (dateRange.indexOf(date) / dateRange.length));

        return {
          date: format(date, "dd/MM", { locale: ptBR }),
          remaining,
          ideal: Math.round(idealRemaining),
          completed: completedCount,
        };
      });

      return chartData;
    },
    enabled: !!companyId,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5" />
          Burndown de Iniciativas (30 dias)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {burndownData && burndownData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={burndownData}>
              <defs>
                <linearGradient id="colorRemaining" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorIdeal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
                labelStyle={{ color: "hsl(var(--popover-foreground))" }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="ideal"
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="5 5"
                fill="url(#colorIdeal)"
                name="Linha Ideal"
              />
              <Area
                type="monotone"
                dataKey="remaining"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#colorRemaining)"
                name="Restantes"
              />
              <Line
                type="monotone"
                dataKey="completed"
                stroke="hsl(var(--success))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--success))" }}
                name="Concluídas"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <TrendingDown className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Dados insuficientes para o gráfico</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

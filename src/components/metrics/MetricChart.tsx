import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface MetricChartProps {
  updates: any[];
  target?: string;
}

export const MetricChart = ({ updates, target }: MetricChartProps) => {
  // Ordenar updates por data (mais antigo primeiro para o gráfico)
  const sortedUpdates = [...updates].reverse();
  
  // Preparar dados para o gráfico
  const chartData = sortedUpdates.map(update => {
    const value = parseFloat(update.value);
    return {
      date: new Date(update.recorded_at).toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: 'short' 
      }),
      value: isNaN(value) ? 0 : value,
      fullDate: update.recorded_at,
    };
  });

  // Parse target para número (se existir)
  const targetValue = target ? parseFloat(target.replace(/[^\d.-]/g, '')) : null;

  return (
    <div className="w-full h-48">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="date" 
            className="text-xs"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis 
            className="text-xs"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
          />
          {targetValue && !isNaN(targetValue) && (
            <ReferenceLine 
              y={targetValue} 
              stroke="hsl(var(--primary))" 
              strokeDasharray="5 5"
              label={{ value: 'Meta', fill: 'hsl(var(--primary))', fontSize: 12 }}
            />
          )}
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="hsl(var(--primary))" 
            strokeWidth={2}
            dot={{ fill: 'hsl(var(--primary))', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
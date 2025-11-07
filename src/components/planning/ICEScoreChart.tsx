import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useNavigate } from "react-router-dom";
import { TrendingUp } from "lucide-react";

interface Initiative {
  id: string;
  title: string;
  ice_score?: number;
  priority_quadrant?: string;
  status?: string;
}

interface ICEScoreChartProps {
  initiatives: Initiative[];
}

export const ICEScoreChart = ({ initiatives }: ICEScoreChartProps) => {
  const navigate = useNavigate();

  // Filtrar apenas iniciativas com ICE Score
  const validInitiatives = initiatives.filter(i => i.ice_score !== null && i.ice_score !== undefined);

  // Preparar dados para o gráfico
  const chartData = validInitiatives.map((initiative, index) => ({
    x: initiative.ice_score || 0,
    y: index, // Y será o índice para espalhar visualmente
    name: initiative.title,
    id: initiative.id,
    quadrant: initiative.priority_quadrant,
    status: initiative.status,
  }));

  const getQuadrantColor = (quadrant?: string) => {
    switch (quadrant) {
      case 'fazer_agora':
        return '#22c55e'; // green
      case 'planejar':
        return '#3b82f6'; // blue
      case 'oportunidades_rapidas':
        return '#f59e0b'; // orange
      case 'evitar':
        return '#ef4444'; // red
      default:
        return '#94a3b8'; // gray
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-sm mb-1">{data.name}</p>
          <p className="text-xs text-muted-foreground">ICE Score: <span className="font-bold text-primary">{data.x}</span></p>
          {data.quadrant && (
            <Badge variant="outline" className="mt-2 text-xs">
              {data.quadrant.replace('_', ' ')}
            </Badge>
          )}
        </div>
      );
    }
    return null;
  };

  if (validInitiatives.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Nenhuma iniciativa com ICE Score ainda. Priorize as iniciativas primeiro.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle>Dispersão de ICE Score</CardTitle>
          </div>
        </div>
        <CardDescription>
          Visualização das iniciativas por score. Clique em um ponto para ver detalhes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              type="number"
              dataKey="x"
              name="ICE Score"
              domain={[0, 1000]}
              label={{ value: 'ICE Score', position: 'insideBottom', offset: -10 }}
              className="text-muted-foreground"
            />
            <YAxis
              type="number"
              dataKey="y"
              hide
            />
            <Tooltip content={<CustomTooltip />} />
            <Scatter
              data={chartData}
              onClick={(data) => navigate(`/iniciativa/${data.id}`)}
              cursor="pointer"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getQuadrantColor(entry.quadrant)}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>

        {/* Legenda */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#22c55e' }} />
            <span className="text-xs text-muted-foreground">Fazer Agora</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#3b82f6' }} />
            <span className="text-xs text-muted-foreground">Planejar</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#f59e0b' }} />
            <span className="text-xs text-muted-foreground">Quick Wins</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ef4444' }} />
            <span className="text-xs text-muted-foreground">Evitar</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

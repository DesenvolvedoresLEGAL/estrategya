import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Minus, RefreshCw } from "lucide-react";
import { MetricChart } from "./MetricChart";

interface MetricCardProps {
  metric: any;
  objective: any;
  onUpdate: () => void;
}

export const MetricCard = ({ metric, objective, onUpdate }: MetricCardProps) => {
  const hasUpdates = metric.metric_updates && metric.metric_updates.length > 0;
  const latestUpdate = hasUpdates ? metric.metric_updates[0] : null;
  
  // Calcular tendência
  const getTrend = () => {
    if (!hasUpdates || metric.metric_updates.length < 2) return 'neutral';
    
    const latest = parseFloat(metric.metric_updates[0].value);
    const previous = parseFloat(metric.metric_updates[1].value);
    
    if (isNaN(latest) || isNaN(previous)) return 'neutral';
    
    if (latest > previous) return 'up';
    if (latest < previous) return 'down';
    return 'neutral';
  };

  const trend = getTrend();
  
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-success' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground';

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-semibold text-sm mb-1">{metric.name}</h4>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs">
                Meta: {metric.target}
              </Badge>
              {metric.period && (
                <Badge variant="secondary" className="text-xs">
                  {metric.period}
                </Badge>
              )}
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={onUpdate}
            className="ml-2"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Atualizar
          </Button>
        </div>

        {/* Valor Atual e Tendência */}
        <div className="flex items-center gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Valor Atual</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">
                {metric.current_value || latestUpdate?.value || '-'}
              </span>
              {hasUpdates && (
                <TrendIcon className={`w-4 h-4 ${trendColor}`} />
              )}
            </div>
          </div>
          
          {latestUpdate && (
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">Última Atualização</p>
              <p className="text-xs">
                {new Date(latestUpdate.recorded_at).toLocaleDateString('pt-BR')}
              </p>
              {latestUpdate.notes && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                  {latestUpdate.notes}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Gráfico de Evolução */}
        {hasUpdates && metric.metric_updates.length > 1 && (
          <MetricChart updates={metric.metric_updates} target={metric.target} />
        )}

        {!hasUpdates && (
          <div className="text-center py-4 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">
              Nenhuma atualização registrada ainda
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};
import { Card, CardContent } from "@/components/ui/card";
import { TrendIndicator } from "./TrendIndicator";
import { Target } from "lucide-react";

interface MetricCardProps {
  name: string;
  currentValue: string;
  target: string;
  trend: 'up' | 'down' | 'stable';
  status: 'on_target' | 'attention' | 'critical';
  lastUpdate?: string;
}

export const MetricCard = ({ 
  name, 
  currentValue, 
  target, 
  trend, 
  status,
  lastUpdate 
}: MetricCardProps) => {
  const statusConfig = {
    on_target: { label: 'No Alvo', className: 'bg-success/10 text-success' },
    attention: { label: 'Atenção', className: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-500' },
    critical: { label: 'Crítico', className: 'bg-destructive/10 text-destructive' }
  };

  const config = statusConfig[status];

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium text-sm">{name}</h3>
          </div>
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${config.className}`}>
            {config.label}
          </span>
        </div>

        <div className="space-y-3">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{currentValue}</span>
            <TrendIndicator trend={trend} size={20} />
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Meta: {target}</span>
          </div>

          {lastUpdate && (
            <p className="text-xs text-muted-foreground">
              Atualizado {lastUpdate}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

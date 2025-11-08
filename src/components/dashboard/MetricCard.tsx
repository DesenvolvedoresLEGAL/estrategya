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
      <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6 pb-4 sm:pb-6">
        <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
            <h3 className="font-medium text-xs sm:text-sm truncate">{name}</h3>
          </div>
          <span className={`text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full whitespace-nowrap ${config.className}`}>
            {config.label}
          </span>
        </div>

        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-xl sm:text-2xl font-bold truncate">{currentValue}</span>
            <TrendIndicator trend={trend} size={16} />
          </div>

          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-muted-foreground truncate">Meta: {target}</span>
          </div>

          {lastUpdate && (
            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
              Atualizado {lastUpdate}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

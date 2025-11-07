import { Card, CardContent } from "@/components/ui/card";
import { Activity } from "lucide-react";

interface HealthScoreProps {
  score: number; // 0-100
  label?: string;
}

export const HealthScore = ({ score, label = "Saúde Estratégica" }: HealthScoreProps) => {
  const getHealthStatus = (score: number) => {
    if (score >= 80) return { status: 'Saudável', color: 'text-success', bgColor: 'bg-success/10' };
    if (score >= 60) return { status: 'Atenção', color: 'text-yellow-600 dark:text-yellow-500', bgColor: 'bg-yellow-500/10' };
    return { status: 'Crítico', color: 'text-destructive', bgColor: 'bg-destructive/10' };
  };

  const health = getHealthStatus(score);

  return (
    <Card className="border-2">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">{label}</span>
          </div>
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${health.bgColor} ${health.color}`}>
            {health.status}
          </span>
        </div>
        
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold">{score}</span>
          <span className="text-muted-foreground text-sm">/100</span>
        </div>
        
        {/* Progress bar */}
        <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${
              score >= 80 ? 'bg-success' : 
              score >= 60 ? 'bg-yellow-500' : 
              'bg-destructive'
            }`}
            style={{ width: `${score}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
};

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, TrendingUp } from "lucide-react";

interface KeyResult {
  kr: string;
  target: string;
  metrica: string;
}

interface OKR {
  goal_index: number;
  objective: string;
  key_results: KeyResult[];
}

interface OKRCardProps {
  okr: OKR;
  goalTitle?: string;
}

export const OKRCard = ({ okr, goalTitle }: OKRCardProps) => {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Goal relacionado (opcional) */}
        {goalTitle && (
          <div className="text-sm text-muted-foreground">
            <Badge variant="outline" className="mb-2">Goal {okr.goal_index + 1}</Badge>
            <p>{goalTitle}</p>
          </div>
        )}

        {/* Objective */}
        <div className="flex items-start gap-3">
          <Target className="w-6 h-6 text-primary mt-1" />
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">Objective</h4>
            <p className="text-lg font-bold text-foreground">{okr.objective}</p>
          </div>
        </div>

        {/* Key Results */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h5 className="text-sm font-semibold">Key Results</h5>
          </div>
          <div className="space-y-2">
            {okr.key_results.map((kr, idx) => (
              <div key={idx} className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                <Badge variant="outline" className="mt-0.5">KR{idx + 1}</Badge>
                <div className="flex-1">
                  <p className="text-sm font-medium">{kr.kr}</p>
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">Meta: {kr.target}</span>
                    <span className="text-xs text-muted-foreground">• Métrica: {kr.metrica}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

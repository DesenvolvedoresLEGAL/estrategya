import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, TrendingUp, Lightbulb, BarChart3 } from "lucide-react";

interface Measure {
  name: string;
  o_que_medir: string;
  target?: string;
}

interface Strategy {
  title: string;
  description: string;
  measures?: Measure[];
}

interface Goal {
  title: string;
  description: string;
  mensuravel?: string;
  strategies?: Strategy[];
}

interface OGSMData {
  objective: string;
  goals: Goal[];
}

interface OGSMCardProps {
  ogsm: OGSMData;
}

export const OGSMCard = ({ ogsm }: OGSMCardProps) => {
  // Flatten strategies and measures for display
  const allStrategies = ogsm.goals?.flatMap((goal, goalIdx) => 
    goal.strategies?.map((strategy, stratIdx) => ({
      ...strategy,
      goalIndex: goalIdx,
      strategyIndex: stratIdx
    })) || []
  ) || [];

  const allMeasures = allStrategies.flatMap((strategy) => 
    strategy.measures || []
  );

  return (
    <div className="space-y-6">
      {/* Objective */}
      <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5">
        <div className="flex items-start gap-3">
          <Target className="w-8 h-8 text-primary mt-1" />
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Objetivo Estratégico</h3>
            <p className="text-2xl font-bold text-foreground leading-tight">{ogsm.objective}</p>
          </div>
        </div>
      </Card>

      {/* Goals */}
      {ogsm.goals && ogsm.goals.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold">Goals (Metas de Negócio)</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ogsm.goals.map((goal, idx) => (
              <Card key={idx} className="p-4">
                <Badge className="mb-2">Goal {idx + 1}</Badge>
                <h4 className="font-semibold mb-2">{goal.title}</h4>
                <p className="text-sm text-muted-foreground mb-2">{goal.description}</p>
                {goal.mensuravel && (
                  <div className="text-xs font-medium text-primary bg-primary/10 p-2 rounded">
                    {goal.mensuravel}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Strategies */}
      {allStrategies.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold">Strategies (Estratégias)</h3>
          </div>
          <div className="space-y-3">
            {allStrategies.map((strategy, idx) => (
              <Card key={idx} className="p-4">
                <div className="flex items-start gap-3">
                  <Badge variant="outline">S{idx + 1}</Badge>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">{strategy.title}</h4>
                    <p className="text-sm text-muted-foreground">{strategy.description}</p>
                    <div className="text-xs text-muted-foreground/70 mt-1">
                      Goal {strategy.goalIndex + 1}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Measures */}
      {allMeasures.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold">Measures (Métricas)</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {allMeasures.map((measure, idx) => (
              <Card key={idx} className="p-3 bg-muted/50">
                <h4 className="font-medium text-sm mb-1">{measure.name}</h4>
                <p className="text-xs text-muted-foreground mb-1">{measure.o_que_medir}</p>
                {measure.target && (
                  <div className="text-xs font-medium text-primary">
                    Meta: {measure.target}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

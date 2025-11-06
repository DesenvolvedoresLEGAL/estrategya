import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, TrendingUp, Lightbulb, BarChart3 } from "lucide-react";

interface OGSMData {
  objective: string;
  goals: Array<{
    titulo: string;
    descricao: string;
    mensuravel: string;
  }>;
  strategies: Array<{
    goal_id: number;
    titulo: string;
    descricao: string;
  }>;
  measures: Array<{
    strategy_id: number;
    nome: string;
    o_que_medir: string;
  }>;
}

interface OGSMCardProps {
  ogsm: OGSMData;
}

export const OGSMCard = ({ ogsm }: OGSMCardProps) => {
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
      <div>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold">Goals (Metas de Negócio)</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ogsm.goals.map((goal, idx) => (
            <Card key={idx} className="p-4">
              <Badge className="mb-2">Goal {idx + 1}</Badge>
              <h4 className="font-semibold mb-2">{goal.titulo}</h4>
              <p className="text-sm text-muted-foreground mb-2">{goal.descricao}</p>
              <div className="text-xs font-medium text-primary bg-primary/10 p-2 rounded">
                {goal.mensuravel}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Strategies */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold">Strategies (Estratégias)</h3>
        </div>
        <div className="space-y-3">
          {ogsm.strategies.map((strategy, idx) => (
            <Card key={idx} className="p-4">
              <div className="flex items-start gap-3">
                <Badge variant="outline">S{idx + 1}</Badge>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">{strategy.titulo}</h4>
                  <p className="text-sm text-muted-foreground">{strategy.descricao}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Measures */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold">Measures (Métricas)</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ogsm.measures.map((measure, idx) => (
            <Card key={idx} className="p-3 bg-muted/50">
              <h4 className="font-medium text-sm mb-1">{measure.nome}</h4>
              <p className="text-xs text-muted-foreground">{measure.o_que_medir}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

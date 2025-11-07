import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { ChevronDown, ChevronUp, Edit, Target, Zap, TrendingUp } from "lucide-react";
import { UpdateObjectiveModal } from "./UpdateObjectiveModal";
import { ObjectiveHistoryList } from "./ObjectiveHistoryList";

interface Initiative {
  id: string;
  title: string;
  status: string;
  priority_quadrant?: string;
}

interface Metric {
  id: string;
  name: string;
  current_value: string | null;
  target: string | null;
}

interface ObjectiveUpdate {
  id: string;
  status: string;
  progress_percentage: number;
  notes: string | null;
  created_at: string;
  updated_by: string;
}

interface ObjectiveDetailCardProps {
  objective: {
    id: string;
    title: string;
    description: string | null;
    perspective: string | null;
    priority: number | null;
    initiatives?: Initiative[];
    metrics?: Metric[];
    objective_updates?: ObjectiveUpdate[];
  };
  onUpdate: () => void;
}

const perspectiveColors: Record<string, string> = {
  'Financeiro': 'text-green-600 dark:text-green-500 bg-green-500/10',
  'Clientes': 'text-blue-600 dark:text-blue-500 bg-blue-500/10',
  'Processos': 'text-purple-600 dark:text-purple-500 bg-purple-500/10',
  'Aprendizado': 'text-orange-600 dark:text-orange-500 bg-orange-500/10'
};

export const ObjectiveDetailCard = ({ objective, onUpdate }: ObjectiveDetailCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const latestUpdate = objective.objective_updates?.[0];
  const status = latestUpdate?.status || 'nao_iniciado';
  const progress = latestUpdate?.progress_percentage || 0;

  const initiativesInProgress = objective.initiatives?.filter(i => 
    i.status === 'em_andamento'
  ).length || 0;

  const metricsWithTarget = objective.metrics?.filter(m => 
    m.target && m.current_value
  ).length || 0;

  return (
    <>
      <Card className="hover:shadow-lg transition-all">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <Target className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <CardTitle className="text-base line-clamp-2">{objective.title}</CardTitle>
                  {objective.perspective && (
                    <Badge 
                      variant="outline" 
                      className={`${perspectiveColors[objective.perspective] || ''} text-xs`}
                    >
                      {objective.perspective}
                    </Badge>
                  )}
                </div>
                {objective.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {objective.description}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <StatusBadge status={status as any} />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progress */}
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-semibold">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Quick Stats */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-600 dark:text-blue-500" />
              <span className="text-muted-foreground">
                {objective.initiatives?.length || 0} iniciativas 
                {initiativesInProgress > 0 && ` (${initiativesInProgress} ativas)`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-500" />
              <span className="text-muted-foreground">
                {objective.metrics?.length || 0} métricas
              </span>
            </div>
          </div>

          {/* Update Button */}
          <Button 
            className="w-full"
            onClick={() => setModalOpen(true)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Atualizar Status
          </Button>

          {/* Expanded Content */}
          {expanded && (
            <div className="pt-4 border-t space-y-4">
              {/* Initiatives */}
              {objective.initiatives && objective.initiatives.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Iniciativas
                  </h4>
                  <div className="space-y-2">
                    {objective.initiatives.map((initiative) => (
                      <div 
                        key={initiative.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                      >
                        <span className="text-sm">{initiative.title}</span>
                        {initiative.priority_quadrant && (
                          <Badge variant="outline" className="text-xs">
                            {initiative.priority_quadrant}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Metrics */}
              {objective.metrics && objective.metrics.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Métricas
                  </h4>
                  <div className="space-y-2">
                    {objective.metrics.map((metric) => (
                      <div 
                        key={metric.id}
                        className="p-2 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{metric.name}</span>
                          {metric.current_value && metric.target && (
                            <span className="text-xs text-muted-foreground">
                              {metric.current_value} / {metric.target}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* History */}
              {objective.objective_updates && objective.objective_updates.length > 0 && (
                <ObjectiveHistoryList updates={objective.objective_updates} />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <UpdateObjectiveModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        objective={{
          id: objective.id,
          title: objective.title,
          current_status: status,
          current_progress: progress
        }}
        onSuccess={onUpdate}
      />
    </>
  );
};

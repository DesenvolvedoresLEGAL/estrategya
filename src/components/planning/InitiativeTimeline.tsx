import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, CheckCircle2, Circle, AlertTriangle } from "lucide-react";
import { format, differenceInDays, isAfter, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";

interface InitiativeTimelineProps {
  initiative: {
    title: string;
    when_deadline?: string;
    status?: string;
    created_at: string;
  };
}

export const InitiativeTimeline = ({ initiative }: InitiativeTimelineProps) => {
  const today = new Date();
  const createdDate = new Date(initiative.created_at);
  const deadline = initiative.when_deadline ? new Date(initiative.when_deadline) : null;

  const totalDays = deadline ? differenceInDays(deadline, createdDate) : 0;
  const daysElapsed = differenceInDays(today, createdDate);
  const daysRemaining = deadline ? differenceInDays(deadline, today) : 0;
  const progress = totalDays > 0 ? Math.min(100, Math.max(0, (daysElapsed / totalDays) * 100)) : 0;

  const isOverdue = deadline && isAfter(today, deadline);
  const isNearDeadline = deadline && !isOverdue && daysRemaining <= 7;

  const getStatusInfo = () => {
    if (isOverdue) {
      return {
        label: "Atrasado",
        color: "text-destructive",
        bgColor: "bg-destructive/10",
        icon: <AlertTriangle className="h-4 w-4" />,
      };
    }
    if (isNearDeadline) {
      return {
        label: "Atenção - Prazo próximo",
        color: "text-orange-600",
        bgColor: "bg-orange-100 dark:bg-orange-900/20",
        icon: <Clock className="h-4 w-4" />,
      };
    }
    if (initiative.status === "concluída") {
      return {
        label: "Concluída",
        color: "text-success",
        bgColor: "bg-success/10",
        icon: <CheckCircle2 className="h-4 w-4" />,
      };
    }
    return {
      label: "No prazo",
      color: "text-primary",
      bgColor: "bg-primary/10",
      icon: <Circle className="h-4 w-4" />,
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Timeline da Iniciativa
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <Badge className={`${statusInfo.bgColor} ${statusInfo.color} border-0`}>
            {statusInfo.icon}
            <span className="ml-1">{statusInfo.label}</span>
          </Badge>
          {deadline && (
            <span className="text-sm text-muted-foreground">
              {isOverdue 
                ? `${Math.abs(daysRemaining)} dias de atraso`
                : `${daysRemaining} dias restantes`
              }
            </span>
          )}
        </div>

        {/* Timeline Gantt Chart */}
        {deadline && (
          <div className="space-y-3">
            <div className="relative">
              {/* Progress Bar */}
              <div className="h-8 bg-muted rounded-lg overflow-hidden relative">
                <div
                  className={`h-full transition-all duration-500 ${
                    isOverdue
                      ? "bg-destructive"
                      : isNearDeadline
                      ? "bg-orange-500"
                      : "bg-primary"
                  }`}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-foreground">
                  {Math.round(progress)}% do tempo decorrido
                </div>
              </div>

              {/* Today Marker */}
              {!isOverdue && progress < 100 && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-foreground"
                  style={{ left: `${progress}%` }}
                >
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-medium whitespace-nowrap">
                    Hoje
                  </div>
                </div>
              )}
            </div>

            {/* Timeline Labels */}
            <div className="flex justify-between text-xs text-muted-foreground">
              <div className="space-y-1">
                <div className="font-medium">Início</div>
                <div>{format(createdDate, "dd/MM/yyyy", { locale: ptBR })}</div>
              </div>
              <div className="space-y-1 text-right">
                <div className="font-medium">Prazo</div>
                <div>{format(deadline, "dd/MM/yyyy", { locale: ptBR })}</div>
              </div>
            </div>
          </div>
        )}

        {!deadline && (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Prazo não definido no 5W2H</p>
            <p className="text-xs mt-1">Preencha o campo "When" para visualizar a timeline</p>
          </div>
        )}

        {/* Key Dates */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Criada em</p>
            <p className="text-sm font-medium">
              {format(createdDate, "dd 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
          {deadline && (
            <div className="space-y-1 text-right">
              <p className="text-xs text-muted-foreground">
                {isOverdue ? "Deveria terminar em" : "Termina em"}
              </p>
              <p className="text-sm font-medium">
                {format(deadline, "dd 'de' MMMM", { locale: ptBR })}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
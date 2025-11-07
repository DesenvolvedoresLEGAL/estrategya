import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, AlertTriangle, Clock } from "lucide-react";
import { format, isAfter, isBefore, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Initiative {
  id: string;
  title: string;
  due_date: string | null;
  when_deadline: string | null;
  status: string;
  strategic_objectives?: {
    title: string;
  };
}

interface UpcomingDeadlinesProps {
  initiatives: Initiative[];
}

export const UpcomingDeadlines = ({ initiatives }: UpcomingDeadlinesProps) => {
  const now = new Date();
  const next7Days = addDays(now, 7);
  const next30Days = addDays(now, 30);

  const getDeadlineDate = (initiative: Initiative): Date | null => {
    const dateStr = initiative.due_date || initiative.when_deadline;
    if (!dateStr) return null;
    return new Date(dateStr);
  };

  const deadlines = initiatives
    .map(init => ({
      ...init,
      deadline: getDeadlineDate(init),
    }))
    .filter(init => init.deadline !== null)
    .sort((a, b) => {
      if (!a.deadline || !b.deadline) return 0;
      return a.deadline.getTime() - b.deadline.getTime();
    });

  const overdue = deadlines.filter(
    init => init.deadline && isBefore(init.deadline, now) && init.status !== "concluída"
  );

  const urgent = deadlines.filter(
    init =>
      init.deadline &&
      isAfter(init.deadline, now) &&
      isBefore(init.deadline, next7Days) &&
      init.status !== "concluída"
  );

  const upcoming = deadlines.filter(
    init =>
      init.deadline &&
      isAfter(init.deadline, next7Days) &&
      isBefore(init.deadline, next30Days) &&
      init.status !== "concluída"
  );

  const getStatusColor = (type: "overdue" | "urgent" | "upcoming") => {
    switch (type) {
      case "overdue":
        return "destructive";
      case "urgent":
        return "default";
      case "upcoming":
        return "secondary";
    }
  };

  const renderDeadlineItem = (
    init: Initiative & { deadline: Date | null },
    type: "overdue" | "urgent" | "upcoming"
  ) => {
    if (!init.deadline) return null;

    return (
      <div key={init.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
        <div className="shrink-0 mt-1">
          {type === "overdue" ? (
            <AlertTriangle className="h-4 w-4 text-destructive" />
          ) : (
            <Clock className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{init.title}</p>
          {init.strategic_objectives && (
            <p className="text-xs text-muted-foreground truncate">
              {init.strategic_objectives.title}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={getStatusColor(type)} className="text-xs">
              {format(init.deadline, "dd MMM", { locale: ptBR })}
            </Badge>
            <span className="text-xs text-muted-foreground capitalize">
              {init.status || "não iniciada"}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Prazos e Entregas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {overdue.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2 text-destructive flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Atrasadas ({overdue.length})
            </h4>
            <div className="space-y-2">
              {overdue.slice(0, 3).map(init => renderDeadlineItem(init, "overdue"))}
            </div>
          </div>
        )}

        {urgent.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              Próximos 7 dias ({urgent.length})
            </h4>
            <div className="space-y-2">
              {urgent.slice(0, 3).map(init => renderDeadlineItem(init, "urgent"))}
            </div>
          </div>
        )}

        {upcoming.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2 text-muted-foreground flex items-center gap-2">
              Próximos 30 dias ({upcoming.length})
            </h4>
            <div className="space-y-2">
              {upcoming.slice(0, 3).map(init => renderDeadlineItem(init, "upcoming"))}
            </div>
          </div>
        )}

        {overdue.length === 0 && urgent.length === 0 && upcoming.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum prazo próximo</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

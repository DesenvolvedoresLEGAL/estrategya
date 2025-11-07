import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User } from "lucide-react";

interface ObjectiveUpdate {
  id: string;
  status: string;
  progress_percentage: number;
  notes: string | null;
  created_at: string;
  updated_by: string;
}

interface ObjectiveHistoryListProps {
  updates: ObjectiveUpdate[];
}

const statusLabels: Record<string, string> = {
  nao_iniciado: 'Não Iniciado',
  em_andamento: 'Em Andamento',
  em_risco: 'Em Risco',
  concluido: 'Concluído',
  pausado: 'Pausado'
};

const statusColors: Record<string, string> = {
  nao_iniciado: 'bg-muted text-muted-foreground',
  em_andamento: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  em_risco: 'bg-destructive/10 text-destructive',
  concluido: 'bg-success/10 text-success',
  pausado: 'bg-muted text-muted-foreground'
};

export const ObjectiveHistoryList = ({ updates }: ObjectiveHistoryListProps) => {
  if (updates.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Nenhuma atualização registrada ainda</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Histórico de Atualizações</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {updates.map((update, index) => (
            <div
              key={update.id}
              className={`relative pl-8 pb-4 ${
                index !== updates.length - 1 ? 'border-l-2 border-border ml-3' : ''
              }`}
            >
              {/* Timeline dot */}
              <div className="absolute left-0 top-0 -ml-[9px] w-4 h-4 rounded-full bg-primary border-4 border-background" />

              <div className="space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Badge className={statusColors[update.status]}>
                      {statusLabels[update.status]}
                    </Badge>
                    <span className="text-sm font-semibold">
                      {update.progress_percentage}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {format(new Date(update.created_at), "dd 'de' MMMM, HH:mm", { locale: ptBR })}
                  </div>
                </div>

                {update.notes && (
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                    {update.notes}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, CheckCircle2, AlertCircle, Clock, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Progress } from "@/components/ui/progress";

interface CheckinHistoryProps {
  executionPlanId: string;
}

interface Checkin {
  id: string;
  week_number: number;
  week_start_date: string;
  mci_progress: number;
  completed_actions: string[];
  blockers: string;
  next_week_commitments: string;
  notes: string;
  conducted_at: string;
}

export const CheckinHistory = ({ executionPlanId }: CheckinHistoryProps) => {
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCheckins();
  }, [executionPlanId]);

  const loadCheckins = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('weekly_checkins')
        .select('*')
        .eq('execution_plan_id', executionPlanId)
        .order('week_number', { ascending: false });

      if (error) throw error;

      setCheckins(data || []);
    } catch (error) {
      console.error('Erro ao carregar check-ins:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "text-green-600 dark:text-green-400";
    if (progress >= 50) return "text-yellow-600 dark:text-yellow-400";
    return "text-orange-600 dark:text-orange-400";
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Carregando histórico...</p>
        </CardContent>
      </Card>
    );
  }

  if (checkins.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Histórico de Check-ins
          </CardTitle>
          <CardDescription>
            Acompanhe a evolução dos check-ins semanais
          </CardDescription>
        </CardHeader>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Nenhum check-in realizado ainda</p>
          <p className="text-xs mt-1">Registre seu primeiro check-in semanal</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Histórico de Check-ins
        </CardTitle>
        <CardDescription>
          {checkins.length} check-in(s) registrado(s)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {checkins.map((checkin) => (
            <div
              key={checkin.id}
              className="p-4 rounded-lg border bg-card space-y-3"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary">Semana {checkin.week_number}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(checkin.week_start_date), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Check-in realizado em {format(new Date(checkin.conducted_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${getProgressColor(checkin.mci_progress)}`}>
                    {checkin.mci_progress}%
                  </div>
                  <p className="text-xs text-muted-foreground">MCI</p>
                </div>
              </div>

              {/* Progresso */}
              <div>
                <Progress value={checkin.mci_progress} className="h-2" />
              </div>

              {/* Ações Concluídas */}
              {checkin.completed_actions && checkin.completed_actions.length > 0 && (
                <div>
                  <h5 className="text-xs font-semibold mb-2 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />
                    Ações Concluídas ({checkin.completed_actions.length})
                  </h5>
                  <ul className="space-y-1">
                    {checkin.completed_actions.map((action, index) => (
                      <li key={index} className="text-xs flex items-start gap-2 pl-4">
                        <span className="text-green-600 dark:text-green-400">✓</span>
                        <span className="flex-1">{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Bloqueios */}
              {checkin.blockers && (
                <div className="p-2 bg-orange-500/10 border border-orange-500/30 rounded">
                  <h5 className="text-xs font-semibold mb-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                    Bloqueios
                  </h5>
                  <p className="text-xs">{checkin.blockers}</p>
                </div>
              )}

              {/* Compromissos */}
              {checkin.next_week_commitments && (
                <div className="p-2 bg-blue-500/10 border border-blue-500/30 rounded">
                  <h5 className="text-xs font-semibold mb-1 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                    Próximos Compromissos
                  </h5>
                  <p className="text-xs">{checkin.next_week_commitments}</p>
                </div>
              )}

              {/* Notas */}
              {checkin.notes && (
                <div className="text-xs text-muted-foreground pt-2 border-t">
                  <p><strong>Obs:</strong> {checkin.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

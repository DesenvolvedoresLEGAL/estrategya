import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { 
  TrendingUp, 
  Target, 
  Calendar, 
  AlertCircle, 
  CheckCircle2,
  Clock,
  Zap
} from "lucide-react";
import { format, startOfWeek, differenceInWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";

interface LiveScoreboardProps {
  companyId: string;
  executionPlanId?: string;
}

interface CheckinData {
  id: string;
  week_number: number;
  week_start_date: string;
  mci_progress: number;
  completed_actions: string[];
  blockers: string;
  next_week_commitments: string;
  conducted_at: string;
}

interface ExecutionData {
  id: string;
  mci: string;
  scoreboard: {
    lead_measures: Array<{ name: string; target: number; current: number }>;
    lag_measures: Array<{ name: string; target: number; current: number }>;
  };
  weekly_actions: Array<{ action: string; owner: string; status: string }>;
}

export const LiveScoreboard = ({ companyId, executionPlanId }: LiveScoreboardProps) => {
  const [checkins, setCheckins] = useState<CheckinData[]>([]);
  const [execution, setExecution] = useState<ExecutionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(1);

  useEffect(() => {
    loadData();
    
    // Setup realtime subscription para weekly_checkins
    const channel = supabase
      .channel('scoreboard-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'weekly_checkins',
          filter: `company_id=eq.${companyId}`
        },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId, executionPlanId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Carregar plano de execução
      const { data: execData, error: execError } = await supabase
        .from('execution_plan')
        .select('*')
        .eq('company_id', companyId)
        .maybeSingle();

      if (execError) throw execError;

      if (execData) {
        setExecution(execData as any);

        // Carregar check-ins
        const { data: checkinData, error: checkinError } = await supabase
          .from('weekly_checkins')
          .select('*')
          .eq('execution_plan_id', execData.id)
          .order('week_number', { ascending: false });

        if (checkinError) throw checkinError;

        setCheckins(checkinData || []);

        // Calcular semana atual
        const weekStart = startOfWeek(new Date(), { locale: ptBR });
        const planStartDate = checkinData?.[0]?.week_start_date 
          ? new Date(checkinData[0].week_start_date)
          : weekStart;
        const weekNumber = differenceInWeeks(weekStart, planStartDate) + 1;
        setCurrentWeek(Math.max(1, weekNumber));
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLeadMeasuresAverage = () => {
    if (!execution?.scoreboard?.lead_measures) return 0;
    const measures = execution.scoreboard.lead_measures;
    const avg = measures.reduce((acc, m) => {
      const progress = m.target > 0 ? (m.current / m.target) * 100 : 0;
      return acc + progress;
    }, 0) / measures.length;
    return Math.round(avg);
  };

  const getLagMeasuresAverage = () => {
    if (!execution?.scoreboard?.lag_measures) return 0;
    const measures = execution.scoreboard.lag_measures;
    const avg = measures.reduce((acc, m) => {
      const progress = m.target > 0 ? (m.current / m.target) * 100 : 0;
      return acc + progress;
    }, 0) / measures.length;
    return Math.round(avg);
  };

  const getWeeklyActionsCompleted = () => {
    if (!execution?.weekly_actions) return 0;
    return execution.weekly_actions.filter(a => a.status === 'concluída').length;
  };

  const getTotalActions = () => {
    return execution?.weekly_actions?.length || 0;
  };

  const getLastCheckin = () => {
    return checkins[0];
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
          <p className="text-sm text-muted-foreground">Carregando placar...</p>
        </CardContent>
      </Card>
    );
  }

  if (!execution) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Placar Visível 4DX
          </CardTitle>
          <CardDescription>
            Configure o plano de execução para ver o placar em tempo real
          </CardDescription>
        </CardHeader>
        <CardContent className="py-8 text-center text-muted-foreground">
          <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Nenhum plano de execução configurado</p>
        </CardContent>
      </Card>
    );
  }

  const lastCheckin = getLastCheckin();
  const leadAvg = getLeadMeasuresAverage();
  const lagAvg = getLagMeasuresAverage();
  const actionsCompleted = getWeeklyActionsCompleted();
  const totalActions = getTotalActions();
  const actionsProgress = totalActions > 0 ? Math.round((actionsCompleted / totalActions) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header com MCI */}
      <Card className="border-primary/50 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Target className="h-6 w-6 text-primary" />
                Placar Visível 4DX
              </CardTitle>
              <CardDescription className="text-base mt-2">
                <span className="font-semibold text-foreground">MCI:</span> {execution.mci}
              </CardDescription>
            </div>
            <div className="text-center">
              <Badge variant="secondary" className="text-lg px-4 py-2">
                <Calendar className="h-4 w-4 mr-2" />
                Semana {currentWeek}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Grid de Métricas Principais */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Medidas de Direção (Lead) */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-500" />
              Medidas de Direção
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-center">
                <div className={`text-3xl font-bold ${getProgressColor(leadAvg)}`}>
                  {leadAvg}%
                </div>
                <p className="text-xs text-muted-foreground">Média Geral</p>
              </div>
              <Progress value={leadAvg} className="h-2" />
              <div className="text-xs text-muted-foreground pt-2">
                {execution.scoreboard?.lead_measures?.length || 0} medidas ativas
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Medidas de Resultado (Lag) */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Medidas de Resultado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-center">
                <div className={`text-3xl font-bold ${getProgressColor(lagAvg)}`}>
                  {lagAvg}%
                </div>
                <p className="text-xs text-muted-foreground">Média Geral</p>
              </div>
              <Progress value={lagAvg} className="h-2" />
              <div className="text-xs text-muted-foreground pt-2">
                {execution.scoreboard?.lag_measures?.length || 0} medidas ativas
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ações Semanais */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-purple-500" />
              Ações Semanais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-center">
                <div className={`text-3xl font-bold ${getProgressColor(actionsProgress)}`}>
                  {actionsCompleted}/{totalActions}
                </div>
                <p className="text-xs text-muted-foreground">Concluídas</p>
              </div>
              <Progress value={actionsProgress} className="h-2" />
              <div className="text-xs text-muted-foreground pt-2">
                {actionsProgress}% de conclusão
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detalhamento das Medidas de Direção */}
      {execution.scoreboard?.lead_measures && execution.scoreboard.lead_measures.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Detalhamento - Medidas de Direção</CardTitle>
            <CardDescription>
              Ações e comportamentos que influenciam os resultados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {execution.scoreboard.lead_measures.map((measure, index) => {
                const progress = measure.target > 0 
                  ? Math.round((measure.current / measure.target) * 100)
                  : 0;
                return (
                  <div key={index} className="p-3 rounded-lg border bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{measure.name}</span>
                      <span className={`text-lg font-bold ${getProgressColor(progress)}`}>
                        {measure.current}/{measure.target}
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <div className="text-xs text-muted-foreground mt-1">
                      {progress}% do target
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detalhamento das Medidas de Resultado */}
      {execution.scoreboard?.lag_measures && execution.scoreboard.lag_measures.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Detalhamento - Medidas de Resultado</CardTitle>
            <CardDescription>
              Resultados e KPIs que medem o sucesso do MCI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {execution.scoreboard.lag_measures.map((measure, index) => {
                const progress = measure.target > 0 
                  ? Math.round((measure.current / measure.target) * 100)
                  : 0;
                return (
                  <div key={index} className="p-3 rounded-lg border bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{measure.name}</span>
                      <span className={`text-lg font-bold ${getProgressColor(progress)}`}>
                        {measure.current}/{measure.target}
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <div className="text-xs text-muted-foreground mt-1">
                      {progress}% do target
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Último Check-in */}
      {lastCheckin && (
        <Card className="border-green-500/30 bg-green-500/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-600 dark:text-green-400" />
              Último Check-in - Semana {lastCheckin.week_number}
            </CardTitle>
            <CardDescription>
              Realizado em {format(new Date(lastCheckin.conducted_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {lastCheckin.mci_progress !== null && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Progresso do MCI</span>
                  <span className={`text-lg font-bold ${getProgressColor(lastCheckin.mci_progress)}`}>
                    {lastCheckin.mci_progress}%
                  </span>
                </div>
                <Progress value={lastCheckin.mci_progress} className="h-2" />
              </div>
            )}

            {lastCheckin.completed_actions && lastCheckin.completed_actions.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Ações Concluídas:</h4>
                <ul className="space-y-1">
                  {lastCheckin.completed_actions.map((action, index) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {lastCheckin.blockers && (
              <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                <h4 className="text-sm font-semibold mb-1 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  Bloqueios:
                </h4>
                <p className="text-sm">{lastCheckin.blockers}</p>
              </div>
            )}

            {lastCheckin.next_week_commitments && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <h4 className="text-sm font-semibold mb-1">Compromissos para Próxima Semana:</h4>
                <p className="text-sm">{lastCheckin.next_week_commitments}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

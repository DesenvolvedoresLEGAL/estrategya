import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Brain, TrendingUp, TrendingDown, AlertTriangle, Lightbulb, Loader2, RefreshCw, Target } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

interface PredictiveAlertsProps {
  companyId: string;
}

export const PredictiveAlerts = ({ companyId }: PredictiveAlertsProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const queryClient = useQueryClient();

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['predictive-alerts', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_insights')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('predictive-alerts', {
        body: { companyId }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['predictive-alerts', companyId] });
      toast.success(`${data.alerts_generated} alertas preditivos gerados!`);
    },
    onError: (error: Error) => {
      console.error('Error generating alerts:', error);
      toast.error(error.message || 'Erro ao gerar alertas preditivos');
    }
  });

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await generateMutation.mutateAsync();
    } finally {
      setIsGenerating(false);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'risco':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'oportunidade':
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'recomendacao':
        return <Lightbulb className="h-5 w-5 text-blue-500" />;
      case 'benchmark':
        return <Target className="h-5 w-5 text-purple-500" />;
      default:
        return <Brain className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta':
        return 'destructive';
      case 'media':
        return 'default';
      case 'baixa':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'alta':
        return 'Alta Prioridade';
      case 'media':
        return 'Média Prioridade';
      case 'baixa':
        return 'Baixa Prioridade';
      default:
        return priority;
    }
  };

  const riskAlerts = alerts?.filter(a => a.insight_type === 'risco') || [];
  const opportunityAlerts = alerts?.filter(a => a.insight_type === 'oportunidade') || [];
  const recommendationAlerts = alerts?.filter(a => a.insight_type === 'recomendacao') || [];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Alertas Preditivos
              </CardTitle>
              <CardDescription>
                Análise preditiva baseada em machine learning
              </CardDescription>
            </div>
            <Button 
              onClick={handleGenerate} 
              disabled={isGenerating}
              variant="outline"
              size="sm"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Atualizar
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Card className="border-2 border-red-200 dark:border-red-900">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Riscos</p>
                    <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                      {riskAlerts.length}
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-200 dark:border-green-900">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Oportunidades</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {opportunityAlerts.length}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-200 dark:border-blue-900">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Recomendações</p>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {recommendationAlerts.length}
                    </p>
                  </div>
                  <Lightbulb className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alerts List */}
          {alerts && alerts.length > 0 ? (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <Alert 
                  key={alert.id}
                  className={`border-2 ${
                    alert.insight_type === 'risco' 
                      ? 'border-red-200 dark:border-red-900' 
                      : alert.insight_type === 'oportunidade'
                      ? 'border-green-200 dark:border-green-900'
                      : 'border-blue-200 dark:border-blue-900'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {getInsightIcon(alert.insight_type)}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="font-semibold">{alert.title}</h4>
                        <Badge variant={getPriorityColor(alert.priority)}>
                          {getPriorityLabel(alert.priority)}
                        </Badge>
                      </div>
                      <AlertDescription className="text-sm">
                        {alert.description}
                      </AlertDescription>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {alert.insight_type.toUpperCase()}
                        </Badge>
                        <span>•</span>
                        <span>
                          {new Date(alert.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          ) : (
            <Alert>
              <Brain className="h-4 w-4" />
              <AlertDescription>
                Nenhum alerta preditivo disponível. Clique em "Atualizar" para gerar alertas baseados nos dados atuais.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* How it Works */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Como Funcionam os Alertas Preditivos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="flex gap-2">
            <TrendingDown className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-foreground">Predição de Probabilidade:</strong> Analisa histórico de métricas para estimar probabilidade de atingir metas.
            </div>
          </div>
          <div className="flex gap-2">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-foreground">Detecção de Riscos:</strong> Identifica iniciativas com alto risco de atraso baseado em status e prazo.
            </div>
          </div>
          <div className="flex gap-2">
            <Target className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-foreground">Alocação de Recursos:</strong> Sugere quando é necessário alocar recursos adicionais.
            </div>
          </div>
          <div className="flex gap-2">
            <TrendingUp className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-foreground">Análise de Tendências:</strong> Detecta padrões de declínio em métricas críticas.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
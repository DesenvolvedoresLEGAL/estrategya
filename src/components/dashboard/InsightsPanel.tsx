import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Sparkles, AlertTriangle, TrendingUp, Target, Award, Loader2, RefreshCw, CheckCircle2, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface InsightsPanelProps {
  companyId: string;
}

export const InsightsPanel = ({ companyId }: InsightsPanelProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const queryClient = useQueryClient();

  const { data: insights, isLoading } = useQuery({
    queryKey: ['ai-insights', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_insights')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    }
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('generate-insights', {
        body: { companyId }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-insights', companyId] });
      toast.success('Insights gerados com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Error generating insights:', error);
      toast.error(error.message || 'Erro ao gerar insights');
    }
  });

  const dismissMutation = useMutation({
    mutationFn: async (insightId: string) => {
      const { error } = await supabase
        .from('ai_insights')
        .update({ status: 'visualizado' })
        .eq('id', insightId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-insights', companyId] });
      toast.success('Insight marcado como visto');
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
        return <Target className="h-5 w-5 text-blue-500" />;
      case 'progresso':
        return <Award className="h-5 w-5 text-purple-500" />;
      default:
        return <Sparkles className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'alta':
        return <Badge variant="destructive">Alta</Badge>;
      case 'media':
        return <Badge variant="default">Média</Badge>;
      case 'baixa':
        return <Badge variant="secondary">Baixa</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const newInsights = insights?.filter(i => i.status === 'novo') || [];
  const riskInsights = insights?.filter(i => i.insight_type === 'risco') || [];
  const opportunityInsights = insights?.filter(i => i.insight_type === 'oportunidade') || [];
  const recommendationInsights = insights?.filter(i => i.insight_type === 'recomendacao') || [];

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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Insights Inteligentes
            </CardTitle>
            <CardDescription>
              Análises automáticas e recomendações baseadas em IA
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
        <Tabs defaultValue="new" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="new">
              Novos ({newInsights.length})
            </TabsTrigger>
            <TabsTrigger value="risks">
              Riscos ({riskInsights.length})
            </TabsTrigger>
            <TabsTrigger value="opportunities">
              Oportunidades ({opportunityInsights.length})
            </TabsTrigger>
            <TabsTrigger value="recommendations">
              Ações ({recommendationInsights.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="mt-6 space-y-4">
            {newInsights.length > 0 ? (
              newInsights.map((insight) => (
                <InsightCard 
                  key={insight.id} 
                  insight={insight} 
                  onDismiss={() => dismissMutation.mutate(insight.id)}
                  getInsightIcon={getInsightIcon}
                  getPriorityBadge={getPriorityBadge}
                />
              ))
            ) : (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  Nenhum insight novo. Todos os insights foram visualizados!
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="risks" className="mt-6 space-y-4">
            {riskInsights.length > 0 ? (
              riskInsights.map((insight) => (
                <InsightCard 
                  key={insight.id} 
                  insight={insight}
                  onDismiss={() => dismissMutation.mutate(insight.id)}
                  getInsightIcon={getInsightIcon}
                  getPriorityBadge={getPriorityBadge}
                />
              ))
            ) : (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  Nenhum risco identificado no momento!
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="opportunities" className="mt-6 space-y-4">
            {opportunityInsights.length > 0 ? (
              opportunityInsights.map((insight) => (
                <InsightCard 
                  key={insight.id} 
                  insight={insight}
                  onDismiss={() => dismissMutation.mutate(insight.id)}
                  getInsightIcon={getInsightIcon}
                  getPriorityBadge={getPriorityBadge}
                />
              ))
            ) : (
              <Alert>
                <Target className="h-4 w-4" />
                <AlertDescription>
                  Nenhuma oportunidade identificada ainda.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="recommendations" className="mt-6 space-y-4">
            {recommendationInsights.length > 0 ? (
              recommendationInsights.map((insight) => (
                <InsightCard 
                  key={insight.id} 
                  insight={insight}
                  onDismiss={() => dismissMutation.mutate(insight.id)}
                  getInsightIcon={getInsightIcon}
                  getPriorityBadge={getPriorityBadge}
                />
              ))
            ) : (
              <Alert>
                <Target className="h-4 w-4" />
                <AlertDescription>
                  Nenhuma recomendação disponível.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

interface InsightCardProps {
  insight: any;
  onDismiss: () => void;
  getInsightIcon: (type: string) => JSX.Element;
  getPriorityBadge: (priority: string) => JSX.Element;
}

const InsightCard = ({ insight, onDismiss, getInsightIcon, getPriorityBadge }: InsightCardProps) => {
  return (
    <Alert className="relative border-2">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6"
        onClick={onDismiss}
      >
        <X className="h-4 w-4" />
      </Button>
      <div className="flex items-start gap-3 pr-8">
        {getInsightIcon(insight.insight_type)}
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between">
            <h4 className="font-semibold">{insight.title}</h4>
          </div>
          <AlertDescription className="text-sm">
            {insight.description}
          </AlertDescription>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {getPriorityBadge(insight.priority)}
            <Badge variant="outline" className="text-xs">
              {insight.insight_type}
            </Badge>
            <span>•</span>
            <span>
              {new Date(insight.created_at).toLocaleDateString('pt-BR', {
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
  );
};
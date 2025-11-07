import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { InsightCard } from "@/components/dashboard/InsightCard";
import { ArrowLeft, Sparkles, RefreshCw, TrendingUp, AlertTriangle, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Insight {
  id: string;
  insight_type: 'progresso' | 'risco' | 'oportunidade' | 'recomendacao';
  title: string;
  description: string;
  priority: 'baixa' | 'media' | 'alta' | 'critica';
  status: 'novo' | 'visualizado' | 'resolvido' | 'ignorado';
  related_objective_id?: string;
  created_at: string;
}

export default function Insights() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [healthScore, setHealthScore] = useState<number | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: companies } = await supabase
        .from('companies')
        .select('id')
        .eq('owner_user_id', user.id)
        .single();

      if (!companies) {
        toast({
          title: "Empresa não encontrada",
          description: "Configure sua empresa primeiro",
          variant: "destructive"
        });
        navigate('/planejamento');
        return;
      }

      setCompanyId(companies.id);

      const { data: insightsData, error } = await supabase
        .from('ai_insights')
        .select('*')
        .eq('company_id', companies.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInsights(insightsData || []);
    } catch (error) {
      console.error('Error loading insights:', error);
      toast({
        title: "Erro ao carregar insights",
        description: "Tente novamente mais tarde",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = async () => {
    if (!companyId) return;
    
    setGenerating(true);
    try {
      // Buscar dados para análise
      const { data: objectives } = await supabase
        .from('strategic_objectives')
        .select(`
          *,
          initiatives (*),
          metrics (*),
          objective_updates (*)
        `)
        .eq('company_id', companyId);

      const { data: metrics } = await supabase
        .from('metrics')
        .select(`
          *,
          objective:strategic_objectives(title)
        `)
        .eq('objective.company_id', companyId);

      const { data: metricUpdates } = await supabase
        .from('metric_updates')
        .select('*')
        .order('recorded_at', { ascending: false })
        .limit(100);

      const { data: company } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      const { data: context } = await supabase
        .from('strategic_context')
        .select('*')
        .eq('company_id', companyId)
        .single();

      // Chamar edge function de análise de progresso
      const { data: progressAnalysis, error: progressError } = await supabase.functions.invoke('ai-progress-analysis', {
        body: {
          company_id: companyId,
          objectives: objectives || [],
          metrics: metrics || [],
          metric_updates: metricUpdates || []
        }
      });

      if (progressError) throw progressError;

      // Chamar edge function de sugestões inteligentes
      const { data: smartSuggestions, error: suggestionsError } = await supabase.functions.invoke('ai-smart-suggestions', {
        body: {
          company_id: companyId,
          context: {
            company,
            strategic_context: context,
            objectives_summary: objectives?.map(o => ({
              title: o.title,
              perspective: o.perspective,
              initiatives_count: o.initiatives?.length || 0
            }))
          },
          performance: {
            total_objectives: objectives?.length || 0,
            completed_initiatives: objectives?.flatMap(o => o.initiatives || []).filter(i => i.status === 'concluída').length,
            metrics_on_track: metrics?.filter(m => m.current_value && m.target && parseFloat(m.current_value) >= parseFloat(m.target)).length
          }
        }
      });

      if (suggestionsError) throw suggestionsError;

      // Salvar insights no banco
      const newInsights = [];

      // Insights de análise de progresso
      if (progressAnalysis?.insights) {
        for (const insight of progressAnalysis.insights) {
          newInsights.push({
            company_id: companyId,
            insight_type: insight.type,
            title: insight.title,
            description: insight.description,
            priority: insight.priority,
            related_objective_id: insight.related_objective_id || null,
            status: 'novo'
          });
        }
      }

      // Quick Wins como insights
      if (smartSuggestions?.quick_wins) {
        for (const qw of smartSuggestions.quick_wins) {
          newInsights.push({
            company_id: companyId,
            insight_type: 'oportunidade',
            title: qw.titulo,
            description: qw.justificativa,
            priority: 'alta',
            status: 'novo'
          });
        }
      }

      // Ajustes como insights
      if (smartSuggestions?.adjustments) {
        for (const adj of smartSuggestions.adjustments) {
          newInsights.push({
            company_id: companyId,
            insight_type: 'recomendacao',
            title: adj.sugestao,
            description: adj.razao,
            priority: 'media',
            related_objective_id: adj.objetivo_id || null,
            status: 'novo'
          });
        }
      }

      if (newInsights.length > 0) {
        const { error: insertError } = await supabase
          .from('ai_insights')
          .insert(newInsights);

        if (insertError) throw insertError;
      }

      setHealthScore(progressAnalysis?.score || null);

      toast({
        title: "✨ Insights gerados com sucesso!",
        description: `${newInsights.length} novos insights foram criados`,
      });

      // Recarregar insights
      await loadInsights();

      // Enviar notificações para insights críticos
      const criticalInsights = newInsights.filter(i => i.priority === 'critica');
      if (criticalInsights.length > 0) {
        toast({
          title: "⚠️ Atenção Urgente",
          description: `${criticalInsights.length} insight(s) crítico(s) requerem sua atenção imediata`,
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('Error generating insights:', error);
      toast({
        title: "Erro ao gerar insights",
        description: error instanceof Error ? error.message : "Tente novamente mais tarde",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleMarkAsViewed = async (insightId: string) => {
    const { error } = await supabase
      .from('ai_insights')
      .update({ status: 'visualizado' })
      .eq('id', insightId);

    if (!error) {
      setInsights(prev => prev.map(i => i.id === insightId ? { ...i, status: 'visualizado' } : i));
    }
  };

  const handleResolve = async (insightId: string) => {
    const { error } = await supabase
      .from('ai_insights')
      .update({ status: 'resolvido' })
      .eq('id', insightId);

    if (!error) {
      setInsights(prev => prev.map(i => i.id === insightId ? { ...i, status: 'resolvido' } : i));
      toast({
        title: "✅ Insight resolvido",
        description: "Ótimo trabalho!"
      });
    }
  };

  const handleIgnore = async (insightId: string) => {
    const { error } = await supabase
      .from('ai_insights')
      .update({ status: 'ignorado' })
      .eq('id', insightId);

    if (!error) {
      setInsights(prev => prev.map(i => i.id === insightId ? { ...i, status: 'ignorado' } : i));
    }
  };

  const filterByType = (type: string) => {
    if (type === 'todos') return insights;
    return insights.filter(i => i.insight_type === type);
  };

  const filterByStatus = (status: string) => {
    if (status === 'todos') return insights;
    return insights.filter(i => i.status === status);
  };

  const newInsights = insights.filter(i => i.status === 'novo');
  const criticalInsights = insights.filter(i => i.priority === 'critica');

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Insights Inteligentes</h1>
            <p className="text-muted-foreground">Análises e recomendações geradas por IA</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={generateInsights} disabled={generating}>
              {generating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Gerar Novos Insights
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{insights.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Novos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{newInsights.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Críticos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{criticalInsights.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Saúde Estratégica</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="text-3xl font-bold">{healthScore || '--'}</div>
                {healthScore && (
                  <Badge variant={healthScore >= 70 ? 'default' : healthScore >= 50 ? 'secondary' : 'destructive'}>
                    {healthScore >= 70 ? 'Saudável' : healthScore >= 50 ? 'Atenção' : 'Crítico'}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Insights Grid */}
        <Tabs defaultValue="todos" className="space-y-4">
          <TabsList>
            <TabsTrigger value="todos">Todos ({insights.length})</TabsTrigger>
            <TabsTrigger value="progresso">
              <TrendingUp className="h-4 w-4 mr-2" />
              Progresso ({filterByType('progresso').length})
            </TabsTrigger>
            <TabsTrigger value="risco">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Riscos ({filterByType('risco').length})
            </TabsTrigger>
            <TabsTrigger value="oportunidade">
              Oportunidades ({filterByType('oportunidade').length})
            </TabsTrigger>
            <TabsTrigger value="recomendacao">
              Recomendações ({filterByType('recomendacao').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="todos" className="space-y-4">
            <div className="grid gap-4">
              {insights.length === 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Nenhum insight disponível</CardTitle>
                    <CardDescription>
                      Clique em "Gerar Novos Insights" para analisar seu progresso estratégico
                    </CardDescription>
                  </CardHeader>
                </Card>
              ) : (
                insights.map((insight) => (
                  <InsightCard
                    key={insight.id}
                    type={insight.insight_type}
                    title={insight.title}
                    description={insight.description}
                    priority={insight.priority}
                    status={insight.status}
                    onMarkAsViewed={() => handleMarkAsViewed(insight.id)}
                    onResolve={() => handleResolve(insight.id)}
                    onIgnore={() => handleIgnore(insight.id)}
                  />
                ))
              )}
            </div>
          </TabsContent>

          {['progresso', 'risco', 'oportunidade', 'recomendacao'].map((type) => (
            <TabsContent key={type} value={type} className="space-y-4">
              <div className="grid gap-4">
                {filterByType(type).length === 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Nenhum insight deste tipo</CardTitle>
                    </CardHeader>
                  </Card>
                ) : (
                  filterByType(type).map((insight) => (
                    <InsightCard
                      key={insight.id}
                      type={insight.insight_type}
                      title={insight.title}
                      description={insight.description}
                      priority={insight.priority}
                      status={insight.status}
                      onMarkAsViewed={() => handleMarkAsViewed(insight.id)}
                      onResolve={() => handleResolve(insight.id)}
                      onIgnore={() => handleIgnore(insight.id)}
                    />
                  ))
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}

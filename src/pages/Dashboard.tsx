import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useInsightNotifications } from "@/hooks/useInsightNotifications";
import { HealthScore } from "@/components/dashboard/HealthScore";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ObjectiveCard } from "@/components/dashboard/ObjectiveCard";
import { InsightCard } from "@/components/dashboard/InsightCard";
import { ProgressChart } from "@/components/dashboard/ProgressChart";
import { QuickWinList } from "@/components/dashboard/QuickWinList";
import { TopInitiativesICE } from "@/components/dashboard/TopInitiativesICE";
import { ICEScoreChart } from "@/components/planning/ICEScoreChart";
import { UpcomingDeadlines } from "@/components/dashboard/UpcomingDeadlines";
import { TeamPerformance } from "@/components/dashboard/TeamPerformance";
import { BurndownChart } from "@/components/dashboard/BurndownChart";
import { StrategicHealthScore } from "@/components/dashboard/StrategicHealthScore";
import { InsightsPanel } from "@/components/dashboard/InsightsPanel";
import { PredictiveAlerts } from "@/components/dashboard/PredictiveAlerts";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Target, TrendingUp, Lightbulb, AlertCircle, FileText, Download, Brain } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { exportStrategicPlanToExcel } from "@/utils/excelExport";
import { formatStrategicPlanForPPT, openPresentation } from "@/utils/pptExport";

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [generatingInsights, setGeneratingInsights] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [healthScore, setHealthScore] = useState(75);
  const [objectives, setObjectives] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [quickWins, setQuickWins] = useState<any[]>([]);
  const [initiatives, setInitiatives] = useState<any[]>([]);

  // Enable insight notifications
  useInsightNotifications(companyId);

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth');
        return;
      }

      await loadDashboardData(user.id);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast({
        title: "Erro ao carregar dashboard",
        description: "Tente novamente mais tarde",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async (userId: string) => {
    // Load company
    const { data: companies } = await supabase
      .from('companies')
      .select('*')
      .eq('owner_user_id', userId)
      .limit(1)
      .single();

    if (!companies) {
      navigate('/');
      return;
    }

    setCompanyId(companies.id);

    // Load objectives with latest updates
    const { data: objectivesData } = await supabase
      .from('strategic_objectives')
      .select(`
        *,
        initiatives (count),
        objective_updates (
          status,
          progress_percentage,
          created_at
        )
      `)
      .eq('company_id', companies.id)
      .order('priority', { ascending: true });

    const formattedObjectives = objectivesData?.map(obj => ({
      ...obj,
      latest_update: obj.objective_updates?.[0],
      initiatives_count: obj.initiatives?.[0]?.count || 0
    })) || [];

    setObjectives(formattedObjectives);

    // Load metrics
    const { data: metricsData } = await supabase
      .from('metrics')
      .select(`
        *,
        strategic_objectives (title)
      `)
      .in('objective_id', objectivesData?.map(o => o.id) || []);

    setMetrics(metricsData || []);

    // Load insights
    const { data: insightsData } = await supabase
      .from('ai_insights')
      .select('*')
      .eq('company_id', companies.id)
      .eq('status', 'novo')
      .order('created_at', { ascending: false })
      .limit(5);

    setInsights(insightsData || []);

    // Load initiatives with ICE scores
    const { data: initiativesData } = await supabase
      .from('initiatives')
      .select(`
        *,
        strategic_objectives!inner(company_id)
      `)
      .eq('strategic_objectives.company_id', companies.id);

    setInitiatives(initiativesData || []);
  };

  const generateInsights = async () => {
    if (!companyId) return;

    setGeneratingInsights(true);
    
    try {
      // Load metric updates from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: metricUpdates } = await supabase
        .from('metric_updates')
        .select('*')
        .gte('recorded_at', thirtyDaysAgo.toISOString());

      // Call AI progress analysis
      const { data: analysisData, error } = await supabase.functions.invoke('ai-progress-analysis', {
        body: {
          company_id: companyId,
          objectives: objectives,
          metrics: metrics,
          metric_updates: metricUpdates || []
        }
      });

      if (error) throw error;

      // Save insights to database
      if (analysisData.insights && analysisData.insights.length > 0) {
        const insightsToInsert = analysisData.insights.map((insight: any) => ({
          company_id: companyId,
          insight_type: insight.type,
          title: insight.title,
          description: insight.description,
          priority: insight.priority,
          related_objective_id: insight.related_objective_id || null,
          status: 'novo'
        }));

        await supabase.from('ai_insights').insert(insightsToInsert);
      }

      // Update health score
      setHealthScore(analysisData.score);

      // Reload insights
      const { data: newInsights } = await supabase
        .from('ai_insights')
        .select('*')
        .eq('company_id', companyId)
        .eq('status', 'novo')
        .order('created_at', { ascending: false })
        .limit(5);

      setInsights(newInsights || []);

      toast({
        title: "Insights atualizados!",
        description: `${analysisData.insights.length} novos insights gerados`,
      });

    } catch (error: any) {
      console.error('Error generating insights:', error);
      toast({
        title: "Erro ao gerar insights",
        description: error.message || "Tente novamente mais tarde",
        variant: "destructive"
      });
    } finally {
      setGeneratingInsights(false);
    }
  };

  const generateQuickWins = async () => {
    if (!companyId) return;

    try {
      const { data: company } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      const { data: suggestionsData, error } = await supabase.functions.invoke('ai-smart-suggestions', {
        body: {
          company_id: companyId,
          context: { company, objectives },
          performance: { health_score: healthScore, metrics }
        }
      });

      if (error) throw error;

      setQuickWins(suggestionsData.quick_wins || []);

      toast({
        title: "Quick Wins gerados!",
        description: `${suggestionsData.quick_wins.length} ações rápidas sugeridas`,
      });

    } catch (error: any) {
      console.error('Error generating quick wins:', error);
      toast({
        title: "Erro ao gerar sugestões",
        description: error.message || "Tente novamente mais tarde",
        variant: "destructive"
      });
    }
  };

  const updateInsightStatus = async (insightId: string, status: 'novo' | 'visualizado' | 'resolvido' | 'ignorado') => {
    await supabase
      .from('ai_insights')
      .update({ status })
      .eq('id', insightId);

    setInsights(insights.filter(i => i.id !== insightId));
  };

  const handleExportExcel = async () => {
    try {
      const { data: company } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      exportStrategicPlanToExcel({
        objectives,
        initiatives,
        metrics,
        company,
      });

      toast({
        title: "Exportado com sucesso!",
        description: "Arquivos CSV foram baixados",
      });
    } catch (error) {
      console.error('Error exporting:', error);
      toast({
        title: "Erro ao exportar",
        description: "Tente novamente",
        variant: "destructive",
      });
    }
  };

  const handleGenerateReport = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: {
          companyId,
          reportType: 'executive',
          format: 'html',
        },
      });

      if (error) throw error;

      const reportWindow = window.open('', '_blank');
      if (reportWindow) {
        reportWindow.document.write(data);
        reportWindow.document.close();
      }

      toast({
        title: "Relatório gerado!",
        description: "Abrindo em nova janela",
      });
    } catch (error: any) {
      console.error('Error generating report:', error);
      toast({
        title: "Erro ao gerar relatório",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleExportPowerPoint = async () => {
    try {
      const { data: company } = await supabase.from('companies').select('*').eq('id', companyId).single();
      const { data: swot } = await supabase.from('strategic_context').select('*').eq('company_id', companyId).single();

      const pptData = formatStrategicPlanForPPT({
        company,
        objectives,
        initiatives,
        metrics,
        swot,
      });

      openPresentation(pptData);

      toast({
        title: "Apresentação gerada!",
        description: "Use as setas para navegar. Pressione Ctrl+P para imprimir como PDF.",
      });
    } catch (error) {
      console.error('Error exporting PPT:', error);
      toast({
        title: "Erro ao gerar apresentação",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  const objectivesInProgress = objectives.filter(o => 
    o.latest_update?.status === 'em_andamento'
  ).length;

  const objectivesAtRisk = objectives.filter(o => 
    o.latest_update?.status === 'em_risco'
  ).length;

  const metricsOnTarget = metrics.filter(m => {
    // Simple logic: check if current value is close to target
    return m.current_value && m.target;
  }).length;

  // Mock chart data - in real app, calculate from metric_updates
  const chartData = [
    { date: 'Sem 1', receita: 80, satisfacao: 75, processos: 70 },
    { date: 'Sem 2', receita: 85, satisfacao: 78, processos: 72 },
    { date: 'Sem 3', receita: 82, satisfacao: 80, processos: 75 },
    { date: 'Sem 4', receita: 88, satisfacao: 82, processos: 78 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Page Title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard Executivo</h1>
            <p className="text-muted-foreground">Visão geral do progresso estratégico</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportExcel}>
              <Download className="mr-2 h-4 w-4" />
              Excel
            </Button>
            <Button variant="outline" onClick={handleExportPowerPoint}>
              <FileText className="mr-2 h-4 w-4" />
              PowerPoint
            </Button>
            <Button variant="outline" onClick={handleGenerateReport}>
              <FileText className="mr-2 h-4 w-4" />
              Relatório
            </Button>
            <Button onClick={generateInsights} disabled={generatingInsights}>
              <RefreshCw className={`mr-2 h-4 w-4 ${generatingInsights ? 'animate-spin' : ''}`} />
              {generatingInsights ? 'Analisando...' : 'Atualizar'}
            </Button>
          </div>
        </div>
        {/* Hero Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <HealthScore score={healthScore} />
          
          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="h-5 w-5 text-blue-600 dark:text-blue-500" />
                <span className="text-sm font-medium">Objetivos em Andamento</span>
              </div>
              <div className="text-4xl font-bold">{objectivesInProgress}</div>
              <p className="text-sm text-muted-foreground mt-2">
                de {objectives.length} totais
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-success" />
                <span className="text-sm font-medium">Métricas no Alvo</span>
              </div>
              <div className="text-4xl font-bold">{metricsOnTarget}</div>
              <p className="text-sm text-muted-foreground mt-2">
                de {metrics.length} totais
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
                <span className="text-sm font-medium">Insights Pendentes</span>
              </div>
              <div className="text-4xl font-bold">{insights.length}</div>
              {objectivesAtRisk > 0 && (
                <div className="flex items-center gap-1 mt-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {objectivesAtRisk} em risco
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Progress Chart */}
        <ProgressChart 
          data={chartData}
          title="Evolução de Métricas (Últimas 4 Semanas)"
          lines={[
            { dataKey: 'receita', name: 'Receita', color: '#10b981' },
            { dataKey: 'satisfacao', name: 'Satisfação', color: '#3b82f6' },
            { dataKey: 'processos', name: 'Processos', color: '#8b5cf6' }
          ]}
        />

        {/* Objectives Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Objetivos Estratégicos</h2>
            <Button variant="outline" onClick={() => navigate('/objetivos')}>
              Ver Todos
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {objectives.slice(0, 6).map((objective) => (
              <ObjectiveCard
                key={objective.id}
                id={objective.id}
                title={objective.title}
                description={objective.description}
                status={objective.latest_update?.status || 'nao_iniciado'}
                progress={objective.latest_update?.progress_percentage || 0}
                perspective={objective.perspective}
                initiativesCount={objective.initiatives_count}
              />
            ))}
          </div>
        </div>

        {/* Top 3 Iniciativas ICE & Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <TopInitiativesICE initiatives={initiatives} />
          <ICEScoreChart initiatives={initiatives} />
        </div>

        {/* Advanced Analytics Tabs */}
        <Tabs defaultValue="insights" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="insights">Insights IA</TabsTrigger>
            <TabsTrigger value="predictive">Alertas Preditivos</TabsTrigger>
            <TabsTrigger value="team">Equipe & Prazos</TabsTrigger>
            <TabsTrigger value="charts">Gráficos</TabsTrigger>
            <TabsTrigger value="health">Saúde Estratégica</TabsTrigger>
          </TabsList>

          <TabsContent value="insights" className="space-y-4">
            {companyId && <InsightsPanel companyId={companyId} />}
            <QuickWinList quickWins={quickWins} onGenerateMore={generateQuickWins} />
          </TabsContent>

          <TabsContent value="predictive" className="space-y-4">
            {companyId && <PredictiveAlerts companyId={companyId} />}
          </TabsContent>

          <TabsContent value="team" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {companyId && <TeamPerformance companyId={companyId} />}
              <UpcomingDeadlines initiatives={initiatives} />
            </div>
          </TabsContent>

          <TabsContent value="charts" className="space-y-4">
            <div className="grid grid-cols-1 gap-8">
              {companyId && <BurndownChart companyId={companyId} />}
              <ICEScoreChart initiatives={initiatives} />
            </div>
          </TabsContent>

          <TabsContent value="health" className="space-y-4">
            {companyId && <StrategicHealthScore companyId={companyId} />}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

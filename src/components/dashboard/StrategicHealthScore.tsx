import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Activity, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface StrategicHealthScoreProps {
  companyId: string;
}

interface ScoreBreakdown {
  category: string;
  score: number;
  weight: number;
  description: string;
}

export const StrategicHealthScore = ({ companyId }: StrategicHealthScoreProps) => {
  const { data: healthData } = useQuery({
    queryKey: ["strategic-health", companyId],
    queryFn: async () => {
      // Fetch all relevant data
      const [objectivesRes, initiativesRes, metricsRes, insightsRes] = await Promise.all([
        supabase
          .from("strategic_objectives")
          .select("*, objective_updates(*)")
          .eq("company_id", companyId),
        supabase
          .from("initiatives")
          .select(`
            *,
            strategic_objectives!inner(company_id)
          `)
          .eq("strategic_objectives.company_id", companyId),
        supabase
          .from("metrics")
          .select(`
            *,
            strategic_objectives!inner(company_id),
            metric_updates(*)
          `)
          .eq("strategic_objectives.company_id", companyId),
        supabase
          .from("ai_insights")
          .select("*")
          .eq("company_id", companyId)
          .eq("status", "novo"),
      ]);

      const objectives = objectivesRes.data || [];
      const initiatives = initiativesRes.data || [];
      const metrics = metricsRes.data || [];
      const insights = insightsRes.data || [];

      // Calculate score breakdown
      const breakdown: ScoreBreakdown[] = [];

      // 1. Objectives Progress (30% weight)
      const objectivesWithProgress = objectives.filter(
        (o) => o.objective_updates && o.objective_updates.length > 0
      );
      const avgObjectiveProgress =
        objectivesWithProgress.reduce((acc, o) => {
          const latestUpdate = o.objective_updates?.[0];
          return acc + (latestUpdate?.progress_percentage || 0);
        }, 0) / (objectivesWithProgress.length || 1);

      breakdown.push({
        category: "Progresso de Objetivos",
        score: Math.round(avgObjectiveProgress),
        weight: 30,
        description: `${objectivesWithProgress.length}/${objectives.length} objetivos com progresso`,
      });

      // 2. Initiatives Completion (25% weight)
      const completedInitiatives = initiatives.filter((i) => i.status === "concluída").length;
      const initiativesScore = (completedInitiatives / (initiatives.length || 1)) * 100;

      breakdown.push({
        category: "Conclusão de Iniciativas",
        score: Math.round(initiativesScore),
        weight: 25,
        description: `${completedInitiatives}/${initiatives.length} iniciativas concluídas`,
      });

      // 3. Metrics Tracking (20% weight)
      const metricsWithUpdates = metrics.filter(
        (m) => m.metric_updates && m.metric_updates.length > 0
      ).length;
      const metricsScore = (metricsWithUpdates / (metrics.length || 1)) * 100;

      breakdown.push({
        category: "Acompanhamento de Métricas",
        score: Math.round(metricsScore),
        weight: 20,
        description: `${metricsWithUpdates}/${metrics.length} métricas atualizadas`,
      });

      // 4. Strategic Alignment (15% weight) - ICE scores
      const initiativesWithICE = initiatives.filter((i) => i.ice_score && i.ice_score > 0);
      const avgICEScore =
        initiativesWithICE.reduce((acc, i) => acc + (i.ice_score || 0), 0) /
        (initiativesWithICE.length || 1);
      const alignmentScore = Math.min((avgICEScore / 1000) * 100, 100);

      breakdown.push({
        category: "Alinhamento Estratégico",
        score: Math.round(alignmentScore),
        weight: 15,
        description: `Score ICE médio: ${Math.round(avgICEScore)}`,
      });

      // 5. Risk Management (10% weight)
      const highPriorityInsights = insights.filter((i) => i.priority === "alta").length;
      const riskScore = Math.max(100 - highPriorityInsights * 10, 0);

      breakdown.push({
        category: "Gestão de Riscos",
        score: riskScore,
        weight: 10,
        description: `${highPriorityInsights} alertas de alta prioridade`,
      });

      // Calculate overall score
      const overallScore = breakdown.reduce(
        (acc, item) => acc + (item.score * item.weight) / 100,
        0
      );

      return {
        overallScore: Math.round(overallScore),
        breakdown,
        trend: overallScore >= 70 ? "up" : overallScore >= 50 ? "stable" : "down",
      };
    },
    enabled: !!companyId,
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-primary";
    if (score >= 40) return "text-warning";
    return "text-destructive";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excelente";
    if (score >= 60) return "Bom";
    if (score >= 40) return "Regular";
    return "Crítico";
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-success" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-destructive" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Saúde Estratégica
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {healthData ? (
          <>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className={`text-5xl font-bold ${getScoreColor(healthData.overallScore)}`}>
                  {healthData.overallScore}
                </span>
                {getTrendIcon(healthData.trend)}
              </div>
              <Badge variant="outline" className="text-sm">
                {getScoreLabel(healthData.overallScore)}
              </Badge>
            </div>

            <div className="space-y-4">
              {healthData.breakdown.map((item) => (
                <div key={item.category} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.category}</span>
                    <span className={getScoreColor(item.score)}>{item.score}%</span>
                  </div>
                  <Progress value={item.score} className="h-2" />
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Calculando saúde estratégica...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

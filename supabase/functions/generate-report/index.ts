import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ReportRequest {
  companyId: string;
  reportType: "executive" | "detailed" | "metrics" | "custom";
  sections?: string[];
  format?: "json" | "html" | "markdown";
  includeCharts?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const {
      companyId,
      reportType,
      sections = [],
      format = "json",
      includeCharts = false,
      dateRange,
    }: ReportRequest = await req.json();

    console.log("Generating report:", { companyId, reportType, format });

    // Fetch company data
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("*")
      .eq("id", companyId)
      .single();

    if (companyError || !company) {
      throw new Error("Company not found");
    }

    // Fetch all relevant data
    const [
      objectivesRes,
      initiativesRes,
      metricsRes,
      insightsRes,
      ogsmRes,
      swotRes,
      executionPlanRes,
    ] = await Promise.all([
      supabase
        .from("strategic_objectives")
        .select("*, objective_updates(*), metrics(*), initiatives(*)")
        .eq("company_id", companyId),
      supabase
        .from("initiatives")
        .select(`
          *,
          strategic_objectives!inner(company_id, title)
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
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("ogsm")
        .select(`
          *,
          ogsm_goals(*, ogsm_strategies(*, ogsm_measures(*)))
        `)
        .eq("company_id", companyId)
        .single(),
      supabase
        .from("strategic_context")
        .select("*")
        .eq("company_id", companyId)
        .single(),
      supabase
        .from("execution_plan")
        .select("*, weekly_checkins(*)")
        .eq("company_id", companyId)
        .single(),
    ]);

    const objectives = objectivesRes.data || [];
    const initiatives = initiativesRes.data || [];
    const metrics = metricsRes.data || [];
    const insights = insightsRes.data || [];
    const ogsm = ogsmRes.data;
    const swot = swotRes.data;
    const executionPlan = executionPlanRes.data;

    // Calculate key metrics
    const totalObjectives = objectives.length;
    const completedObjectives = objectives.filter(
      (o) => o.objective_updates?.some((u: any) => u.status === "concluido")
    ).length;

    const totalInitiatives = initiatives.length;
    const completedInitiatives = initiatives.filter((i) => i.status === "concluída").length;

    const topICEInitiatives = initiatives
      .filter((i) => i.ice_score)
      .sort((a, b) => (b.ice_score || 0) - (a.ice_score || 0))
      .slice(0, 5);

    const avgObjectiveProgress =
      objectives.reduce((acc, o) => {
        const latestUpdate = o.objective_updates?.[0];
        return acc + (latestUpdate?.progress_percentage || 0);
      }, 0) / (objectives.length || 1);

    // Build report based on type
    let reportData: any = {
      metadata: {
        generatedAt: new Date().toISOString(),
        generatedBy: user.email,
        companyName: company.name,
        reportType,
        format,
      },
      summary: {
        healthScore: Math.round(avgObjectiveProgress),
        objectives: {
          total: totalObjectives,
          completed: completedObjectives,
          completionRate: Math.round((completedObjectives / totalObjectives) * 100) || 0,
        },
        initiatives: {
          total: totalInitiatives,
          completed: completedInitiatives,
          completionRate: Math.round((completedInitiatives / totalInitiatives) * 100) || 0,
        },
        metrics: {
          total: metrics.length,
          tracked: metrics.filter((m) => m.metric_updates && m.metric_updates.length > 0).length,
        },
        insights: {
          total: insights.length,
          highPriority: insights.filter((i) => i.priority === "alta").length,
        },
      },
    };

    // Add sections based on report type
    if (reportType === "executive" || reportType === "detailed") {
      reportData.company = {
        name: company.name,
        segment: company.segment,
        model: company.model,
        vision: company.vision,
        mission: company.mission,
        values: company.values,
      };

      if (swot) {
        reportData.swot = {
          strengths: swot.strengths,
          weaknesses: swot.weaknesses,
          opportunities: swot.opportunities,
          threats: swot.threats,
        };
      }

      if (ogsm) {
        reportData.ogsm = {
          objective: ogsm.objective,
          goals: ogsm.ogsm_goals,
        };
      }

      reportData.objectives = objectives.map((o) => ({
        id: o.id,
        title: o.title,
        description: o.description,
        perspective: o.perspective,
        priority: o.priority,
        progress: o.objective_updates?.[0]?.progress_percentage || 0,
        status: o.objective_updates?.[0]?.status || "nao_iniciado",
        metricsCount: o.metrics?.length || 0,
        initiativesCount: o.initiatives?.length || 0,
      }));

      reportData.topInitiatives = topICEInitiatives.map((i) => ({
        title: i.title,
        objective: i.strategic_objectives?.title,
        iceScore: i.ice_score,
        impact: i.impact_score,
        confidence: i.confidence_score,
        ease: i.ease_score,
        status: i.status,
      }));
    }

    if (reportType === "detailed") {
      reportData.initiatives = initiatives.map((i) => ({
        title: i.title,
        objective: i.strategic_objectives?.title,
        status: i.status,
        iceScore: i.ice_score,
        owner: i.owner,
        dueDate: i.due_date || i.when_deadline,
        what: i.what,
        why: i.why,
        who: i.who,
        where: i.where_location,
        when: i.when_deadline,
        how: i.how,
        howMuch: i.how_much,
      }));

      reportData.metrics = metrics.map((m) => ({
        name: m.name,
        currentValue: m.current_value,
        target: m.target,
        period: m.period,
        source: m.source,
        updatesCount: m.metric_updates?.length || 0,
      }));
    }

    if (reportType === "metrics") {
      reportData.metricsDetailed = metrics.map((m) => ({
        name: m.name,
        currentValue: m.current_value,
        target: m.target,
        period: m.period,
        source: m.source,
        history: m.metric_updates?.map((u: any) => ({
          value: u.value,
          recordedAt: u.recorded_at,
          notes: u.notes,
        })),
      }));
    }

    if (executionPlan) {
      reportData.execution = {
        mci: executionPlan.mci,
        weeklyActions: executionPlan.weekly_actions,
        scoreboard: executionPlan.scoreboard,
        checkinsCount: executionPlan.weekly_checkins?.length || 0,
      };
    }

    reportData.insights = insights.map((i) => ({
      type: i.insight_type,
      title: i.title,
      description: i.description,
      priority: i.priority,
      status: i.status,
      createdAt: i.created_at,
    }));

    // Format response based on requested format
    if (format === "html") {
      const html = generateHTMLReport(reportData);
      return new Response(html, {
        headers: { ...corsHeaders, "Content-Type": "text/html" },
        status: 200,
      });
    }

    if (format === "markdown") {
      const markdown = generateMarkdownReport(reportData);
      return new Response(markdown, {
        headers: { ...corsHeaders, "Content-Type": "text/markdown" },
        status: 200,
      });
    }

    return new Response(JSON.stringify(reportData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Error generating report:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

function generateHTMLReport(data: any): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Relatório Estratégico - ${data.company?.name || "Empresa"}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
    h1 { color: #2563eb; }
    h2 { color: #1e40af; margin-top: 30px; }
    .summary { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .metric { display: inline-block; margin: 10px 20px 10px 0; }
    .metric-value { font-size: 32px; font-weight: bold; color: #2563eb; }
    .metric-label { font-size: 14px; color: #6b7280; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background: #f9fafb; font-weight: 600; }
  </style>
</head>
<body>
  <h1>Relatório Estratégico Executivo</h1>
  <p><strong>Empresa:</strong> ${data.company?.name || "N/A"}</p>
  <p><strong>Gerado em:</strong> ${new Date(data.metadata.generatedAt).toLocaleString("pt-BR")}</p>
  
  <div class="summary">
    <h2>Resumo Executivo</h2>
    <div class="metric">
      <div class="metric-value">${data.summary.healthScore}</div>
      <div class="metric-label">Score de Saúde</div>
    </div>
    <div class="metric">
      <div class="metric-value">${data.summary.objectives.completed}/${data.summary.objectives.total}</div>
      <div class="metric-label">Objetivos Concluídos</div>
    </div>
    <div class="metric">
      <div class="metric-value">${data.summary.initiatives.completed}/${data.summary.initiatives.total}</div>
      <div class="metric-label">Iniciativas Concluídas</div>
    </div>
  </div>
  
  ${data.objectives ? `
  <h2>Objetivos Estratégicos</h2>
  <table>
    <thead>
      <tr>
        <th>Título</th>
        <th>Perspectiva</th>
        <th>Progresso</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${data.objectives.map((o: any) => `
        <tr>
          <td>${o.title}</td>
          <td>${o.perspective || "N/A"}</td>
          <td>${o.progress}%</td>
          <td>${o.status}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>
  ` : ""}
  
  ${data.topInitiatives ? `
  <h2>Top 5 Iniciativas (ICE Score)</h2>
  <table>
    <thead>
      <tr>
        <th>Iniciativa</th>
        <th>Objetivo</th>
        <th>ICE Score</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${data.topInitiatives.map((i: any) => `
        <tr>
          <td>${i.title}</td>
          <td>${i.objective || "N/A"}</td>
          <td>${i.iceScore || "N/A"}</td>
          <td>${i.status}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>
  ` : ""}
</body>
</html>
  `;
}

function generateMarkdownReport(data: any): string {
  return `
# Relatório Estratégico Executivo

**Empresa:** ${data.company?.name || "N/A"}  
**Gerado em:** ${new Date(data.metadata.generatedAt).toLocaleString("pt-BR")}

## Resumo Executivo

- **Score de Saúde:** ${data.summary.healthScore}
- **Objetivos:** ${data.summary.objectives.completed}/${data.summary.objectives.total} concluídos (${data.summary.objectives.completionRate}%)
- **Iniciativas:** ${data.summary.initiatives.completed}/${data.summary.initiatives.total} concluídas (${data.summary.initiatives.completionRate}%)

${data.objectives ? `
## Objetivos Estratégicos

${data.objectives.map((o: any) => `
### ${o.title}
- **Perspectiva:** ${o.perspective || "N/A"}
- **Progresso:** ${o.progress}%
- **Status:** ${o.status}
- **Métricas:** ${o.metricsCount}
- **Iniciativas:** ${o.initiativesCount}
`).join("\n")}
` : ""}

${data.topInitiatives ? `
## Top 5 Iniciativas (ICE Score)

${data.topInitiatives.map((i: any, idx: number) => `
${idx + 1}. **${i.title}** (${i.objective || "N/A"})
   - ICE Score: ${i.iceScore || "N/A"}
   - Status: ${i.status}
`).join("\n")}
` : ""}
  `;
}

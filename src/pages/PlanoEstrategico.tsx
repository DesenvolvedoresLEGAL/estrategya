import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OGSMCard } from "@/components/planning/OGSMCard";
import { OKRCard } from "@/components/planning/OKRCard";
import { BSCBalance } from "@/components/planning/BSCBalance";
import { MatrizImpactoEsforco } from "@/components/planning/MatrizImpactoEsforco";
import { WBRPlan } from "@/components/planning/WBRPlan";
import { PESTELDisplay } from "@/components/planning/PESTELDisplay";
import { ArrowLeft, RefreshCw, FileText, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { UpgradePrompt } from "@/components/subscription/UpgradePrompt";

export default function PlanoEstrategico() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  
  const { canExportPDF, tier } = useSubscriptionLimits(companyId || undefined);
  
  // Data states
  const [ogsmData, setOgsmData] = useState<any>(null);
  const [okrData, setOkrData] = useState<any[]>([]);
  const [bscData, setBscData] = useState<any>(null);
  const [matrizData, setMatrizData] = useState<any>(null);
  const [wbrData, setWbrData] = useState<any>(null);
  const [pestelData, setPestelData] = useState<any>(null);
  const [objetivos, setObjetivos] = useState<any[]>([]);

  useEffect(() => {
    loadStrategicPlan();
  }, []);

  const loadStrategicPlan = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // Load company
      const { data: company } = await supabase
        .from('companies')
        .select('*')
        .eq('owner_user_id', user.id)
        .single();

      if (!company) {
        toast({
          title: "Empresa não encontrada",
          description: "Configure sua empresa primeiro",
          variant: "destructive"
        });
        navigate('/planejamento');
        return;
      }

      setCompanyId(company.id);
      setCompanyName(company.name);

      // Load OGSM
      const { data: ogsm } = await supabase
        .from('ogsm')
        .select(`
          *,
          ogsm_goals (*),
          ogsm_strategies (*),
          ogsm_measures (*)
        `)
        .eq('company_id', company.id)
        .single();

      if (ogsm) {
        setOgsmData({
          objective: ogsm.objective,
          goals: ogsm.ogsm_goals || [],
          strategies: ogsm.ogsm_strategies || [],
          measures: ogsm.ogsm_measures || []
        });
      }

      // Load Strategic Objectives (for OKR visualization)
      const { data: objectives } = await supabase
        .from('strategic_objectives')
        .select(`
          *,
          metrics (*)
        `)
        .eq('company_id', company.id)
        .order('priority', { ascending: true });

      setObjetivos(objectives || []);

      // Transform objectives into OKR format
      if (objectives && objectives.length > 0) {
        const okrs = objectives.map((obj, idx) => ({
          goal_index: idx,
          objective: obj.title,
          key_results: (obj.metrics || []).map((m: any) => ({
            kr: m.name,
            target: m.target || 'A definir',
            metrica: m.current_value || '0'
          }))
        }));
        setOkrData(okrs);
      }

      // Load Initiatives for Matriz
      const { data: initiatives } = await supabase
        .from('initiatives')
        .select('*')
        .in('objective_id', objectives?.map(o => o.id) || []);

      if (initiatives && initiatives.length > 0) {
        // Organize by priority quadrant
        const matriz = {
          fazer_agora: initiatives.filter(i => i.priority_quadrant === 'fazer_agora').map((i, idx) => ({
            initiative_index: idx,
            titulo: i.title,
            impacto: String(i.impact || 'Alto'),
            esforco: String(i.effort || 'Baixo'),
            justificativa: i.description || ''
          })),
          planejar: initiatives.filter(i => i.priority_quadrant === 'planejar').map((i, idx) => ({
            initiative_index: idx,
            titulo: i.title,
            impacto: String(i.impact || 'Alto'),
            esforco: String(i.effort || 'Alto'),
            justificativa: i.description || ''
          })),
          oportunidades_rapidas: initiatives.filter(i => i.priority_quadrant === 'quick_win').map((i, idx) => ({
            initiative_index: idx,
            titulo: i.title,
            impacto: String(i.impact || 'Médio'),
            esforco: String(i.effort || 'Baixo'),
            justificativa: i.description || ''
          })),
          evitar: initiatives.filter(i => i.priority_quadrant === 'evitar').map((i, idx) => ({
            initiative_index: idx,
            titulo: i.title,
            impacto: String(i.impact || 'Baixo'),
            esforco: String(i.effort || 'Alto'),
            justificativa: i.description || ''
          }))
        };
        setMatrizData(matriz);
      }

      // Load BSC Balance (mock for now - would need actual BSC analysis)
      const bscPerspectives = {
        financas: { 
          coberto: objectives?.some(o => o.perspective === 'financeira') || false,
          itens: objectives?.filter(o => o.perspective === 'financeira').map(o => o.title) || [],
          sugestao: objectives?.some(o => o.perspective === 'financeira') ? null : 'Adicione objetivos de receita, lucratividade ou eficiência de custos'
        },
        clientes: {
          coberto: objectives?.some(o => o.perspective === 'clientes') || false,
          itens: objectives?.filter(o => o.perspective === 'clientes').map(o => o.title) || [],
          sugestao: objectives?.some(o => o.perspective === 'clientes') ? null : 'Adicione objetivos de satisfação do cliente, NPS ou retenção'
        },
        processos: {
          coberto: objectives?.some(o => o.perspective === 'processos') || false,
          itens: objectives?.filter(o => o.perspective === 'processos').map(o => o.title) || [],
          sugestao: objectives?.some(o => o.perspective === 'processos') ? null : 'Adicione objetivos de otimização de processos ou qualidade'
        },
        aprendizado: {
          coberto: objectives?.some(o => o.perspective === 'aprendizado') || false,
          itens: objectives?.filter(o => o.perspective === 'aprendizado').map(o => o.title) || [],
          sugestao: objectives?.some(o => o.perspective === 'aprendizado') ? null : 'Adicione objetivos de capacitação da equipe ou inovação'
        },
        explicacao: 'Um plano estratégico equilibrado deve ter objetivos nas 4 perspectivas do BSC para garantir crescimento sustentável.'
      };
      setBscData(bscPerspectives);

      // Load WBR/Execution Plan
      const { data: executionPlan } = await supabase
        .from('execution_plan')
        .select('*')
        .eq('company_id', company.id)
        .single();

      if (executionPlan) {
        setWbrData({
          mci: executionPlan.mci,
          acoes_semanais: executionPlan.weekly_actions || [],
          placar: executionPlan.scoreboard || { metricas: [] },
          cadencia: executionPlan.review_cadence || {
            reuniao_tipo: 'Weekly Business Review',
            frequencia: 'Semanal',
            duracao: '30-45 minutos',
            participantes_sugeridos: 'Time de liderança',
            pauta: 'Revisar MCI, discutir ações e métricas'
          }
        });
      }

      // Load PESTEL
      const { data: pestel } = await supabase
        .from('pestel_analysis')
        .select('*')
        .eq('company_id', company.id)
        .single();

      if (pestel) {
        setPestelData({
          political: pestel.political,
          economic: pestel.economic,
          social: pestel.social,
          technological: pestel.technological,
          environmental: pestel.environmental,
          legal: pestel.legal
        });
      }

    } catch (error) {
      console.error('Error loading strategic plan:', error);
      toast({
        title: "Erro ao carregar plano estratégico",
        description: "Tente novamente mais tarde",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      // Check if user can export PDF
      const canExport = canExportPDF();
      
      if (!canExport) {
        setShowUpgradePrompt(true);
        return;
      }

      toast({
        title: "Gerando PDF...",
        description: "Aguarde enquanto preparamos seu relatório",
      });

      const { exportToPDF } = await import('@/utils/pdfExport');
      await exportToPDF('plano-content', {
        filename: `plano-estrategico-${companyName.toLowerCase().replace(/\s/g, '-')}.pdf`,
        title: `Plano Estratégico - ${companyName}`,
        subtitle: new Date().toLocaleDateString('pt-BR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        orientation: 'portrait',
        watermark: tier === 'free', // Add watermark for FREE users
        canExport: true // We already checked above
      });

      toast({
        title: "✓ PDF gerado com sucesso!",
        description: tier === 'free' 
          ? "Faça upgrade para remover a marca d'água" 
          : "O arquivo foi baixado para seu computador",
      });
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Erro ao gerar PDF",
        description: error.message || "Tente novamente mais tarde",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando plano estratégico...</p>
        </div>
      </div>
    );
  }

  const hasData = ogsmData || okrData.length > 0 || pestelData;

  return (
    <div className="min-h-screen bg-background">
      <div id="plano-content" className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Plano Estratégico Completo</h1>
            <p className="text-muted-foreground">{companyName}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportPDF}>
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
            <Button onClick={() => navigate('/planejamento')}>
              <FileText className="h-4 w-4 mr-2" />
              Editar Plano
            </Button>
          </div>
        </div>

        {!hasData ? (
          <Card>
            <CardHeader>
              <CardTitle>Plano estratégico não encontrado</CardTitle>
              <CardDescription>
                Complete o wizard de planejamento para visualizar seu plano estratégico integrado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/planejamento')}>
                Iniciar Planejamento
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="visao-geral" className="space-y-6">
            <TabsList className="grid grid-cols-2 lg:grid-cols-7 w-full">
              <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
              <TabsTrigger value="ogsm" disabled={!ogsmData}>OGSM</TabsTrigger>
              <TabsTrigger value="okr" disabled={okrData.length === 0}>OKRs</TabsTrigger>
              <TabsTrigger value="bsc" disabled={!bscData}>BSC</TabsTrigger>
              <TabsTrigger value="matriz" disabled={!matrizData}>Matriz</TabsTrigger>
              <TabsTrigger value="wbr" disabled={!wbrData}>WBR</TabsTrigger>
              <TabsTrigger value="pestel" disabled={!pestelData}>PESTEL</TabsTrigger>
            </TabsList>

            {/* Visão Geral */}
            <TabsContent value="visao-geral" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Resumo Executivo</CardTitle>
                  <CardDescription>
                    Visão consolidada do seu plano estratégico
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-sm text-muted-foreground">Frameworks Utilizados</h3>
                      <div className="space-y-1">
                        {ogsmData && <div className="text-sm">✓ OGSM (Objetivo + Goals + Estratégias + Métricas)</div>}
                        {okrData.length > 0 && <div className="text-sm">✓ OKRs ({okrData.length} objetivos)</div>}
                        {bscData && <div className="text-sm">✓ Balanced Scorecard</div>}
                        {matrizData && <div className="text-sm">✓ Matriz Impacto x Esforço</div>}
                        {wbrData && <div className="text-sm">✓ WBR (Weekly Business Review)</div>}
                        {pestelData && <div className="text-sm">✓ Análise PESTEL</div>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-semibold text-sm text-muted-foreground">Objetivos Estratégicos</h3>
                      <div className="text-3xl font-bold text-primary">{objetivos.length}</div>
                      <p className="text-sm text-muted-foreground">
                        Distribuídos nas perspectivas BSC
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-semibold text-sm text-muted-foreground">Iniciativas Priorizadas</h3>
                      <div className="text-3xl font-bold text-primary">
                        {matrizData ? 
                          matrizData.fazer_agora.length + 
                          matrizData.planejar.length + 
                          matrizData.oportunidades_rapidas.length + 
                          matrizData.evitar.length 
                          : 0}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Organizadas por impacto e esforço
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {ogsmData && (
                <Card>
                  <CardHeader>
                    <CardTitle>Objetivo Estratégico Principal</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xl font-semibold">{ogsmData.objective}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* OGSM */}
            <TabsContent value="ogsm" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>OGSM Framework</CardTitle>
                  <CardDescription>
                    Objective, Goals, Strategies, Measures
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {ogsmData ? (
                    <OGSMCard ogsm={ogsmData} />
                  ) : (
                    <p className="text-muted-foreground">Nenhum OGSM configurado</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* OKRs */}
            <TabsContent value="okr" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>OKRs - Objectives and Key Results</CardTitle>
                  <CardDescription>
                    Objetivos e resultados-chave mensuráveis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {okrData.length > 0 ? (
                      okrData.map((okr, idx) => (
                        <OKRCard 
                          key={idx} 
                          okr={okr}
                          goalTitle={ogsmData?.goals[idx]?.titulo}
                        />
                      ))
                    ) : (
                      <p className="text-muted-foreground">Nenhum OKR configurado</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* BSC */}
            <TabsContent value="bsc" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Balanced Scorecard</CardTitle>
                  <CardDescription>
                    Equilíbrio entre as 4 perspectivas estratégicas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {bscData ? (
                    <BSCBalance bsc={bscData} />
                  ) : (
                    <p className="text-muted-foreground">Análise BSC não disponível</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Matriz */}
            <TabsContent value="matriz" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Matriz Impacto x Esforço</CardTitle>
                  <CardDescription>
                    Priorização de iniciativas por impacto e esforço
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {matrizData ? (
                    <MatrizImpactoEsforco
                      fazer_agora={matrizData.fazer_agora}
                      planejar={matrizData.planejar}
                      oportunidades_rapidas={matrizData.oportunidades_rapidas}
                      evitar={matrizData.evitar}
                    />
                  ) : (
                    <p className="text-muted-foreground">Nenhuma iniciativa priorizada</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* WBR */}
            <TabsContent value="wbr" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>WBR - Weekly Business Review</CardTitle>
                  <CardDescription>
                    Plano de execução 12 semanas com ações e métricas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {wbrData ? (
                    <WBRPlan wbr={wbrData} />
                  ) : (
                    <p className="text-muted-foreground">Plano de execução não configurado</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* PESTEL */}
            <TabsContent value="pestel" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Análise PESTEL</CardTitle>
                  <CardDescription>
                    Fatores externos que impactam o negócio
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {pestelData ? (
                    <PESTELDisplay pestel={pestelData} />
                  ) : (
                    <p className="text-muted-foreground">Análise PESTEL não disponível</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>

      <UpgradePrompt
        open={showUpgradePrompt}
        onOpenChange={setShowUpgradePrompt}
        limitType="export_pdf"
        feature="Exportação de PDF"
      />
    </div>
  );
}

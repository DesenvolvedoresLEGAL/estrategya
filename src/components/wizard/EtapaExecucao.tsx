import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Calendar, Sparkles, Save, Target, Clock, Plus } from "lucide-react";
import { WBRPlan } from "@/components/planning/WBRPlan";
import { LiveScoreboard } from "@/components/planning/LiveScoreboard";
import { WeeklyCheckinModal } from "@/components/planning/WeeklyCheckinModal";
import { CheckinHistory } from "@/components/planning/CheckinHistory";
import { FrameworkInfo } from "./FrameworkInfo";

interface Props {
  companyData: any;
  prioritizationData: any;
  initialData: any;
  onNext: (data: any) => void;
  onBack: () => void;
  onSaveAndExit?: () => Promise<void>;
}

export const EtapaExecucao = ({ companyData, prioritizationData, initialData, onNext, onBack, onSaveAndExit }: Props) => {
  const [loading, setLoading] = useState(false);
  const [executionData, setExecutionData] = useState(initialData);
  const [executionPlanId, setExecutionPlanId] = useState<string | null>(null);
  const [checkinModalOpen, setCheckinModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleGenerateExecutionPlan = async () => {
    setLoading(true);

    try {
      // Buscar TOP 3 iniciativas por ICE Score
      const { data: initiatives, error: initiativesError } = await supabase
        .from('initiatives')
        .select(`
          *,
          strategic_objectives(title, company_id)
        `)
        .eq('strategic_objectives.company_id', companyData.id)
        .not('ice_score', 'is', null)
        .order('ice_score', { ascending: false })
        .limit(3);

      if (initiativesError) throw initiativesError;

      if (!initiatives || initiatives.length === 0) {
        toast.error("Nenhuma iniciativa com ICE Score encontrada. Priorize as iniciativas primeiro.");
        return;
      }

      // Chamar AI para gerar plano 4DX com dados do 5W2H
      const { data, error } = await supabase.functions.invoke('ai-execucao', {
        body: {
          company: companyData,
          initiatives: initiatives.map(i => ({
            title: i.title,
            description: i.description,
            objective: i.strategic_objectives?.title,
            ice_score: i.ice_score,
            what: i.what,
            why: i.why,
            who: i.who,
            when_deadline: i.when_deadline,
            where_location: i.where_location,
            how: i.how,
            how_much: i.how_much,
          })),
        },
      });

      if (error) throw error;

      // Salvar execution_plan no banco
      const { data: savedPlan, error: saveError } = await supabase
        .from('execution_plan')
        .upsert({
          company_id: companyData.id,
          mci: data.mci,
          weekly_actions: data.weekly_actions || [],
          scoreboard: data.scoreboard || {},
          review_cadence: data.review_cadence || {},
        }, { onConflict: 'company_id' })
        .select()
        .single();

      if (saveError) throw saveError;

      if (savedPlan) {
        setExecutionPlanId(savedPlan.id);
      }

      setExecutionData(data);
      toast.success("Plano de execução 4DX gerado baseado nas top 3 iniciativas ICE!");
    } catch (error: any) {
      console.error('Error generating execution plan:', error);
      toast.error("Erro ao gerar plano: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (!executionData) {
      toast.error("Gere o plano de execução antes de continuar");
      return;
    }
    onNext(executionData);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary" />
            Plano de Execução - 4 Disciplinas da Execução (4DX)
          </CardTitle>
          <CardDescription>
            Transforme sua estratégia em ações semanais usando o framework 4DX
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FrameworkInfo framework="4DX" />
          
          {!executionData ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Vamos criar seu plano de execução!</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                O framework 4DX vai pegar suas TOP 3 iniciativas (ICE Score) e criar um plano 
                de execução semanal com foco no que realmente importa.
              </p>
              <Button onClick={handleGenerateExecutionPlan} disabled={loading} size="lg">
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Gerando Plano...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 w-4 h-4" />
                    Gerar Plano de Execução
                  </>
                )}
              </Button>
            </div>
           ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <Badge variant="default">Plano 4DX Gerado</Badge>
                {executionPlanId && (
                  <Button onClick={() => setCheckinModalOpen(true)} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Check-in Semanal
                  </Button>
                )}
              </div>

              <Tabs defaultValue="plano" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="plano">Plano WBR</TabsTrigger>
                  <TabsTrigger value="placar">
                    <Target className="h-4 w-4 mr-2" />
                    Placar Visível
                  </TabsTrigger>
                  <TabsTrigger value="checkin">
                    <Calendar className="h-4 w-4 mr-2" />
                    Check-ins
                  </TabsTrigger>
                  <TabsTrigger value="historico">
                    <Clock className="h-4 w-4 mr-2" />
                    Histórico
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="plano" className="space-y-6">
                  <WBRPlan wbr={{
                    mci: executionData.mci,
                    acoes_semanais: executionData.weekly_actions || [],
                    placar: executionData.scoreboard || { metricas: [] },
                    cadencia: executionData.review_cadence || {
                      reuniao_tipo: '',
                      frequencia: '',
                      participantes_sugeridos: '',
                      pauta: ''
                    }
                  }} />

                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">As 4 Disciplinas da Execução:</h4>
                    <ul className="space-y-2 text-sm">
                      <li><strong>1. Foco no Crucialmente Importante:</strong> Sua MCI define onde concentrar energia</li>
                      <li><strong>2. Atuar nas Medidas de Direção:</strong> Ações que você pode controlar</li>
                      <li><strong>3. Manter um Placar Visível:</strong> Todos sabem o score em tempo real</li>
                      <li><strong>4. Criar Cadência de Responsabilização:</strong> Reuniões semanais de progresso</li>
                    </ul>
                  </div>
                </TabsContent>

                <TabsContent value="placar">
                  <LiveScoreboard 
                    companyId={companyData.id}
                    executionPlanId={executionPlanId || undefined}
                    key={refreshKey}
                  />
                </TabsContent>

                <TabsContent value="checkin">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        Check-ins Semanais WBR
                      </CardTitle>
                      <CardDescription>
                        Registre seus check-ins semanais para acompanhar o progresso
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {executionPlanId ? (
                        <Button onClick={() => setCheckinModalOpen(true)} className="w-full">
                          <Plus className="h-4 w-4 mr-2" />
                          Registrar Novo Check-in
                        </Button>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          Configure o plano de execução primeiro
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="historico">
                  {executionPlanId ? (
                    <CheckinHistory 
                      executionPlanId={executionPlanId}
                      key={refreshKey}
                    />
                  ) : (
                    <Card>
                      <CardContent className="py-8 text-center text-muted-foreground">
                        <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Configure o plano de execução primeiro</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>

              <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                <p className="text-sm text-foreground font-medium">
                  ✓ Plano de execução criado! Última etapa: definir métricas e KPIs para acompanhamento.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Check-in */}
      {executionPlanId && (
        <WeeklyCheckinModal
          open={checkinModalOpen}
          onOpenChange={setCheckinModalOpen}
          companyId={companyData.id}
          executionPlanId={executionPlanId}
          onSuccess={() => {
            setRefreshKey(prev => prev + 1);
            toast.success('Check-in registrado!');
          }}
        />
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 w-4 h-4" />
          Voltar
        </Button>
        <div className="flex gap-2">
          {onSaveAndExit && (
            <Button 
              variant="ghost" 
              onClick={onSaveAndExit}
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar e Sair
            </Button>
          )}
          {executionData && (
            <Button onClick={handleNext} size="lg">
              Próximo
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Calendar, Sparkles, Save } from "lucide-react";
import { WBRPlan } from "@/components/planning/WBRPlan";
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
      const { error: saveError } = await supabase
        .from('execution_plan')
        .upsert({
          company_id: companyData.id,
          mci: data.mci,
          weekly_actions: data.weekly_actions || [],
          scoreboard: data.scoreboard || {},
          review_cadence: data.review_cadence || {},
        });

      if (saveError) throw saveError;

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
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="default">Plano 4DX Gerado</Badge>
              </div>

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

              <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                <p className="text-sm text-foreground font-medium">
                  ✓ Plano de execução criado! Última etapa: definir métricas e KPIs para acompanhamento.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
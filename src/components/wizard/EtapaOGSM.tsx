import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Target, Sparkles } from "lucide-react";
import { OGSMCard } from "@/components/planning/OGSMCard";
import { FrameworkInfo } from "./FrameworkInfo";

interface Props {
  companyData: any;
  analysisData: any;
  initialData: any;
  onNext: (data: any) => void;
  onBack: () => void;
}

export const EtapaOGSM = ({ companyData, analysisData, initialData, onNext, onBack }: Props) => {
  const [loading, setLoading] = useState(false);
  const [ogsmData, setOgsmData] = useState(initialData);

  const handleGenerate = async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-ogsm', {
        body: {
          company: companyData,
          diagnostic: analysisData,
        },
      });

      if (error) throw error;

      // Salvar OGSM no banco
      const { data: ogsmRecord, error: ogsmError } = await supabase
        .from('ogsm')
        .upsert({
          company_id: companyData.id,
          objective: data.objective,
        })
        .select()
        .single();

      if (ogsmError) throw ogsmError;

      // Salvar Goals
      const goalsToInsert = data.goals.map((goal: any, index: number) => ({
        ogsm_id: ogsmRecord.id,
        title: goal.title,
        description: goal.description,
        mensuravel: goal.mensuravel,
        order_position: index + 1,
      }));

      const { data: insertedGoals, error: goalsError } = await supabase
        .from('ogsm_goals')
        .upsert(goalsToInsert)
        .select();

      if (goalsError) throw goalsError;

      // Salvar Strategies e Measures
      for (let i = 0; i < data.goals.length; i++) {
        const goal = data.goals[i];
        const goalRecord = insertedGoals[i];

        if (goal.strategies && goal.strategies.length > 0) {
          const strategiesToInsert = goal.strategies.map((strategy: any, sIndex: number) => ({
            ogsm_id: ogsmRecord.id,
            goal_id: goalRecord.id,
            title: strategy.title,
            description: strategy.description,
            order_position: sIndex + 1,
          }));

          const { data: insertedStrategies, error: strategiesError } = await supabase
            .from('ogsm_strategies')
            .upsert(strategiesToInsert)
            .select();

          if (strategiesError) throw strategiesError;

          // Salvar Measures para cada Strategy
          for (let j = 0; j < goal.strategies.length; j++) {
            const strategy = goal.strategies[j];
            const strategyRecord = insertedStrategies[j];

            if (strategy.measures && strategy.measures.length > 0) {
              const measuresToInsert = strategy.measures.map((measure: any) => ({
                strategy_id: strategyRecord.id,
                name: measure.name,
                o_que_medir: measure.o_que_medir,
                target: measure.target,
              }));

              const { error: measuresError } = await supabase
                .from('ogsm_measures')
                .upsert(measuresToInsert);

              if (measuresError) throw measuresError;
            }
          }
        }
      }

      setOgsmData(data);
      toast.success("OGSM gerado com sucesso!");
    } catch (error: any) {
      console.error('Error generating OGSM:', error);
      toast.error("Erro ao gerar OGSM: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (!ogsmData) {
      toast.error("Gere o OGSM antes de continuar");
      return;
    }
    onNext(ogsmData);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-6 h-6 text-primary" />
            OGSM - Objective, Goals, Strategies, Measures
          </CardTitle>
          <CardDescription>
            Vamos transformar sua análise em um plano estratégico estruturado usando o framework OGSM
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FrameworkInfo framework="OGSM" />
          
          {!ogsmData ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Target className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Pronto para estruturar seu plano?</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                O framework OGSM vai organizar sua estratégia em um objetivo claro, metas mensuráveis, 
                estratégias específicas e medidas de acompanhamento.
              </p>
              <Button onClick={handleGenerate} disabled={loading} size="lg">
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Gerando OGSM...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 w-4 h-4" />
                    Gerar OGSM
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="default">OGSM Gerado</Badge>
                <span className="text-sm text-muted-foreground">
                  Framework estratégico completo
                </span>
              </div>
              
              <OGSMCard ogsm={ogsmData} />

              <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                <p className="text-sm text-foreground font-medium">
                  ✓ OGSM estruturado! Agora vamos transformar isso em OKRs e validar com BSC.
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
        {ogsmData && (
          <Button onClick={handleNext} size="lg">
            Próximo
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
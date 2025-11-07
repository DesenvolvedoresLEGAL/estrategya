import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Target, Lightbulb } from "lucide-react";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { UpgradePrompt } from "@/components/subscription/UpgradePrompt";
import { useAnalytics } from "@/hooks/useAnalytics";

interface Props {
  companyData: any;
  analysisData: any;
  initialData: any;
  onNext: (data: any) => void;
  onBack: () => void;
}

const focoOptions = [
  { value: "crescimento", label: "Crescimento de Receita" },
  { value: "eficiencia", label: "Eficiência Operacional" },
  { value: "produto", label: "Produto e Experiência" },
  { value: "pessoas", label: "Pessoas e Cultura" },
  { value: "ai_automacao", label: "AI e Automação" },
];

export const EtapaObjetivos = ({ companyData, analysisData, initialData, onNext, onBack }: Props) => {
  const [loading, setLoading] = useState(false);
  const [focus, setFocus] = useState("");
  const [objectives, setObjectives] = useState(initialData || null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  
  const { canCreateObjective } = useSubscriptionLimits(companyData?.id);
  const { trackLimitReached, trackFeatureBlocked } = useAnalytics();

  const handleGenerate = async () => {
    if (!focus) {
      toast.error("Selecione um foco estratégico");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-estrategia', {
        body: {
          company: companyData,
          analysis: analysisData.leitura_executiva,
          focus,
        },
      });

      if (error) throw error;

      // Verificar limite de objetivos antes de salvar
      const canCreate = await canCreateObjective(companyData.id);
      
      if (!canCreate) {
        trackLimitReached("objectives", "free", "objectives_creation");
        trackFeatureBlocked("unlimited_objectives", "free", "pro");
        setShowUpgradePrompt(true);
        return;
      }

      // Salvar objetivos e iniciativas no banco
      const objectivePromises = data.objetivos.map(async (obj: any) => {
        const { data: savedObj, error: objError } = await supabase
          .from('strategic_objectives')
          .insert({
            company_id: companyData.id,
            title: obj.titulo,
            description: obj.descricao,
            horizon: obj.horizonte,
            perspective: obj.perspectiva,
            priority: obj.prioridade,
          })
          .select()
          .single();

        if (objError) throw objError;

        // Salvar iniciativas
        if (obj.iniciativas && obj.iniciativas.length > 0) {
          const { error: initError } = await supabase
            .from('initiatives')
            .insert(
              obj.iniciativas.map((init: any) => ({
                objective_id: savedObj.id,
                title: init.titulo,
                description: init.descricao,
                impact: init.impacto,
                effort: init.esforco,
                suggested_by_ai: true,
              }))
            );

          if (initError) throw initError;
        }

        return savedObj;
      });

      const savedObjectives = await Promise.all(objectivePromises);
      setObjectives(savedObjectives);
      toast.success("Objetivos gerados com sucesso!");
    } catch (error: any) {
      console.error('Error generating objectives:', error);
      toast.error("Erro ao gerar objetivos: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (!objectives) {
      toast.error("Gere os objetivos antes de continuar");
      return;
    }
    onNext(objectives);
  };

  const getHorizonColor = (horizon: string) => {
    switch (horizon) {
      case 'H1': return 'bg-success/10 text-success border-success/20';
      case 'H2': return 'bg-primary/10 text-primary border-primary/20';
      case 'H3': return 'bg-warning/10 text-warning border-warning/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getHorizonLabel = (horizon: string) => {
    switch (horizon) {
      case 'H1': return 'Curto Prazo';
      case 'H2': return 'Expansão';
      case 'H3': return 'Inovação';
      default: return horizon;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-6 h-6 text-primary" />
            Objetivos e Iniciativas Estratégicas
          </CardTitle>
          <CardDescription>
            Selecione seu foco prioritário para os próximos 12 meses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!objectives ? (
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-medium">Foco Estratégico</label>
                <Select value={focus} onValueChange={setFocus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione onde você quer focar" />
                  </SelectTrigger>
                  <SelectContent>
                    {focoOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="text-center py-8">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lightbulb className="w-8 h-8 text-primary" />
                </div>
                <p className="text-muted-foreground mb-6">
                  A IA vai gerar de 3 a 5 objetivos estratégicos com iniciativas práticas
                </p>
                <Button onClick={handleGenerate} disabled={loading || !focus} size="lg">
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Gerando objetivos...
                    </>
                  ) : (
                    <>
                      <Lightbulb className="mr-2 w-4 h-4" />
                      Gerar Objetivos
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {objectives.map((obj: any, idx: number) => (
                <Card key={idx} className="border-l-4 border-l-primary">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{obj.title}</CardTitle>
                        <CardDescription>{obj.description}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getHorizonColor(obj.horizon)}>
                          {getHorizonLabel(obj.horizon)}
                        </Badge>
                        <Badge variant="outline">{obj.perspective}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
              
              <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                <p className="text-sm text-success-foreground">
                  ✓ {objectives.length} objetivos estratégicos criados! Agora vamos definir as métricas de acompanhamento.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <UpgradePrompt
        open={showUpgradePrompt}
        onOpenChange={setShowUpgradePrompt}
        limitType="objectives"
      />

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 w-4 h-4" />
          Voltar
        </Button>
        {objectives && (
          <Button onClick={handleNext} size="lg">
            Finalizar
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

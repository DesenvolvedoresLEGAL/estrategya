import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, Grid3x3, Sparkles, Save } from "lucide-react";
import { MatrizImpactoEsforco } from "@/components/planning/MatrizImpactoEsforco";
import { ICERankingList } from "@/components/planning/ICERankingList";
import { FrameworkInfo } from "./FrameworkInfo";

interface Props {
  companyData: any;
  okrsBscData: any;
  initialData: any;
  onNext: (data: any) => void;
  onBack: () => void;
  onSaveAndExit?: () => Promise<void>;
}

export const EtapaPriorizacao = ({ companyData, okrsBscData, initialData, onNext, onBack, onSaveAndExit }: Props) => {
  const [loading, setLoading] = useState(false);
  const [prioritizationData, setPrioritizationData] = useState(initialData);
  const { toast } = useToast();

  const handlePrioritize = async () => {
    setLoading(true);

    try {
      // Buscar todas as initiatives criadas
      const { data: initiatives, error: initiativesError } = await supabase
        .from('initiatives')
        .select('*, strategic_objectives(title)')
        .eq('strategic_objectives.company_id', companyData.id);

      if (initiativesError) throw initiativesError;

      if (!initiatives || initiatives.length === 0) {
        toast({
          title: "Erro",
          description: "Nenhuma iniciativa encontrada para priorizar",
          variant: "destructive"
        });
        return;
      }

      // Chamar AI para priorizar
      const { data, error } = await supabase.functions.invoke('ai-priorizacao', {
        body: {
          initiatives: initiatives.map(i => ({
            id: i.id,
            title: i.title,
            description: i.description,
            objective: i.strategic_objectives?.title,
          })),
        },
      });

      if (error) throw error;

      // Atualizar initiatives com priorização e scores ICE sugeridos
      for (const quadrantKey of ['fazer_agora', 'planejar', 'oportunidades_rapidas', 'evitar']) {
        const quadrant = data[quadrantKey];
        if (Array.isArray(quadrant)) {
          for (const item of quadrant) {
            const originalInitiative = initiatives[item.initiative_index];
            if (originalInitiative) {
              const { error: updateError } = await supabase
                .from('initiatives')
                .update({
                  priority_quadrant: quadrantKey,
                  impact_score: item.impact_score || null,
                  ease_score: item.ease_score || null,
                  confidence_score: 5, // Valor inicial padrão, usuário ajusta depois
                })
                .eq('id', originalInitiative.id);

              if (updateError) console.error('Error updating initiative:', updateError);
            }
          }
        }
      }

      // Recarregar initiatives com os scores atualizados
      const { data: updatedInitiatives } = await supabase
        .from('initiatives')
        .select('*, strategic_objectives(title)')
        .eq('strategic_objectives.company_id', companyData.id)
        .order('ice_score', { ascending: false, nullsFirst: false });

      setPrioritizationData({ ...data, initiatives: updatedInitiatives });
      toast({
        title: "Sucesso!",
        description: "Iniciativas priorizadas com ICE Score sugerido pela IA!",
      });
    } catch (error: any) {
      console.error('Error prioritizing initiatives:', error);
      toast({
        title: "Erro ao priorizar",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (!prioritizationData) {
      toast({
        title: "Atenção",
        description: "Priorize as iniciativas antes de continuar",
        variant: "destructive"
      });
      return;
    }

    // Verificar se as top 3 têm ICE Score
    const top3 = prioritizationData.initiatives
      ?.filter((i: any) => i.ice_score !== null)
      .sort((a: any, b: any) => (b.ice_score || 0) - (a.ice_score || 0))
      .slice(0, 3) || [];

    if (top3.length === 0) {
      toast({
        title: "Atenção",
        description: "Nenhuma iniciativa com ICE Score. Ajuste os scores primeiro.",
        variant: "destructive"
      });
      return;
    }

    // Verificar se as top 3 têm 5W2H completo
    const missing5W2H = top3.filter((i: any) => !i.what || !i.why || !i.who);
    
    if (missing5W2H.length > 0) {
      toast({
        title: "⚠️ 5W2H Incompleto",
        description: `${missing5W2H.length} das top 3 iniciativas não têm 5W2H completo. Recomendamos preencher antes de continuar para um plano mais detalhado.`,
      });
    }

    onNext(prioritizationData);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid3x3 className="w-6 h-6 text-primary" />
            Priorização - Matriz Impacto x Esforço
          </CardTitle>
          <CardDescription>
            Vamos priorizar suas iniciativas usando a matriz 2x2 de Impacto vs Esforço
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FrameworkInfo framework="MATRIZ" />
          
          {!prioritizationData ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Grid3x3 className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Pronto para priorizar?</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                A IA vai analisar cada iniciativa e classificá-las em 4 quadrantes: 
                Fazer Agora, Planejar, Quick Wins e Evitar.
              </p>
              <Button onClick={handlePrioritize} disabled={loading} size="lg">
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Priorizando...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 w-4 h-4" />
                    Priorizar Iniciativas
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="default">Priorização Completa</Badge>
                <span className="text-sm text-muted-foreground">
                  {prioritizationData.initiatives?.length} iniciativas classificadas
                </span>
              </div>

              <MatrizImpactoEsforco 
                fazer_agora={prioritizationData.fazer_agora || []}
                planejar={prioritizationData.planejar || []}
                oportunidades_rapidas={prioritizationData.oportunidades_rapidas || []}
                evitar={prioritizationData.evitar || []}
              />

              {/* Ranking ICE Score */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Ranking ICE - Ajuste a Confiança
                  </CardTitle>
                  <CardDescription>
                    A IA sugeriu Impact e Ease. Ajuste o Confidence nas páginas de detalhes. Top 3 irão para o WBR.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ICERankingList initiatives={prioritizationData.initiatives || []} />
                </CardContent>
              </Card>

              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Recomendações:</h4>
                <ul className="space-y-2 text-sm">
                  <li>✅ <strong>Fazer Agora:</strong> Alto impacto, baixo esforço - comece por aqui!</li>
                  <li>📅 <strong>Planejar:</strong> Alto impacto, alto esforço - reserve recursos adequados</li>
                  <li>⚡ <strong>Quick Wins:</strong> Baixo impacto, baixo esforço - preencha intervalos</li>
                  <li>⛔ <strong>Evitar:</strong> Baixo impacto, alto esforço - questione a necessidade</li>
                </ul>
              </div>

              <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                <p className="text-sm text-foreground font-medium">
                  ✓ Iniciativas priorizadas! Agora vamos criar o plano de execução 4DX.
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
          {prioritizationData && (
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
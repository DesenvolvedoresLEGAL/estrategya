import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Target, Sparkles, CheckCircle2, Save } from "lucide-react";
import { OKRCard } from "@/components/planning/OKRCard";
import { BSCBalance } from "@/components/planning/BSCBalance";
import { FrameworkInfo } from "./FrameworkInfo";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { UpgradePrompt } from "@/components/subscription/UpgradePrompt";
import { useAnalytics } from "@/hooks/useAnalytics";

interface Props {
  companyData: any;
  ogsmData: any;
  initialData: any;
  onNext: (data: any) => void;
  onBack: () => void;
  onSaveAndExit?: () => Promise<void>;
}

export const EtapaOKRsBSC = ({ companyData, ogsmData, initialData, onNext, onBack, onSaveAndExit }: Props) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'idle' | 'okrs-generated' | 'bsc-validated'>('idle');
  const [okrsData, setOkrsData] = useState<any>(null);
  const [bscData, setBscData] = useState<any>(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  
  const { canCreateObjective, canCreateInitiative } = useSubscriptionLimits(companyData?.id);
  const { trackLimitReached, trackFeatureBlocked } = useAnalytics();

  const handleGenerateOKRs = async () => {
    setLoading(true);

    try {
      // Gerar OKRs a partir dos Goals do OGSM
      const { data: okrData, error: okrError } = await supabase.functions.invoke('ai-okrs', {
        body: {
          company: companyData,
          goals: ogsmData.goals,
        },
      });

      if (okrError) throw okrError;

      setOkrsData(okrData);
      setStep('okrs-generated');
      toast.success("OKRs gerados com sucesso!");
    } catch (error: any) {
      console.error('Error generating OKRs:', error);
      toast.error("Erro ao gerar OKRs: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleValidateBSC = async () => {
    setLoading(true);

    try {
      // Validar cobertura BSC
      const { data: bscCheckData, error: bscError } = await supabase.functions.invoke('ai-bsc-check', {
        body: {
          okrs: okrsData.okrs,
          strategies: ogsmData.goals.flatMap((g: any) => g.strategies || []),
        },
      });

      if (bscError) throw bscError;

      setBscData(bscCheckData);
      setStep('bsc-validated');
      toast.success("Validação BSC concluída!");
    } catch (error: any) {
      console.error('Error validating BSC:', error);
      toast.error("Erro ao validar BSC: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAndNext = async () => {
    setLoading(true);

    try {
      // Verificar limites de objetivos
      const canCreateObj = await canCreateObjective(companyData.id);
      
      if (!canCreateObj) {
        setShowUpgradePrompt(true);
        return;
      }

      // Salvar OKRs como strategic_objectives e initiatives
      for (const okr of okrsData.okrs) {
        const { data: objectiveRecord, error: objectiveError } = await supabase
          .from('strategic_objectives')
          .insert({
            company_id: companyData.id,
            title: okr.objective,
            perspective: okr.perspective || 'Crescimento',
            horizon: '1 ano',
          })
          .select()
          .single();

        if (objectiveError) throw objectiveError;

        // Verificar limite de iniciativas antes de salvar Key Results
        if (okr.key_results && okr.key_results.length > 0) {
          const canCreateInit = await canCreateInitiative(objectiveRecord.id);
          
          if (!canCreateInit) {
            trackLimitReached("initiatives", "free", "initiatives_creation");
            trackFeatureBlocked("unlimited_initiatives", "free", "pro");
            setShowUpgradePrompt(true);
            // Delete the objective we just created since we can't add initiatives
            await supabase.from('strategic_objectives').delete().eq('id', objectiveRecord.id);
            return;
          }

          const initiativesToInsert = okr.key_results.map((kr: any) => ({
            objective_id: objectiveRecord.id,
            title: kr.kr,
            description: `Meta: ${kr.target}`,
            status: 'não iniciada',
          }));

          const { error: initiativesError } = await supabase
            .from('initiatives')
            .insert(initiativesToInsert);

          if (initiativesError) throw initiativesError;
        }
      }

      toast.success("OKRs salvos como objetivos estratégicos!");
      onNext({ okrs: okrsData, bsc: bscData });
    } catch (error: any) {
      console.error('Error saving OKRs:', error);
      toast.error("Erro ao salvar OKRs: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-6 h-6 text-primary" />
            OKRs + Balanced Scorecard
          </CardTitle>
          <CardDescription>
            Transforme seus Goals em OKRs e valide a cobertura das 4 perspectivas do BSC
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <FrameworkInfo framework="OKR" />
            <FrameworkInfo framework="BSC" />
          </div>
          
          {step === 'idle' && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Target className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Vamos criar seus OKRs!</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Cada Goal do OGSM será transformado em um Objective com Key Results mensuráveis.
              </p>
              <Button onClick={handleGenerateOKRs} disabled={loading} size="lg">
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Gerando OKRs...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 w-4 h-4" />
                    Gerar OKRs
                  </>
                )}
              </Button>
            </div>
          )}

          {step === 'okrs-generated' && okrsData && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="default">OKRs Gerados</Badge>
                <span className="text-sm text-muted-foreground">
                  {okrsData.okrs.length} OKRs criados
                </span>
              </div>

              <div className="space-y-4">
                {okrsData.okrs.map((okr: any, index: number) => (
                  <OKRCard 
                    key={index} 
                    okr={okr} 
                    goalTitle={ogsmData.goals[index]?.title}
                  />
                ))}
              </div>

              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center">
                <p className="text-sm font-medium mb-4">
                  Agora vamos validar se seus OKRs cobrem as 4 perspectivas do Balanced Scorecard
                </p>
                <Button onClick={handleValidateBSC} disabled={loading}>
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                      Validando BSC...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 w-4 h-4" />
                      Validar com BSC
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {step === 'bsc-validated' && bscData && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="default">Validação BSC Completa</Badge>
              </div>

              <BSCBalance bsc={bscData} />

              <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                <p className="text-sm text-foreground font-medium">
                  ✓ OKRs criados e validados com BSC! Próximo: Priorização de iniciativas.
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
          {step === 'bsc-validated' && (
            <Button onClick={handleSaveAndNext} disabled={loading} size="lg">
              {loading ? "Salvando..." : "Próximo"}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
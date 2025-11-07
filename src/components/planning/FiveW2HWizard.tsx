import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Sparkles, 
  Save, 
  Loader2, 
  ChevronRight, 
  ChevronLeft,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Calculator
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FiveW2HWizardProps {
  initiativeId: string;
  initiativeTitle: string;
  initiativeDescription?: string;
  objectiveTitle?: string;
  companyData?: any;
  initialData?: {
    what?: string;
    why?: string;
    who?: string;
    when_deadline?: string;
    where_location?: string;
    how?: string;
    how_much?: number;
  };
  onSave?: () => void;
}

const STEPS = [
  { id: 1, title: "What & Why", description: "O que e Por que", fields: ["what", "why"] },
  { id: 2, title: "Who & When", description: "Quem e Quando", fields: ["who", "when_deadline"] },
  { id: 3, title: "Where & How", description: "Onde e Como", fields: ["where_location", "how"] },
  { id: 4, title: "How Much", description: "Investimento", fields: ["how_much"] },
];

const SUGGESTED_ROLES = [
  "CEO / Diretor Geral",
  "Gerente de Marketing",
  "Gerente de Vendas",
  "Gerente de Operações",
  "Gerente de TI",
  "Coordenador de Projetos",
  "Analista de Marketing",
  "Analista de Dados",
  "Equipe de Desenvolvimento",
  "Equipe Comercial",
  "Equipe de Atendimento",
  "Consultor Externo",
];

export const FiveW2HWizard = ({
  initiativeId,
  initiativeTitle,
  initiativeDescription,
  objectiveTitle,
  companyData,
  initialData,
  onSave,
}: FiveW2HWizardProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [estimatingBudget, setEstimatingBudget] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [what, setWhat] = useState(initialData?.what || "");
  const [why, setWhy] = useState(initialData?.why || "");
  const [who, setWho] = useState(initialData?.who || "");
  const [whenDeadline, setWhenDeadline] = useState(initialData?.when_deadline || "");
  const [whereLocation, setWhereLocation] = useState(initialData?.where_location || "");
  const [how, setHow] = useState(initialData?.how || "");
  const [howMuch, setHowMuch] = useState(initialData?.how_much?.toString() || "");

  const calculateProgress = () => {
    const fields = { what, why, who, when_deadline: whenDeadline, where_location: whereLocation, how, how_much: howMuch };
    const filled = Object.values(fields).filter(v => v && v.toString().trim()).length;
    return Math.round((filled / 7) * 100);
  };

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};
    const stepData = STEPS[step - 1];
    
    stepData.fields.forEach(field => {
      const value = { what, why, who, when_deadline: whenDeadline, where_location: whereLocation, how, how_much: howMuch }[field];
      if (!value || value.toString().trim() === "") {
        newErrors[field] = "Este campo é obrigatório";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    } else {
      toast.error("Preencha todos os campos obrigatórios antes de continuar");
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setErrors({});
  };

  const handleGenerateWithAI = async () => {
    setAiGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-5w2h', {
        body: {
          initiative: {
            title: initiativeTitle,
            description: initiativeDescription,
          },
          objective: { title: objectiveTitle },
          company: companyData,
        }
      });

      if (error) throw error;

      setWhat(data.what || "");
      setWhy(data.why || "");
      setWho(data.who || "");
      
      if (data.when && typeof data.when === 'number') {
        const suggestedDate = new Date();
        suggestedDate.setDate(suggestedDate.getDate() + data.when);
        setWhenDeadline(suggestedDate.toISOString().split('T')[0]);
      }
      
      setWhereLocation(data.where || "");
      setHow(data.how || "");
      setHowMuch(data.how_much?.toString() || "");

      toast.success("5W2H gerado com IA! Revise e ajuste se necessário.");
    } catch (error: any) {
      console.error('Erro ao gerar 5W2H:', error);
      toast.error(error.message || 'Erro ao gerar 5W2H com IA');
    } finally {
      setAiGenerating(false);
    }
  };

  const estimateBudget = async () => {
    setEstimatingBudget(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-5w2h', {
        body: {
          initiative: {
            title: initiativeTitle,
            description: initiativeDescription,
            what,
            how,
          },
          objective: { title: objectiveTitle },
          company: companyData,
          estimate_budget_only: true,
        }
      });

      if (error) throw error;
      
      if (data.how_much) {
        setHowMuch(data.how_much.toString());
        toast.success("Budget estimado com base na complexidade da iniciativa!");
      }
    } catch (error: any) {
      console.error('Erro ao estimar budget:', error);
      toast.error('Erro ao estimar budget');
    } finally {
      setEstimatingBudget(false);
    }
  };

  const handleSave = async () => {
    // Validar todos os campos antes de salvar
    let allValid = true;
    for (let i = 1; i <= STEPS.length; i++) {
      if (!validateStep(i)) {
        allValid = false;
        setCurrentStep(i);
        break;
      }
    }

    if (!allValid) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('initiatives')
        .update({
          what,
          why,
          who,
          when_deadline: whenDeadline || null,
          where_location: whereLocation,
          how,
          how_much: howMuch ? parseFloat(howMuch) : null,
        })
        .eq('id', initiativeId);

      if (error) throw error;

      toast.success("5W2H salvo com sucesso!");
      onSave?.();
    } catch (error: any) {
      console.error('Erro ao salvar 5W2H:', error);
      toast.error('Erro ao salvar 5W2H');
    } finally {
      setLoading(false);
    }
  };

  const progress = calculateProgress();
  const isComplete = progress === 100;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle>5W2H - Plano de Ação (Wizard)</CardTitle>
            <CardDescription>
              Passo {currentStep} de {STEPS.length}: {STEPS[currentStep - 1].description}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateWithAI}
            disabled={aiGenerating}
          >
            {aiGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Preencher com IA
              </>
            )}
          </Button>
        </div>
        
        {/* Progress Bar */}
        <div className="space-y-2 pt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progresso de preenchimento</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Step 1: What & Why */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="what" className="text-base font-semibold">
                What (O que será feito?) *
              </Label>
              <Textarea
                id="what"
                value={what}
                onChange={(e) => {
                  setWhat(e.target.value);
                  setErrors(prev => ({ ...prev, what: "" }));
                }}
                placeholder="Descreva claramente o que será executado..."
                className={`min-h-[100px] ${errors.what ? "border-destructive" : ""}`}
              />
              {errors.what && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.what}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="why" className="text-base font-semibold">
                Why (Por que é importante?) *
              </Label>
              <Textarea
                id="why"
                value={why}
                onChange={(e) => {
                  setWhy(e.target.value);
                  setErrors(prev => ({ ...prev, why: "" }));
                }}
                placeholder="Explique o vínculo estratégico e o impacto esperado..."
                className={`min-h-[100px] ${errors.why ? "border-destructive" : ""}`}
              />
              {errors.why && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.why}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Who & When */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="who" className="text-base font-semibold">
                Who (Quem é o responsável?) *
              </Label>
              <Select value={who} onValueChange={(value) => {
                setWho(value);
                setErrors(prev => ({ ...prev, who: "" }));
              }}>
                <SelectTrigger className={errors.who ? "border-destructive" : ""}>
                  <SelectValue placeholder="Selecione ou digite um responsável" />
                </SelectTrigger>
                <SelectContent>
                  {SUGGESTED_ROLES.map(role => (
                    <SelectItem key={role} value={role}>{role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                id="who-custom"
                value={who && !SUGGESTED_ROLES.includes(who) ? who : ""}
                onChange={(e) => {
                  setWho(e.target.value);
                  setErrors(prev => ({ ...prev, who: "" }));
                }}
                placeholder="Ou digite um responsável personalizado..."
                className={errors.who ? "border-destructive" : ""}
              />
              {errors.who && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.who}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="when" className="text-base font-semibold">
                When (Quando? Prazo) *
              </Label>
              <Input
                id="when"
                type="date"
                value={whenDeadline}
                onChange={(e) => {
                  setWhenDeadline(e.target.value);
                  setErrors(prev => ({ ...prev, when_deadline: "" }));
                }}
                className={errors.when_deadline ? "border-destructive" : ""}
              />
              {errors.when_deadline && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.when_deadline}
                </p>
              )}
              
              {whenDeadline && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Prazo definido: {new Date(whenDeadline).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Where & How */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="where" className="text-base font-semibold">
                Where (Onde será executado?) *
              </Label>
              <Input
                id="where"
                value={whereLocation}
                onChange={(e) => {
                  setWhereLocation(e.target.value);
                  setErrors(prev => ({ ...prev, where_location: "" }));
                }}
                placeholder="Ex: Online - Redes Sociais, Presencial - Loja..."
                className={errors.where_location ? "border-destructive" : ""}
              />
              {errors.where_location && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.where_location}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="how" className="text-base font-semibold">
                How (Como será executado?) *
              </Label>
              <Textarea
                id="how"
                value={how}
                onChange={(e) => {
                  setHow(e.target.value);
                  setErrors(prev => ({ ...prev, how: "" }));
                }}
                placeholder="Descreva os principais passos de execução..."
                className={`min-h-[150px] ${errors.how ? "border-destructive" : ""}`}
              />
              {errors.how && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.how}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Step 4: How Much */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="howMuch" className="text-base font-semibold">
                  How Much (Quanto custará?) *
                </Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={estimateBudget}
                  disabled={estimatingBudget || !what || !how}
                >
                  {estimatingBudget ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Estimando...
                    </>
                  ) : (
                    <>
                      <Calculator className="h-4 w-4 mr-2" />
                      Estimar com IA
                    </>
                  )}
                </Button>
              </div>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="howMuch"
                  type="number"
                  value={howMuch}
                  onChange={(e) => {
                    setHowMuch(e.target.value);
                    setErrors(prev => ({ ...prev, how_much: "" }));
                  }}
                  placeholder="Estimativa de investimento em R$"
                  className={`pl-9 ${errors.how_much ? "border-destructive" : ""}`}
                  min="0"
                  step="0.01"
                />
              </div>
              {errors.how_much && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.how_much}
                </p>
              )}
              
              {howMuch && parseFloat(howMuch) > 0 && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Budget estimado: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(howMuch))}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {isComplete && (
              <Alert className="bg-success/10 border-success">
                <CheckCircle className="h-4 w-4 text-success" />
                <AlertDescription className="text-success">
                  5W2H 100% completo! Pronto para salvar.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1 || loading}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>

          {currentStep < STEPS.length ? (
            <Button onClick={handleNext}>
              Próximo
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={loading || !isComplete}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar 5W2H
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
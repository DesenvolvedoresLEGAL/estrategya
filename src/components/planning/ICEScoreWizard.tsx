import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, ThumbsUp, Zap, ArrowRight, ArrowLeft, CheckCircle2, Lock } from "lucide-react";
import { toast } from "sonner";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { UpgradePrompt } from "@/components/subscription/UpgradePrompt";

interface ICEScoreWizardProps {
  initiativeTitle: string;
  initiativeDescription?: string;
  companyId?: string;
  onComplete: (scores: { impact: number; confidence: number; ease: number; iceScore: number }) => void;
  onCancel: () => void;
}

type WizardStep = 'impact' | 'confidence' | 'ease' | 'result';

interface Question {
  id: string;
  question: string;
  options: { label: string; value: number; description: string }[];
}

const impactQuestions: Question[] = [
  {
    id: 'strategic_alignment',
    question: 'Qual o alinhamento desta iniciativa com os objetivos estratégicos da empresa?',
    options: [
      { label: 'Baixo', value: 2, description: 'Pouca relação com objetivos estratégicos' },
      { label: 'Médio', value: 5, description: 'Contribui parcialmente para objetivos estratégicos' },
      { label: 'Alto', value: 8, description: 'Diretamente alinhado com objetivos críticos' },
      { label: 'Crítico', value: 10, description: 'Essencial para atingir objetivos principais' },
    ]
  },
  {
    id: 'customer_impact',
    question: 'Qual o impacto esperado nos clientes/usuários?',
    options: [
      { label: 'Mínimo', value: 2, description: 'Afeta poucos clientes ou processos internos' },
      { label: 'Moderado', value: 5, description: 'Melhora experiência de segmento importante' },
      { label: 'Significativo', value: 8, description: 'Impacto direto na satisfação geral' },
      { label: 'Transformador', value: 10, description: 'Mudança fundamental na proposta de valor' },
    ]
  },
  {
    id: 'revenue_impact',
    question: 'Qual o potencial impacto no faturamento/resultados financeiros?',
    options: [
      { label: 'Indireto', value: 2, description: 'Impacto não mensurável diretamente' },
      { label: 'Pequeno', value: 5, description: 'Incremento de até 5% em métricas-chave' },
      { label: 'Médio', value: 8, description: 'Incremento de 5-15% em receita/eficiência' },
      { label: 'Alto', value: 10, description: 'Incremento superior a 15% ou novos fluxos de receita' },
    ]
  },
];

const confidenceQuestions: Question[] = [
  {
    id: 'data_available',
    question: 'Qual o nível de dados/informações disponíveis para embasar esta iniciativa?',
    options: [
      { label: 'Baixo', value: 2, description: 'Suposições, sem dados concretos' },
      { label: 'Médio', value: 5, description: 'Alguns dados, mas incompletos' },
      { label: 'Bom', value: 8, description: 'Dados suficientes de fontes confiáveis' },
      { label: 'Excelente', value: 10, description: 'Dados robustos, benchmarks, cases de sucesso' },
    ]
  },
  {
    id: 'team_capability',
    question: 'A equipe tem as competências necessárias para executar?',
    options: [
      { label: 'Precisa contratar', value: 2, description: 'Competências críticas não disponíveis' },
      { label: 'Parcialmente', value: 5, description: 'Precisa treinamento ou consultoria' },
      { label: 'Sim', value: 8, description: 'Equipe capaz com suporte limitado' },
      { label: 'Totalmente', value: 10, description: 'Equipe experiente e autossuficiente' },
    ]
  },
  {
    id: 'proven_approach',
    question: 'Esta abordagem já foi validada ou testada?',
    options: [
      { label: 'Não', value: 2, description: 'Inovação sem precedentes' },
      { label: 'MVP/Piloto', value: 5, description: 'Teste inicial com resultados promissores' },
      { label: 'Parcialmente', value: 8, description: 'Similar executado com sucesso em outra área' },
      { label: 'Sim', value: 10, description: 'Abordagem comprovada no mercado/empresa' },
    ]
  },
];

const easeQuestions: Question[] = [
  {
    id: 'technical_complexity',
    question: 'Qual a complexidade técnica/operacional?',
    options: [
      { label: 'Muito alta', value: 2, description: 'Múltiplas integrações, tecnologia nova' },
      { label: 'Alta', value: 5, description: 'Algumas dependências técnicas complexas' },
      { label: 'Média', value: 8, description: 'Conhecida, com desafios gerenciáveis' },
      { label: 'Baixa', value: 10, description: 'Tecnologia/processo simples e conhecido' },
    ]
  },
  {
    id: 'dependencies',
    question: 'Quantas dependências externas (outras equipes, fornecedores, aprovações)?',
    options: [
      { label: 'Muitas', value: 2, description: 'Mais de 5 dependências críticas' },
      { label: 'Várias', value: 5, description: '3-5 dependências importantes' },
      { label: 'Poucas', value: 8, description: '1-2 dependências gerenciáveis' },
      { label: 'Nenhuma', value: 10, description: 'Execução autônoma' },
    ]
  },
  {
    id: 'time_to_implement',
    question: 'Qual o tempo estimado para implementação completa?',
    options: [
      { label: 'Mais de 6 meses', value: 2, description: 'Projeto de longo prazo' },
      { label: '3-6 meses', value: 5, description: 'Projeto de médio prazo' },
      { label: '1-3 meses', value: 8, description: 'Quick win estratégico' },
      { label: 'Menos de 1 mês', value: 10, description: 'Implementação rápida' },
    ]
  },
];

export const ICEScoreWizard = ({
  initiativeTitle,
  initiativeDescription,
  companyId,
  onComplete,
  onCancel,
}: ICEScoreWizardProps) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>('impact');
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  
  const { hasFeature } = useSubscriptionLimits(companyId);

  const getCurrentQuestions = () => {
    switch (currentStep) {
      case 'impact': return impactQuestions;
      case 'confidence': return confidenceQuestions;
      case 'ease': return easeQuestions;
      default: return [];
    }
  };

  const getStepIcon = (step: WizardStep) => {
    switch (step) {
      case 'impact': return TrendingUp;
      case 'confidence': return ThumbsUp;
      case 'ease': return Zap;
      default: return Sparkles;
    }
  };

  const getStepTitle = (step: WizardStep) => {
    switch (step) {
      case 'impact': return 'Impact (Impacto)';
      case 'confidence': return 'Confidence (Confiança)';
      case 'ease': return 'Ease (Facilidade)';
      case 'result': return 'Resultado';
      default: return '';
    }
  };

  const getStepDescription = (step: WizardStep) => {
    switch (step) {
      case 'impact': return 'Avalie o impacto potencial da iniciativa';
      case 'confidence': return 'Avalie sua confiança na execução';
      case 'ease': return 'Avalie a facilidade de implementação';
      case 'result': return 'Resumo da análise ICE';
      default: return '';
    }
  };

  const calculateScore = (questionIds: string[]) => {
    const scores = questionIds.map(id => answers[id] || 0);
    const average = scores.reduce((a, b) => a + b, 0) / scores.length;
    return Math.round(average);
  };

  const handleAnswerChange = (questionId: string, value: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const canProceed = () => {
    const currentQuestions = getCurrentQuestions();
    return currentQuestions.every(q => answers[q.id] !== undefined);
  };

  const handleNext = () => {
    if (!canProceed()) {
      toast.error('Por favor, responda todas as perguntas');
      return;
    }

    if (currentStep === 'impact') {
      setCurrentStep('confidence');
    } else if (currentStep === 'confidence') {
      setCurrentStep('ease');
    } else if (currentStep === 'ease') {
      setCurrentStep('result');
    } else if (currentStep === 'result') {
      const impact = calculateScore(impactQuestions.map(q => q.id));
      const confidence = calculateScore(confidenceQuestions.map(q => q.id));
      const ease = calculateScore(easeQuestions.map(q => q.id));
      const iceScore = impact * confidence * ease;
      
      onComplete({ impact, confidence, ease, iceScore });
    }
  };

  const handleBack = () => {
    if (currentStep === 'confidence') {
      setCurrentStep('impact');
    } else if (currentStep === 'ease') {
      setCurrentStep('confidence');
    } else if (currentStep === 'result') {
      setCurrentStep('ease');
    }
  };

  const getProgress = () => {
    const steps = ['impact', 'confidence', 'ease', 'result'];
    const currentIndex = steps.indexOf(currentStep);
    return ((currentIndex + 1) / steps.length) * 100;
  };

  const StepIcon = getStepIcon(currentStep);
  const hasICEFeature = hasFeature('ice_score');

  if (!hasICEFeature) {
    return (
      <>
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                <CardTitle>ICE Score Wizard - Recurso PRO</CardTitle>
              </div>
              <Badge className="bg-primary text-primary-foreground">PRO</Badge>
            </div>
            <CardDescription>
              Questionário guiado para calcular ICE Score de forma precisa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              O ICE Score Wizard oferece um processo estruturado de 9 perguntas divididas em 3 etapas para avaliar suas iniciativas:
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-card border rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm mb-1">Impact (3 perguntas)</h4>
                  <p className="text-xs text-muted-foreground">Alinhamento estratégico, impacto em clientes e resultados financeiros</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-card border rounded-lg">
                <ThumbsUp className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm mb-1">Confidence (3 perguntas)</h4>
                  <p className="text-xs text-muted-foreground">Dados disponíveis, capacidade da equipe e validação da abordagem</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-card border rounded-lg">
                <Zap className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm mb-1">Ease (3 perguntas)</h4>
                  <p className="text-xs text-muted-foreground">Complexidade técnica, dependências e tempo de implementação</p>
                </div>
              </div>
            </div>
            <Button 
              onClick={() => setShowUpgradePrompt(true)} 
              className="w-full" 
              size="lg"
            >
              Fazer Upgrade para PRO
            </Button>
          </CardContent>
        </Card>
        
        <UpgradePrompt
          open={showUpgradePrompt}
          onOpenChange={setShowUpgradePrompt}
          feature="ICE Score Wizard"
        />
      </>
    );
  }

  // Result view
  if (currentStep === 'result') {
    const impact = calculateScore(impactQuestions.map(q => q.id));
    const confidence = calculateScore(confidenceQuestions.map(q => q.id));
    const ease = calculateScore(easeQuestions.map(q => q.id));
    const iceScore = impact * confidence * ease;

    const getScoreColor = (score: number) => {
      if (score >= 700) return "text-green-600 dark:text-green-400";
      if (score >= 400) return "text-yellow-600 dark:text-yellow-400";
      return "text-orange-600 dark:text-orange-400";
    };

    const getScoreBadge = (score: number) => {
      if (score >= 700) return { variant: "default" as const, label: "Alta Prioridade" };
      if (score >= 400) return { variant: "secondary" as const, label: "Média Prioridade" };
      return { variant: "outline" as const, label: "Baixa Prioridade" };
    };

    const scoreBadge = getScoreBadge(iceScore);

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <CardTitle>Resultado ICE Score</CardTitle>
            </div>
            <Badge variant={scoreBadge.variant}>{scoreBadge.label}</Badge>
          </div>
          <CardDescription>{initiativeTitle}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center py-6 bg-muted/50 rounded-lg">
            <div className={`text-5xl font-bold ${getScoreColor(iceScore)}`}>
              {iceScore}
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              Score ICE Total (máximo 1000)
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg border bg-card">
              <TrendingUp className="h-6 w-6 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {impact}
              </div>
              <div className="text-xs text-muted-foreground">Impact</div>
            </div>
            <div className="text-center p-4 rounded-lg border bg-card">
              <ThumbsUp className="h-6 w-6 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {confidence}
              </div>
              <div className="text-xs text-muted-foreground">Confidence</div>
            </div>
            <div className="text-center p-4 rounded-lg border bg-card">
              <Zap className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {ease}
              </div>
              <div className="text-xs text-muted-foreground">Ease</div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleBack} className="flex-1">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <Button onClick={handleNext} className="flex-1">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Confirmar e Salvar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Questions view
  const currentQuestions = getCurrentQuestions();

  return (
    <Card>
      <CardHeader>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StepIcon className="h-5 w-5 text-primary" />
              <CardTitle>{getStepTitle(currentStep)}</CardTitle>
            </div>
            <Badge variant="outline">
              Etapa {['impact', 'confidence', 'ease'].indexOf(currentStep) + 1} de 3
            </Badge>
          </div>
          <CardDescription>{getStepDescription(currentStep)}</CardDescription>
          <div>
            <Progress value={getProgress()} className="h-2" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-3 bg-muted/50 rounded-lg">
          <h4 className="font-medium text-sm mb-1">{initiativeTitle}</h4>
          {initiativeDescription && (
            <p className="text-xs text-muted-foreground">{initiativeDescription}</p>
          )}
        </div>

        {currentQuestions.map((question, index) => (
          <div key={question.id} className="space-y-3 p-4 border rounded-lg bg-card">
            <div className="flex items-start gap-2">
              <Badge variant="secondary" className="mt-1">{index + 1}</Badge>
              <div className="flex-1">
                <h4 className="font-medium text-sm mb-3">{question.question}</h4>
                <RadioGroup
                  value={answers[question.id]?.toString()}
                  onValueChange={(value) => handleAnswerChange(question.id, parseInt(value))}
                >
                  <div className="space-y-2">
                    {question.options.map((option) => (
                      <div
                        key={option.value}
                        className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                        onClick={() => handleAnswerChange(question.id, option.value)}
                      >
                        <RadioGroupItem value={option.value.toString()} id={`${question.id}-${option.value}`} />
                        <div className="flex-1">
                          <Label
                            htmlFor={`${question.id}-${option.value}`}
                            className="cursor-pointer font-medium"
                          >
                            {option.label}
                          </Label>
                          <p className="text-xs text-muted-foreground mt-1">
                            {option.description}
                          </p>
                        </div>
                        <Badge variant="outline" className="ml-auto">
                          {option.value}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>
        ))}

        <div className="flex gap-2">
          {currentStep !== 'impact' && (
            <Button variant="outline" onClick={handleBack} className="flex-1">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          )}
          {currentStep === 'impact' && (
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Cancelar
            </Button>
          )}
          <Button onClick={handleNext} disabled={!canProceed()} className="flex-1">
            {currentStep === 'ease' ? 'Ver Resultado' : 'Próximo'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

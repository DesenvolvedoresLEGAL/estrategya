import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, ThumbsUp, Zap, Lock } from "lucide-react";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { UpgradePrompt } from "@/components/subscription/UpgradePrompt";
import { useAnalytics } from "@/hooks/useAnalytics";

interface ICEScoreFormProps {
  initiativeId: string;
  companyId?: string;
  initialImpact?: number;
  initialConfidence?: number;
  initialEase?: number;
  onScoresChange: (scores: { impact: number; confidence: number; ease: number; iceScore: number }) => void;
}

export const ICEScoreForm = ({
  initiativeId,
  companyId,
  initialImpact = 5,
  initialConfidence = 5,
  initialEase = 5,
  onScoresChange,
}: ICEScoreFormProps) => {
  const [impact, setImpact] = useState(initialImpact);
  const [confidence, setConfidence] = useState(initialConfidence);
  const [ease, setEase] = useState(initialEase);
  const [iceScore, setIceScore] = useState(0);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  
  const { hasFeature } = useSubscriptionLimits(companyId);

  useEffect(() => {
    const newIceScore = impact * confidence * ease;
    setIceScore(newIceScore);
    onScoresChange({ impact, confidence, ease, iceScore: newIceScore });
  }, [impact, confidence, ease]);

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
  const hasICEFeature = hasFeature('ice_score');
  const { trackFeatureBlocked } = useAnalytics();

  if (!hasICEFeature) {
    trackFeatureBlocked('ice_score', 'free', 'pro');
    return (
      <>
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 relative overflow-hidden">
          <div className="absolute top-4 right-4">
            <Badge className="bg-primary text-primary-foreground">PRO</Badge>
          </div>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              <CardTitle>ICE Score - Recurso PRO</CardTitle>
            </div>
            <CardDescription>
              Priorize iniciativas com critérios quantitativos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              O método ICE Score permite avaliar iniciativas através de 3 dimensões:
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                <span><strong>Impact:</strong> Qual o impacto no objetivo estratégico?</span>
              </li>
              <li className="flex items-center gap-2">
                <ThumbsUp className="h-4 w-4 text-green-500" />
                <span><strong>Confidence:</strong> Quão confiante você está na estimativa?</span>
              </li>
              <li className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span><strong>Ease:</strong> Quão fácil é implementar?</span>
              </li>
            </ul>
            <Button 
              onClick={() => setShowUpgradePrompt(true)} 
              className="w-full" 
              size="lg"
            >
              Fazer Upgrade para Desbloquear
            </Button>
          </CardContent>
        </Card>
        
        <UpgradePrompt
          open={showUpgradePrompt}
          onOpenChange={setShowUpgradePrompt}
          feature="ICE Score"
        />
      </>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>ICE Score</CardTitle>
          </div>
          <Badge variant={scoreBadge.variant}>{scoreBadge.label}</Badge>
        </div>
        <CardDescription>
          Ajuste os valores para calcular a prioridade (máximo: 1000)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Score Display */}
        <div className="text-center py-4 bg-muted/50 rounded-lg">
          <div className={`text-4xl font-bold ${getScoreColor(iceScore)}`}>
            {iceScore}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            de 1000 pontos
          </div>
          <div className="w-full bg-secondary rounded-full h-2 mt-3">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(iceScore / 1000) * 100}%` }}
            />
          </div>
        </div>

        {/* Impact Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <label className="text-sm font-medium">
                Impact (Impacto)
              </label>
            </div>
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
              {impact}/10
            </span>
          </div>
          <Slider
            value={[impact]}
            onValueChange={(value) => setImpact(value[0])}
            min={1}
            max={10}
            step={1}
            className="[&_[role=slider]]:bg-blue-500"
          />
          <p className="text-xs text-muted-foreground">
            Qual o impacto desta iniciativa no objetivo estratégico?
          </p>
        </div>

        {/* Confidence Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ThumbsUp className="h-4 w-4 text-green-500" />
              <label className="text-sm font-medium">
                Confidence (Confiança)
              </label>
            </div>
            <span className="text-sm font-bold text-green-600 dark:text-green-400">
              {confidence}/10
            </span>
          </div>
          <Slider
            value={[confidence]}
            onValueChange={(value) => setConfidence(value[0])}
            min={1}
            max={10}
            step={1}
            className="[&_[role=slider]]:bg-green-500"
          />
          <p className="text-xs text-muted-foreground">
            O quanto você acredita nesta estimativa e na viabilidade?
          </p>
        </div>

        {/* Ease Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              <label className="text-sm font-medium">
                Ease (Facilidade)
              </label>
            </div>
            <span className="text-sm font-bold text-yellow-600 dark:text-yellow-400">
              {ease}/10
            </span>
          </div>
          <Slider
            value={[ease]}
            onValueChange={(value) => setEase(value[0])}
            min={1}
            max={10}
            step={1}
            className="[&_[role=slider]]:bg-yellow-500"
          />
          <p className="text-xs text-muted-foreground">
            Quão fácil/rápido é implementar? (oposto de esforço)
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

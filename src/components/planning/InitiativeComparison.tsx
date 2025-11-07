import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeftRight, TrendingUp, ThumbsUp, Zap, Target, X } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Initiative {
  id: string;
  title: string;
  description?: string;
  impact_score?: number;
  confidence_score?: number;
  ease_score?: number;
  ice_score?: number;
  priority_quadrant?: string;
  status?: string;
  objective_id: string;
  strategic_objectives?: {
    title: string;
    perspective?: string;
  };
}

interface InitiativeComparisonProps {
  companyId: string;
  preselectedId?: string;
}

export const InitiativeComparison = ({ companyId, preselectedId }: InitiativeComparisonProps) => {
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [leftInitiative, setLeftInitiative] = useState<Initiative | null>(null);
  const [rightInitiative, setRightInitiative] = useState<Initiative | null>(null);
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    loadInitiatives();
  }, [companyId]);

  const loadInitiatives = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('initiatives')
        .select(`
          *,
          strategic_objectives (
            title,
            perspective,
            company_id
          )
        `)
        .eq('strategic_objectives.company_id', companyId)
        .not('ice_score', 'is', null)
        .order('ice_score', { ascending: false });

      if (error) throw error;

      setInitiatives(data || []);

      // Se há um ID pré-selecionado, define como iniciativa da esquerda
      if (preselectedId) {
        const preselected = data?.find((i: Initiative) => i.id === preselectedId);
        if (preselected) {
          setLeftInitiative(preselected);
        }
      }
    } catch (error: any) {
      console.error('Erro ao carregar iniciativas:', error);
      toast.error('Erro ao carregar iniciativas');
    } finally {
      setLoading(false);
    }
  };

  const generateSuggestions = () => {
    if (!leftInitiative || !rightInitiative) {
      setSuggestions([]);
      return;
    }

    const newSuggestions: string[] = [];

    // Comparar ICE Scores
    const iceDiff = Math.abs((leftInitiative.ice_score || 0) - (rightInitiative.ice_score || 0));
    if (iceDiff > 200) {
      if ((leftInitiative.ice_score || 0) > (rightInitiative.ice_score || 0)) {
        newSuggestions.push(`"${leftInitiative.title}" tem prioridade significativamente maior. Considere executá-la primeiro.`);
      } else {
        newSuggestions.push(`"${rightInitiative.title}" tem prioridade significativamente maior. Considere executá-la primeiro.`);
      }
    }

    // Comparar componentes individuais
    const leftImpact = leftInitiative.impact_score || 0;
    const rightImpact = rightInitiative.impact_score || 0;
    const leftConfidence = leftInitiative.confidence_score || 0;
    const rightConfidence = rightInitiative.confidence_score || 0;
    const leftEase = leftInitiative.ease_score || 0;
    const rightEase = rightInitiative.ease_score || 0;

    if (leftImpact > rightImpact && leftEase < rightEase) {
      newSuggestions.push(`"${leftInitiative.title}" tem maior impacto, mas "${rightInitiative.title}" é mais fácil de implementar. Considere quick wins primeiro.`);
    }

    if (leftConfidence < 5 || rightConfidence < 5) {
      const lowConfidence = leftConfidence < rightConfidence ? leftInitiative.title : rightInitiative.title;
      newSuggestions.push(`A confiança em "${lowConfidence}" é baixa. Considere validar premissas ou fazer um piloto antes da implementação completa.`);
    }

    // Comparar perspectivas BSC
    if (leftInitiative.strategic_objectives?.perspective === rightInitiative.strategic_objectives?.perspective) {
      newSuggestions.push('Ambas iniciativas estão na mesma perspectiva BSC. Avalie se há sinergia ou sobreposição de esforços.');
    }

    // Avaliar balanceamento
    if ((leftImpact >= 8 && leftEase <= 4) || (rightImpact >= 8 && rightEase <= 4)) {
      newSuggestions.push('Há iniciativas de alto impacto mas complexas. Considere dividir em fases menores para ganhos incrementais.');
    }

    setSuggestions(newSuggestions);
  };

  useEffect(() => {
    generateSuggestions();
  }, [leftInitiative, rightInitiative]);

  const getScoreColor = (score?: number) => {
    if (!score) return "text-muted-foreground";
    if (score >= 8) return "text-green-600 dark:text-green-400";
    if (score >= 5) return "text-yellow-600 dark:text-yellow-400";
    return "text-orange-600 dark:text-orange-400";
  };

  const getICEScoreColor = (score?: number) => {
    if (!score) return "text-muted-foreground";
    if (score >= 700) return "text-green-600 dark:text-green-400";
    if (score >= 400) return "text-yellow-600 dark:text-yellow-400";
    return "text-orange-600 dark:text-orange-400";
  };

  const perspectiveColors: Record<string, string> = {
    financeira: "bg-green-500/10 text-green-700 dark:text-green-400",
    clientes: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    processos: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
    aprendizado: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  };

  const renderInitiativeCard = (initiative: Initiative | null, side: 'left' | 'right') => {
    const selectValue = side === 'left' ? leftInitiative?.id : rightInitiative?.id;
    const onSelectChange = (value: string) => {
      const selected = initiatives.find(i => i.id === value);
      if (side === 'left') {
        setLeftInitiative(selected || null);
      } else {
        setRightInitiative(selected || null);
      }
    };

    const onClear = () => {
      if (side === 'left') {
        setLeftInitiative(null);
      } else {
        setRightInitiative(null);
      }
    };

    return (
      <div className="flex-1 space-y-4">
        <div className="flex gap-2">
          <Select value={selectValue} onValueChange={onSelectChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma iniciativa" />
            </SelectTrigger>
            <SelectContent>
              {initiatives
                .filter(i => i.id !== (side === 'left' ? rightInitiative?.id : leftInitiative?.id))
                .map((init) => (
                  <SelectItem key={init.id} value={init.id}>
                    {init.title} (ICE: {init.ice_score})
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          {initiative && (
            <Button variant="ghost" size="icon" onClick={onClear}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {initiative ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{initiative.title}</CardTitle>
              {initiative.description && (
                <CardDescription>{initiative.description}</CardDescription>
              )}
              <div className="flex gap-2 flex-wrap pt-2">
                {initiative.strategic_objectives && (
                  <Badge
                    variant="secondary"
                    className={
                      initiative.strategic_objectives.perspective
                        ? perspectiveColors[initiative.strategic_objectives.perspective.toLowerCase()]
                        : ""
                    }
                  >
                    {initiative.strategic_objectives.title}
                  </Badge>
                )}
                {initiative.status && (
                  <Badge variant="outline">{initiative.status}</Badge>
                )}
                {initiative.priority_quadrant && (
                  <Badge>{initiative.priority_quadrant}</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-4 bg-muted/50 rounded-lg">
                <div className={`text-3xl font-bold ${getICEScoreColor(initiative.ice_score)}`}>
                  {initiative.ice_score || 0}
                </div>
                <div className="text-xs text-muted-foreground mt-1">ICE Score Total</div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Impact</span>
                  </div>
                  <span className={`text-lg font-bold ${getScoreColor(initiative.impact_score)}`}>
                    {initiative.impact_score || 0}/10
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                  <div className="flex items-center gap-2">
                    <ThumbsUp className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Confidence</span>
                  </div>
                  <span className={`text-lg font-bold ${getScoreColor(initiative.confidence_score)}`}>
                    {initiative.confidence_score || 0}/10
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium">Ease</span>
                  </div>
                  <span className={`text-lg font-bold ${getScoreColor(initiative.ease_score)}`}>
                    {initiative.ease_score || 0}/10
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="h-[400px] flex items-center justify-center">
            <CardContent className="text-center text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Selecione uma iniciativa para comparar</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Carregando iniciativas...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-primary" />
            <CardTitle>Comparação de Iniciativas</CardTitle>
          </div>
          <CardDescription>
            Compare duas iniciativas lado a lado para decidir prioridades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            {renderInitiativeCard(leftInitiative, 'left')}
            <div className="flex items-center justify-center px-2">
              <ArrowLeftRight className="h-6 w-6 text-muted-foreground" />
            </div>
            {renderInitiativeCard(rightInitiative, 'right')}
          </div>
        </CardContent>
      </Card>

      {suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recomendações</CardTitle>
            <CardDescription>
              Sugestões baseadas na comparação das iniciativas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                  <Badge variant="outline" className="mt-0.5">{index + 1}</Badge>
                  <p className="text-sm flex-1">{suggestion}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

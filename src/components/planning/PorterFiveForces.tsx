import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Sparkles, Shield, Users, Package, ShoppingCart, RefreshCw, Loader2, AlertCircle, Target } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PorterFiveForcesProps {
  companyId: string;
}

export const PorterFiveForces = ({ companyId }: PorterFiveForcesProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const queryClient = useQueryClient();

  const { data: porterData, isLoading } = useQuery({
    queryKey: ['porter-analysis', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('porter_analysis')
        .select('*')
        .eq('company_id', companyId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('ai-porter', {
        body: { 
          companyId,
          industryInfo: null
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['porter-analysis', companyId] });
      toast.success('Análise Porter gerada com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Error generating Porter analysis:', error);
      toast.error(error.message || 'Erro ao gerar análise Porter');
    }
  });

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await generateMutation.mutateAsync();
    } finally {
      setIsGenerating(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-red-500';
    if (score >= 3) return 'text-amber-500';
    return 'text-green-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 4) return 'Alta Intensidade';
    if (score >= 3) return 'Média Intensidade';
    return 'Baixa Intensidade';
  };

  const forces = [
    { 
      key: 'rivalry', 
      label: 'Rivalidade entre Concorrentes', 
      icon: Shield,
      description: 'Intensidade da competição no setor'
    },
    { 
      key: 'new_entrants', 
      label: 'Ameaça de Novos Entrantes', 
      icon: Users,
      description: 'Facilidade de entrada de novos competidores'
    },
    { 
      key: 'supplier_power', 
      label: 'Poder dos Fornecedores', 
      icon: Package,
      description: 'Influência dos fornecedores nos preços'
    },
    { 
      key: 'buyer_power', 
      label: 'Poder dos Clientes', 
      icon: ShoppingCart,
      description: 'Capacidade de negociação dos clientes'
    },
    { 
      key: 'substitutes', 
      label: 'Ameaça de Substitutos', 
      icon: RefreshCw,
      description: 'Produtos/serviços alternativos disponíveis'
    },
  ];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!porterData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            5 Forças de Porter
          </CardTitle>
          <CardDescription>
            Análise de competitividade do setor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Nenhuma análise Porter foi gerada ainda. Clique no botão abaixo para gerar uma análise completa usando IA.
            </AlertDescription>
          </Alert>
          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating}
            className="mt-4 w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando análise...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Gerar Análise Porter com IA
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const averageScore = (
    (porterData.rivalry_score || 0) +
    (porterData.new_entrants_score || 0) +
    (porterData.supplier_power_score || 0) +
    (porterData.buyer_power_score || 0) +
    (porterData.substitutes_score || 0)
  ) / 5;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                5 Forças de Porter
              </CardTitle>
              <CardDescription>
                Análise de competitividade e forças do mercado
              </CardDescription>
            </div>
            <Button 
              onClick={handleGenerate} 
              disabled={isGenerating}
              variant="outline"
              size="sm"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Atualizando...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Atualizar Análise
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="forces" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="forces">5 Forças</TabsTrigger>
              <TabsTrigger value="competitiveness">Competitividade</TabsTrigger>
              <TabsTrigger value="recommendations">Recomendações</TabsTrigger>
            </TabsList>

            <TabsContent value="forces" className="mt-6 space-y-6">
              {forces.map((force) => {
                const Icon = force.icon;
                const scoreKey = `${force.key}_score` as keyof typeof porterData;
                const analysisKey = `${force.key}_analysis` as keyof typeof porterData;
                const score = porterData[scoreKey] as number || 0;
                const analysis = porterData[analysisKey] as string || '';

                return (
                  <Card key={force.key} className="border-2">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-lg mb-1">{force.label}</CardTitle>
                            <p className="text-sm text-muted-foreground">{force.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${getScoreColor(score)}`}>
                            {score}/5
                          </div>
                          <Badge variant="outline" className="mt-1">
                            {getScoreLabel(score)}
                          </Badge>
                        </div>
                      </div>
                      <Progress value={score * 20} className="mt-4" />
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {analysis}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>

            <TabsContent value="competitiveness" className="mt-6 space-y-6">
              <Card className="border-2">
                <CardHeader>
                  <CardTitle>Análise Geral de Competitividade</CardTitle>
                  <div className="flex items-center gap-4 mt-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Score Médio</p>
                      <div className={`text-4xl font-bold ${getScoreColor(averageScore)}`}>
                        {averageScore.toFixed(1)}/5
                      </div>
                    </div>
                    <div className="flex-1">
                      <Progress value={averageScore * 20} className="h-3" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {porterData.overall_competitiveness}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recommendations" className="mt-6 space-y-4">
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Recomendações Estratégicas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {porterData.recommendations ? (
                    <div className="space-y-4">
                      {porterData.recommendations.split('\n\n').map((rec, idx) => (
                        <div key={idx} className="flex gap-3">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                            {idx + 1}
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                            {rec}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Nenhuma recomendação disponível.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Dica:</strong> Use esta análise para identificar vantagens competitivas e áreas que precisam de atenção estratégica.
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
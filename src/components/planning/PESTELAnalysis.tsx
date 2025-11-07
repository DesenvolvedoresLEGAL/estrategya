import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Sparkles, Building2, DollarSign, Users, Cpu, Leaf, Scale, Loader2, AlertCircle, TrendingUp, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PESTELAnalysisProps {
  companyId: string;
}

export const PESTELAnalysis = ({ companyId }: PESTELAnalysisProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const queryClient = useQueryClient();

  const { data: pestelData, isLoading } = useQuery({
    queryKey: ['pestel-analysis', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pestel_analysis')
        .select('*')
        .eq('company_id', companyId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
  });

  const { data: swotData } = useQuery({
    queryKey: ['swot', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('strategic_context')
        .select('*')
        .eq('company_id', companyId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('ai-pestel', {
        body: { 
          companyId,
          swotData,
          companyInfo: null
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pestel-analysis', companyId] });
      toast.success('Análise PESTEL gerada com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Error generating PESTEL:', error);
      toast.error(error.message || 'Erro ao gerar análise PESTEL');
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

  const factors = [
    { key: 'political', label: 'Político', icon: Building2, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { key: 'economic', label: 'Econômico', icon: DollarSign, color: 'text-green-500', bg: 'bg-green-500/10' },
    { key: 'social', label: 'Social', icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { key: 'technological', label: 'Tecnológico', icon: Cpu, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
    { key: 'environmental', label: 'Ambiental', icon: Leaf, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { key: 'legal', label: 'Legal', icon: Scale, color: 'text-amber-500', bg: 'bg-amber-500/10' },
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

  if (!pestelData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Análise PESTEL
          </CardTitle>
          <CardDescription>
            Análise de fatores externos (Político, Econômico, Social, Tecnológico, Ambiental, Legal)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Nenhuma análise PESTEL foi gerada ainda. Clique no botão abaixo para gerar uma análise completa usando IA.
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
                Gerar Análise PESTEL com IA
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Análise PESTEL
              </CardTitle>
              <CardDescription>
                Fatores externos que impactam a organização
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
          <Tabs defaultValue="factors" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="factors">Fatores PESTEL</TabsTrigger>
              <TabsTrigger value="summary">Resumo Executivo</TabsTrigger>
            </TabsList>

            <TabsContent value="factors" className="mt-6">
              <div className="grid gap-6 md:grid-cols-2">
                {factors.map((factor) => {
                  const Icon = factor.icon;
                  const value = pestelData[factor.key as keyof typeof pestelData];
                  
                  if (!value) return null;

                  return (
                    <Card key={factor.key} className="border-2">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-lg">
                          <div className={`p-2 rounded-lg ${factor.bg}`}>
                            <Icon className={`h-5 w-5 ${factor.color}`} />
                          </div>
                          {factor.label}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                          {value}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="summary" className="mt-6 space-y-6">
              <Card className="border-2 border-green-200 dark:border-green-900">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                    <TrendingUp className="h-5 w-5" />
                    Principais Oportunidades
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Identifique oportunidades estratégicas baseadas nos fatores externos analisados acima.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-red-200 dark:border-red-900">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                    <AlertTriangle className="h-5 w-5" />
                    Principais Ameaças
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Monitore ameaças externas que podem impactar o negócio baseadas nos fatores PESTEL.
                  </p>
                </CardContent>
              </Card>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Dica:</strong> Use esta análise PESTEL junto com a análise SWOT para criar estratégias mais robustas e fundamentadas.
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
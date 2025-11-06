import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Sparkles, Brain } from "lucide-react";

interface Props {
  companyData: any;
  swotData: any;
  initialData: any;
  onNext: (data: any) => void;
  onBack: () => void;
}

export const EtapaAnalise = ({ companyData, swotData, initialData, onNext, onBack }: Props) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(initialData);

  const handleAnalyze = async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-diagnostico', {
        body: {
          company: companyData,
          swot: swotData,
        },
      });

      if (error) throw error;

      // Salvar análise no banco
      const { error: updateError } = await supabase
        .from('strategic_context')
        .update({
          ia_analysis: JSON.stringify(data),
        })
        .eq('id', swotData.id);

      if (updateError) throw updateError;

      setAnalysis(data);
      toast.success("Análise gerada com sucesso!");
    } catch (error: any) {
      console.error('Error generating analysis:', error);
      toast.error("Erro ao gerar análise: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (!analysis) {
      toast.error("Gere a análise antes de continuar");
      return;
    }
    onNext(analysis);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" />
            Análise Estratégica com IA
          </CardTitle>
          <CardDescription>
            Nossa IA vai analisar o contexto da sua empresa e gerar uma leitura estratégica baseada em frameworks globais
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!analysis ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Pronto para a análise?</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Vamos processar suas informações usando frameworks como OKR, BSC e OGSM para gerar insights estratégicos.
              </p>
              <Button onClick={handleAnalyze} disabled={loading} size="lg">
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Analisando...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 w-4 h-4" />
                    Gerar Análise
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Leitura Executiva */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Badge variant="default">Leitura Executiva</Badge>
                </h3>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-foreground leading-relaxed whitespace-pre-line">
                    {analysis.leitura_executiva}
                  </p>
                </div>
              </div>

              {/* Linhas Estratégicas */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Badge variant="secondary">Linhas Estratégicas Possíveis</Badge>
                </h3>
                <div className="grid gap-4">
                  {analysis.linhas_estrategicas?.map((linha: any, idx: number) => (
                    <Card key={idx} className="border-l-4 border-l-primary">
                      <CardContent className="pt-4">
                        <h4 className="font-semibold mb-2">{linha.titulo}</h4>
                        <div className="flex flex-wrap gap-2">
                          {linha.perspectivas?.map((persp: string, pIdx: number) => (
                            <Badge key={pIdx} variant="outline">
                              {persp}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                <p className="text-sm text-success-foreground">
                  ✓ Análise concluída! Agora vamos definir seus objetivos estratégicos baseados nesta leitura.
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
        {analysis && (
          <Button onClick={handleNext} size="lg">
            Próximo
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Sparkles, Brain, Save } from "lucide-react";
import { PESTELDisplay } from "@/components/planning/PESTELDisplay";

interface Props {
  companyData: any;
  swotData: any;
  initialData: any;
  onNext: (data: any) => void;
  onBack: () => void;
  onSaveAndExit?: () => Promise<void>;
}

export const EtapaAnalise = ({ companyData, swotData, initialData, onNext, onBack, onSaveAndExit }: Props) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(initialData);
  const [pestelData, setPestelData] = useState<any>(null);
  const [loadingPestel, setLoadingPestel] = useState(false);

  useEffect(() => {
    // Load existing PESTEL analysis if available
    if (companyData?.id) {
      loadPestelAnalysis();
    }
  }, [companyData?.id]);

  const loadPestelAnalysis = async () => {
    try {
      const { data, error } = await supabase
        .from('pestel_analysis')
        .select('*')
        .eq('company_id', companyData.id)
        .maybeSingle();
      
      if (error) throw error;
      if (data) {
        setPestelData({
          politico: data.political,
          economico: data.economic,
          social: data.social,
          tecnologico: data.technological,
          ambiental: data.environmental,
          legal: data.legal,
        });
      }
    } catch (error) {
      console.error('Error loading PESTEL analysis:', error);
    }
  };

  const handleAnalyze = async () => {
    // Validações
    if (!companyData?.id) {
      toast.error("Dados da empresa não encontrados. Por favor, volte e preencha os dados da empresa.");
      return;
    }

    if (!swotData) {
      toast.error("Dados da análise SWOT não encontrados. Por favor, volte e preencha a análise SWOT.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-diagnostico', {
        body: {
          company: companyData,
          swot: swotData,
        },
      });

      if (error) throw error;

      // Verificar se existe um registro de strategic_context
      let contextId = swotData.id;
      
      if (!contextId) {
        // Criar um novo registro se não existir
        const { data: newContext, error: createError } = await supabase
          .from('strategic_context')
          .insert({
            company_id: companyData.id,
            strengths: swotData.strengths || [],
            weaknesses: swotData.weaknesses || [],
            opportunities: swotData.opportunities || [],
            threats: swotData.threats || [],
            ia_analysis: JSON.stringify(data),
          })
          .select()
          .single();

        if (createError) throw createError;
        contextId = newContext.id;
      } else {
        // Atualizar o registro existente
        const { error: updateError } = await supabase
          .from('strategic_context')
          .update({
            ia_analysis: JSON.stringify(data),
          })
          .eq('id', contextId);

        if (updateError) throw updateError;
      }

      setAnalysis(data);
      
      // Generate PESTEL for all segments
      const pestelSegments = [
        'agronegócio', 'alimentos e bebidas', 'automobilística', 
        'comércio', 'varejo', 'atacado', 'construção civil', 'contabilidade',
        'e-commerce', 'educação', 'energia', 'eventos', 
        'financeiro', 'imobiliário', 'jurídico', 'logística',
        'rh', 'recursos humanos', 'saúde', 'serviços', 'tecnologia', 
        'telecom', 'telecomunicações', 'têxtil', 'vestuário', 
        'transporte', 'turismo', 'indústria'
      ];
      const segmentLower = companyData.segment?.toLowerCase();
      
      if (pestelSegments.includes(segmentLower)) {
        await generatePestelAnalysis();
      }
      
      toast.success("Análise gerada com sucesso!");
    } catch (error: any) {
      console.error('Error generating analysis:', error);
      toast.error("Erro ao gerar análise: " + (error.message || "Erro desconhecido"));
    } finally {
      setLoading(false);
    }
  };

  const generatePestelAnalysis = async () => {
    setLoadingPestel(true);
    try {
      console.log('Gerando análise PESTEL para empresa:', companyData.id);
      
      const { data, error } = await supabase.functions.invoke('ai-pestel', {
        body: {
          companyId: companyData.id,
          swotData: swotData,
          companyInfo: `Empresa: ${companyData.name}, Segmento: ${companyData.segment}, Região: ${companyData.region || 'Brasil'}`,
        },
      });

      if (error) {
        console.error('Erro ao invocar ai-pestel:', error);
        throw error;
      }

      if (data) {
        console.log('PESTEL data recebida:', data);
        
        // Converter para formato do frontend
        const pestelFormatted = {
          politico: data.political,
          economico: data.economic,
          social: data.social,
          tecnologico: data.technological,
          ambiental: data.environmental,
          legal: data.legal,
        };

        setPestelData(pestelFormatted);
        toast.success("Análise PESTEL gerada e salva com sucesso!");
      }
    } catch (error: any) {
      console.error('Erro ao gerar PESTEL:', error);
      toast.error("Erro ao gerar análise PESTEL: " + (error.message || "Erro desconhecido"));
    } finally {
      setLoadingPestel(false);
    }
  };

  const handleNext = () => {
    if (!analysis) {
      toast.error("Por favor, gere a análise estratégica antes de continuar");
      return;
    }
    
    // Garantir que passamos todos os dados, incluindo PESTEL
    const dataToPass = { 
      ...analysis, 
      pestel: pestelData,
      company_id: companyData.id 
    };
    
    onNext(dataToPass);
  };

  const handleSaveAndExitClick = async () => {
    if (!analysis) {
      toast.error("Por favor, gere a análise antes de sair.");
      return;
    }

    // Garantir que os dados estão salvos antes de sair
    if (onSaveAndExit) {
      await onSaveAndExit();
    }
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

              {/* PESTEL Analysis (if applicable) */}
              {pestelData && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Badge variant="secondary">Análise PESTEL para {companyData.segment}</Badge>
                  </h3>
                  <PESTELDisplay pestel={pestelData} />
                </div>
              )}

              <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                <p className="text-sm text-foreground font-medium">
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
        <div className="flex gap-2">
          {onSaveAndExit && (
            <Button 
              variant="ghost" 
              onClick={handleSaveAndExitClick}
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar e Sair
            </Button>
          )}
          {analysis && (
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

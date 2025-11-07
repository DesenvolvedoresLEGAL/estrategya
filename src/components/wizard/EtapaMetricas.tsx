import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Check, TrendingUp, Plus, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Props {
  companyData: any;
  okrsBscData: any;
  onBack: () => void;
}

export const EtapaMetricas = ({ companyData, okrsBscData, onBack }: Props) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [objectives, setObjectives] = useState<any[]>([]);
  const [metricsMap, setMetricsMap] = useState<{ [key: string]: any[] }>({});

  useEffect(() => {
    loadObjectives();
  }, []);

  const loadObjectives = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('strategic_objectives')
        .select('*, initiatives(*)')
        .eq('company_id', companyData.id);

      if (error) throw error;

      setObjectives(data || []);
      
      // Inicializar métricas sugeridas baseadas nos Key Results dos OKRs
      const initialMetrics: { [key: string]: any[] } = {};
      data?.forEach((obj, idx) => {
        const okr = okrsBscData?.okrs?.okrs?.[idx];
        initialMetrics[obj.id] = okr?.key_results?.map((kr: any) => ({
          name: kr.metrica || kr.kr,
          target: kr.target,
          period: 'Mensal',
          source: 'manual',
        })) || [];
      });
      
      setMetricsMap(initialMetrics);
    } catch (error: any) {
      console.error('Error loading objectives:', error);
      toast.error("Erro ao carregar objetivos: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateMetric = (objectiveId: string, metricIndex: number, field: string, value: string) => {
    setMetricsMap(prev => ({
      ...prev,
      [objectiveId]: prev[objectiveId].map((m, i) => 
        i === metricIndex ? { ...m, [field]: value } : m
      )
    }));
  };

  const addMetric = (objectiveId: string) => {
    setMetricsMap(prev => ({
      ...prev,
      [objectiveId]: [
        ...(prev[objectiveId] || []),
        { name: '', target: '', period: 'Mensal', source: 'manual' }
      ]
    }));
  };

  const removeMetric = (objectiveId: string, metricIndex: number) => {
    setMetricsMap(prev => ({
      ...prev,
      [objectiveId]: prev[objectiveId].filter((_, i) => i !== metricIndex)
    }));
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      // Salvar todas as métricas
      for (const objectiveId of Object.keys(metricsMap)) {
        const metrics = metricsMap[objectiveId].filter(m => m.name && m.target);
        
        if (metrics.length > 0) {
          const { error: metricsError } = await supabase
            .from('metrics')
            .insert(
              metrics.map(metric => ({
                objective_id: objectiveId,
                ...metric
              }))
            );

          if (metricsError) throw metricsError;
        }
      }

      // Criar status inicial para todos os objetivos
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const statusPromises = objectives.map(async (obj: any) => {
          await supabase
            .from('objective_updates')
            .insert({
              objective_id: obj.id,
              status: 'nao_iniciado',
              progress_percentage: 0,
              updated_by: user.id,
              notes: 'Status inicial criado automaticamente'
            });
        });

        await Promise.all(statusPromises);
      }

      toast.success("Planejamento estratégico concluído!", {
        description: "Seu plano está pronto para ser executado!",
      });
      navigate("/dashboard");
    } catch (error: any) {
      console.error('Error finishing planning:', error);
      toast.error("Erro ao finalizar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Gerando métricas de acompanhamento...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            Métricas e KPIs - Refinamento Final
          </CardTitle>
          <CardDescription>
            Defina as métricas específicas para cada OKR. Baseadas nos Key Results gerados, você pode customizar e adicionar mais.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {objectives.map((obj: any) => {
            const objMetrics = metricsMap[obj.id] || [];

            return (
              <Card key={obj.id} className="border-l-4 border-l-primary">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{obj.title}</CardTitle>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => addMetric(obj.id)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Adicionar Métrica
                    </Button>
                  </div>
                  {obj.initiatives && obj.initiatives.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {obj.initiatives.length} Key Results
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {objMetrics.map((metric: any, mIdx: number) => (
                    <div key={mIdx} className="bg-muted p-4 rounded-lg space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 grid md:grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label htmlFor={`metric-name-${obj.id}-${mIdx}`}>
                              Nome da Métrica
                            </Label>
                            <Input
                              id={`metric-name-${obj.id}-${mIdx}`}
                              value={metric.name}
                              onChange={(e) => updateMetric(obj.id, mIdx, 'name', e.target.value)}
                              placeholder="Ex: Taxa de conversão"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`metric-target-${obj.id}-${mIdx}`}>
                              Meta
                            </Label>
                            <Input
                              id={`metric-target-${obj.id}-${mIdx}`}
                              value={metric.target}
                              onChange={(e) => updateMetric(obj.id, mIdx, 'target', e.target.value)}
                              placeholder="Ex: 25%"
                            />
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeMetric(obj.id, mIdx)}
                          className="mt-8"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {objMetrics.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhuma métrica definida ainda. Clique em "Adicionar Métrica" para começar.
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}

          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6 text-center border-2 border-primary/20">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Parabéns!</h3>
            <p className="text-lg mb-4">
              Seu planejamento estratégico está completo
            </p>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              Você criou {objectives.length} objetivos estratégicos usando os frameworks OGSM, OKR e BSC. 
              Suas iniciativas foram priorizadas e você tem um plano de execução 4DX pronto. Agora é hora de executar!
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={loading}>
          <ArrowLeft className="mr-2 w-4 h-4" />
          Voltar
        </Button>
        <Button onClick={handleFinish} size="lg" disabled={loading}>
          {loading ? "Salvando..." : (
            <>
              <Check className="mr-2 w-4 h-4" />
              Concluir Planejamento
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

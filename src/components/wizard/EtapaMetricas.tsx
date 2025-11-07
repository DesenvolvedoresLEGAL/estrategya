import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Check, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Props {
  companyData: any;
  objectivesData: any;
  onBack: () => void;
}

export const EtapaMetricas = ({ companyData, objectivesData, onBack }: Props) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    if (objectivesData) {
      generateMetrics();
    }
  }, [objectivesData]);

  const generateMetrics = async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-indicadores', {
        body: {
          objectives: objectivesData.map((obj: any) => ({
            titulo: obj.title,
            perspectiva: obj.perspective,
          })),
        },
      });

      if (error) throw error;

      // Salvar métricas no banco
      const metricPromises = objectivesData.map(async (obj: any, idx: number) => {
        const objectiveKey = Object.keys(data.metricas_por_objetivo)[idx];
        const objMetrics = data.metricas_por_objetivo[objectiveKey];

        if (objMetrics && objMetrics.length > 0) {
          const { error: metricsError } = await supabase
            .from('metrics')
            .insert(
              objMetrics.map((metric: any) => ({
                objective_id: obj.id,
                name: metric.nome,
                target: metric.meta,
                period: metric.periodo,
                source: 'manual',
              }))
            );

          if (metricsError) throw metricsError;
        }
      });

      await Promise.all(metricPromises);
      setMetrics(data);
      toast.success("Métricas geradas com sucesso!");
    } catch (error: any) {
      console.error('Error generating metrics:', error);
      toast.error("Erro ao gerar métricas: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async () => {
    try {
      // Create initial status for all objectives
      const statusPromises = objectivesData.map(async (obj: any) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

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

      toast.success("Planejamento estratégico concluído!", {
        description: "Seu plano está pronto para ser executado!",
      });
      navigate("/dashboard");
    } catch (error) {
      console.error('Error creating initial status:', error);
      navigate("/dashboard");
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
            Métricas e Indicadores
          </CardTitle>
          <CardDescription>
            KRs e métricas para acompanhar o progresso dos seus objetivos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {objectivesData.map((obj: any, idx: number) => {
            const objectiveKey = metrics ? Object.keys(metrics.metricas_por_objetivo)[idx] : null;
            const objMetrics = objectiveKey ? metrics.metricas_por_objetivo[objectiveKey] : [];

            return (
              <Card key={obj.id} className="border-l-4 border-l-primary">
                <CardHeader>
                  <CardTitle className="text-lg">{obj.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-3">
                    {objMetrics.map((metric: any, mIdx: number) => (
                      <div key={mIdx} className="bg-muted p-3 rounded-lg">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-semibold text-sm">{metric.nome}</h4>
                          <Badge variant="outline" className="text-xs">
                            {metric.periodo}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Meta: {metric.meta}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          <div className="bg-gradient-success rounded-lg p-6 text-center text-success-foreground">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Parabéns!</h3>
            <p className="text-lg mb-4">
              Seu planejamento estratégico está completo
            </p>
            <p className="text-sm opacity-90 max-w-2xl mx-auto">
              Você criou {objectivesData.length} objetivos estratégicos com iniciativas e métricas de acompanhamento. 
              Agora é hora de executar e acompanhar o progresso!
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 w-4 h-4" />
          Voltar
        </Button>
        <Button onClick={handleFinish} size="lg" className="bg-gradient-success">
          <Check className="mr-2 w-4 h-4" />
          Concluir Planejamento
        </Button>
      </div>
    </div>
  );
};

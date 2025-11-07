import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Users, Settings, Cpu, Target, Loader2, Save, TrendingUp, CheckCircle2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";

interface MaturityAssessmentProps {
  companyId: string;
}

const maturityLevels = [
  { value: 1, label: 'Inicial', color: 'text-red-500', description: 'Processos ad-hoc e imprevisíveis' },
  { value: 2, label: 'Gerenciado', color: 'text-orange-500', description: 'Processos básicos estabelecidos' },
  { value: 3, label: 'Definido', color: 'text-yellow-500', description: 'Processos documentados e padronizados' },
  { value: 4, label: 'Quantitativamente Gerenciado', color: 'text-blue-500', description: 'Processos medidos e controlados' },
  { value: 5, label: 'Otimizado', color: 'text-green-500', description: 'Melhoria contínua estabelecida' },
];

export const MaturityAssessment = ({ companyId }: MaturityAssessmentProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [scores, setScores] = useState({
    people: 3,
    processes: 3,
    technology: 3,
    strategy: 3,
  });
  const [analyses, setAnalyses] = useState({
    people: '',
    processes: '',
    technology: '',
    strategy: '',
  });
  const queryClient = useQueryClient();

  const { data: maturityData, isLoading } = useQuery({
    queryKey: ['maturity-assessment', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maturity_assessment')
        .select('*')
        .eq('company_id', companyId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setScores({
          people: data.people_score || 3,
          processes: data.processes_score || 3,
          technology: data.technology_score || 3,
          strategy: data.strategy_score || 3,
        });
        setAnalyses({
          people: data.people_analysis || '',
          processes: data.processes_analysis || '',
          technology: data.technology_analysis || '',
          strategy: data.strategy_analysis || '',
        });
      }
      
      return data;
    }
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const averageScore = (scores.people + scores.processes + scores.technology + scores.strategy) / 4;
      const overallLevel = maturityLevels.find(l => l.value === Math.round(averageScore));

      const payload = {
        company_id: companyId,
        people_score: scores.people,
        people_analysis: analyses.people,
        processes_score: scores.processes,
        processes_analysis: analyses.processes,
        technology_score: scores.technology,
        technology_analysis: analyses.technology,
        strategy_score: scores.strategy,
        strategy_analysis: analyses.strategy,
        overall_maturity_level: overallLevel?.label || 'Definido',
      };

      if (maturityData) {
        const { error } = await supabase
          .from('maturity_assessment')
          .update(payload)
          .eq('id', maturityData.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('maturity_assessment')
          .insert(payload);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maturity-assessment', companyId] });
      toast.success('Assessment salvo com sucesso!');
      setIsEditing(false);
    },
    onError: (error: Error) => {
      console.error('Error saving assessment:', error);
      toast.error('Erro ao salvar assessment');
    }
  });

  const dimensions = [
    { 
      key: 'people', 
      label: 'Pessoas', 
      icon: Users,
      description: 'Talentos, cultura e capacitação da equipe',
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    },
    { 
      key: 'processes', 
      label: 'Processos', 
      icon: Settings,
      description: 'Padronização e eficiência operacional',
      color: 'text-green-500',
      bg: 'bg-green-500/10'
    },
    { 
      key: 'technology', 
      label: 'Tecnologia', 
      icon: Cpu,
      description: 'Ferramentas e infraestrutura tecnológica',
      color: 'text-purple-500',
      bg: 'bg-purple-500/10'
    },
    { 
      key: 'strategy', 
      label: 'Estratégia', 
      icon: Target,
      description: 'Planejamento e execução estratégica',
      color: 'text-amber-500',
      bg: 'bg-amber-500/10'
    },
  ];

  const averageScore = (scores.people + scores.processes + scores.technology + scores.strategy) / 4;
  const currentLevel = maturityLevels.find(l => l.value === Math.round(averageScore));

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
                <TrendingUp className="h-5 w-5" />
                Assessment de Maturidade Organizacional
              </CardTitle>
              <CardDescription>
                Avalie a maturidade em 4 dimensões críticas
              </CardDescription>
            </div>
            <Button 
              onClick={() => isEditing ? saveMutation.mutate() : setIsEditing(true)}
              variant={isEditing ? "default" : "outline"}
              size="sm"
            >
              {saveMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : isEditing ? (
                <Save className="mr-2 h-4 w-4" />
              ) : null}
              {isEditing ? 'Salvar' : 'Editar'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="assessment" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="assessment">Assessment</TabsTrigger>
              <TabsTrigger value="roadmap">Roadmap de Evolução</TabsTrigger>
            </TabsList>

            <TabsContent value="assessment" className="mt-6 space-y-6">
              {/* Overall Score */}
              <Card className="border-2">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Maturidade Geral</p>
                      <div className="flex items-center gap-3">
                        <span className={`text-4xl font-bold ${currentLevel?.color}`}>
                          {averageScore.toFixed(1)}
                        </span>
                        <Badge variant="outline" className="text-base">
                          {currentLevel?.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {currentLevel?.description}
                      </p>
                    </div>
                    <Progress value={averageScore * 20} className="w-32 h-3" />
                  </div>
                </CardContent>
              </Card>

              {/* Dimensions */}
              <div className="grid gap-6 md:grid-cols-2">
                {dimensions.map((dimension) => {
                  const Icon = dimension.icon;
                  const dimensionKey = dimension.key as keyof typeof scores;
                  const score = scores[dimensionKey];
                  const analysis = analyses[dimensionKey];
                  const level = maturityLevels.find(l => l.value === score);

                  return (
                    <Card key={dimension.key} className="border-2">
                      <CardHeader>
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`p-2 rounded-lg ${dimension.bg}`}>
                            <Icon className={`h-5 w-5 ${dimension.color}`} />
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-lg">{dimension.label}</CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {dimension.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <span className={`text-2xl font-bold ${level?.color}`}>
                            {score}/5
                          </span>
                          <Badge variant="outline">
                            {level?.label}
                          </Badge>
                        </div>
                        <Progress value={score * 20} className="mt-2" />
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {isEditing && (
                          <div className="space-y-2">
                            <Label>Score (1-5)</Label>
                            <Slider
                              value={[score]}
                              onValueChange={(value) => 
                                setScores({ ...scores, [dimensionKey]: value[0] })
                              }
                              min={1}
                              max={5}
                              step={1}
                              className="w-full"
                            />
                          </div>
                        )}
                        <div className="space-y-2">
                          <Label>Análise</Label>
                          {isEditing ? (
                            <Textarea
                              value={analysis}
                              onChange={(e) => 
                                setAnalyses({ ...analyses, [dimensionKey]: e.target.value })
                              }
                              placeholder={`Descreva o estado atual de ${dimension.label.toLowerCase()}...`}
                              rows={4}
                            />
                          ) : (
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {analysis || 'Nenhuma análise adicionada ainda.'}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="roadmap" className="mt-6 space-y-6">
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    Roadmap de Evolução
                  </CardTitle>
                  <CardDescription>
                    Ações recomendadas para evoluir a maturidade organizacional
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {dimensions.map((dimension, idx) => {
                      const dimensionKey = dimension.key as keyof typeof scores;
                      const score = scores[dimensionKey];
                      const Icon = dimension.icon;
                      
                      if (score >= 5) {
                        return (
                          <div key={dimension.key} className="flex gap-3 items-start">
                            <div className={`p-2 rounded-lg ${dimension.bg}`}>
                              <Icon className={`h-4 w-4 ${dimension.color}`} />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold mb-1">{dimension.label}</h4>
                              <p className="text-sm text-green-600 dark:text-green-400">
                                ✓ Nível máximo atingido! Continue mantendo as melhores práticas.
                              </p>
                            </div>
                          </div>
                        );
                      }

                      const nextLevel = maturityLevels.find(l => l.value === score + 1);
                      
                      return (
                        <div key={dimension.key} className="flex gap-3 items-start">
                          <div className={`p-2 rounded-lg ${dimension.bg}`}>
                            <Icon className={`h-4 w-4 ${dimension.color}`} />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold mb-1">{dimension.label}</h4>
                            <p className="text-sm text-muted-foreground mb-2">
                              Próximo nível: <span className="font-medium">{nextLevel?.label}</span>
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {nextLevel?.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
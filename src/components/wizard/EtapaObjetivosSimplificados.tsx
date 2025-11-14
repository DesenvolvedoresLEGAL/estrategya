import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Target, Plus, X, Sparkles } from "lucide-react";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { UpgradePrompt } from "@/components/subscription/UpgradePrompt";
import { useAnalytics } from "@/hooks/useAnalytics";

interface Objective {
  id?: string;
  title: string;
  description: string;
  initiatives: Initiative[];
}

interface Initiative {
  title: string;
  description: string;
}

interface Props {
  companyData: any;
  analysisData: any;
  initialData: any;
  onNext: (data: any) => void;
  onBack: () => void;
  onSaveAndExit?: () => Promise<void>;
}

export const EtapaObjetivosSimplificados = ({ companyData, analysisData, initialData, onNext, onBack, onSaveAndExit }: Props) => {
  const [loading, setLoading] = useState(false);
  const [objectives, setObjectives] = useState<Objective[]>([
    { title: "", description: "", initiatives: [] }
  ]);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  
  const { limits } = useSubscriptionLimits(companyData?.id);
  const { trackEvent } = useAnalytics();

  const maxObjectives = limits?.max_objectives || 3;
  const maxInitiativesPerObjective = 5;

  // Verificar se o planejamento já foi concluído (objetivos já salvos)
  const [isPlanningCompleted, setIsPlanningCompleted] = useState(false);

  useEffect(() => {
    const checkIfCompleted = async () => {
      if (companyData?.id) {
        const { data: existingObjectives } = await supabase
          .from('strategic_objectives')
          .select('id')
          .eq('company_id', companyData.id);
        
        setIsPlanningCompleted(existingObjectives && existingObjectives.length > 0);
      }
    };
    
    checkIfCompleted();
  }, [companyData?.id]);

  useEffect(() => {
    if (initialData && Array.isArray(initialData) && initialData.length > 0) {
      setObjectives(initialData);
    }
  }, [initialData]);

  const addObjective = () => {
    if (objectives.length >= maxObjectives) {
      setShowUpgradePrompt(true);
      trackEvent("limit_reached", { type: "objectives", plan: "free" });
      return;
    }
    setObjectives([...objectives, { title: "", description: "", initiatives: [] }]);
  };

  const removeObjective = (index: number) => {
    setObjectives(objectives.filter((_, i) => i !== index));
  };

  const updateObjective = (index: number, field: keyof Objective, value: any) => {
    const updated = [...objectives];
    updated[index] = { ...updated[index], [field]: value };
    setObjectives(updated);
  };

  const addInitiative = (objectiveIndex: number) => {
    const objective = objectives[objectiveIndex];
    if (objective.initiatives.length >= maxInitiativesPerObjective) {
      toast.warning(`Máximo de ${maxInitiativesPerObjective} iniciativas por objetivo`);
      return;
    }
    const updated = [...objectives];
    updated[objectiveIndex].initiatives.push({ title: "", description: "" });
    setObjectives(updated);
  };

  const removeInitiative = (objectiveIndex: number, initiativeIndex: number) => {
    const updated = [...objectives];
    updated[objectiveIndex].initiatives = updated[objectiveIndex].initiatives.filter((_, i) => i !== initiativeIndex);
    setObjectives(updated);
  };

  const updateInitiative = (objectiveIndex: number, initiativeIndex: number, field: keyof Initiative, value: string) => {
    const updated = [...objectives];
    updated[objectiveIndex].initiatives[initiativeIndex] = {
      ...updated[objectiveIndex].initiatives[initiativeIndex],
      [field]: value
    };
    setObjectives(updated);
  };

  const handleSave = async () => {
    // Validar que pelo menos um objetivo foi criado
    const validObjectives = objectives.filter(obj => obj.title.trim() !== "");
    
    if (validObjectives.length === 0) {
      toast.error("Crie pelo menos um objetivo antes de continuar");
      return;
    }

    // Validar limite de objetivos do plano
    if (validObjectives.length > maxObjectives) {
      toast.error(`Você atingiu o limite de ${maxObjectives} objetivos do seu plano. Remova ${validObjectives.length - maxObjectives} objetivo(s) ou faça upgrade.`);
      setShowUpgradePrompt(true);
      return;
    }

    setLoading(true);

    try {
      // Verificar se já existem objetivos salvos
      const { data: existingObjectives } = await supabase
        .from('strategic_objectives')
        .select('id')
        .eq('company_id', companyData.id);

      // Se já existem objetivos, significa que o planejamento já foi concluído
      // Neste caso, apenas navegar para a próxima etapa sem duplicar
      if (existingObjectives && existingObjectives.length > 0) {
        toast.success("Objetivos já foram salvos anteriormente");
        onNext(objectives);
        return;
      }

      // Limitar aos primeiros maxObjectives objetivos válidos
      const objectivesToSave = validObjectives.slice(0, maxObjectives);
      
      // Salvar objetivos no banco
      const savedObjectives = await Promise.all(
        objectivesToSave.map(async (obj) => {
          const { data: savedObj, error: objError } = await supabase
            .from('strategic_objectives')
            .insert([{
              company_id: companyData.id,
              title: obj.title,
              description: obj.description || null,
              horizon: 'H1',
              perspective: 'financeira',
              priority: 1,
            }])
            .select()
            .single();

          if (objError) throw objError;

          // Salvar iniciativas (limitar a maxInitiativesPerObjective)
          const validInitiatives = obj.initiatives
            .filter(init => init.title.trim() !== "")
            .slice(0, maxInitiativesPerObjective);
            
          if (validInitiatives.length > 0) {
            const { error: initError } = await supabase
              .from('initiatives')
              .insert(
                validInitiatives.map((init) => ({
                  objective_id: savedObj.id,
                  title: init.title,
                  description: init.description || null,
                  suggested_by_ai: false,
                }))
              );

            if (initError) throw initError;
          }

          return savedObj;
        })
      );

      trackEvent("objectives_created_manual", { 
        count: savedObjectives.length, 
        plan: "free" 
      });

      toast.success(`${savedObjectives.length} objetivo(s) criado(s) com sucesso!`);
      onNext(savedObjectives);
    } catch (error: any) {
      console.error('Error saving objectives:', error);
      toast.error("Erro ao salvar objetivos: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-6 h-6 text-primary" />
                Seus Objetivos Estratégicos
              </CardTitle>
              <CardDescription>
                Crie até {maxObjectives} objetivos estratégicos para o próximo período
              </CardDescription>
            </div>
            <Badge variant="outline" className="shrink-0">
              {objectives.filter(o => o.title.trim() !== "").length}/{maxObjectives} objetivos
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Info Banner */}
          {isPlanningCompleted ? (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <div className="flex gap-3">
                <Target className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    Planejamento Concluído
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Seus objetivos já foram salvos. Para fazer alterações, acesse a página de Objetivos no menu principal.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="flex gap-3">
                <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    Plano Free: Crie seus objetivos manualmente
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Quer que a IA gere objetivos automaticamente com base no seu diagnóstico? 
                    <button
                      onClick={() => setShowUpgradePrompt(true)}
                      className="text-primary hover:underline ml-1"
                    >
                      Faça upgrade para PRO
                    </button>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Objectives List */}
          <div className="space-y-6">
            {objectives.map((objective, objIndex) => (
              <Card key={objIndex} className="border-2 border-border">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Objetivo {objIndex + 1}</Badge>
                        {objectives.length > 1 && !isPlanningCompleted && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeObjective(objIndex)}
                            className="h-6 px-2"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                      <Input
                        placeholder="Ex: Aumentar a receita recorrente em 30%"
                        value={objective.title}
                        onChange={(e) => updateObjective(objIndex, "title", e.target.value)}
                        className="font-medium"
                        disabled={isPlanningCompleted}
                      />
                      <Textarea
                        placeholder="Descreva como você pretende alcançar este objetivo (opcional)"
                        value={objective.description}
                        onChange={(e) => updateObjective(objIndex, "description", e.target.value)}
                        rows={2}
                        disabled={isPlanningCompleted}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Iniciativas</p>
                    {!isPlanningCompleted && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addInitiative(objIndex)}
                        disabled={objective.initiatives.length >= maxInitiativesPerObjective}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Adicionar
                      </Button>
                    )}
                  </div>
                  {objective.initiatives.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      Adicione iniciativas práticas para atingir este objetivo
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {objective.initiatives.map((initiative, initIndex) => (
                        <div key={initIndex} className="bg-muted/50 rounded-lg p-3 space-y-2">
                          <div className="flex items-start gap-2">
                            <div className="flex-1 space-y-2">
                              <Input
                                placeholder="Nome da iniciativa"
                                value={initiative.title}
                                onChange={(e) => updateInitiative(objIndex, initIndex, "title", e.target.value)}
                                className="h-8 text-sm"
                                disabled={isPlanningCompleted}
                              />
                              <Textarea
                                placeholder="Descrição (opcional)"
                                value={initiative.description}
                                onChange={(e) => updateInitiative(objIndex, initIndex, "description", e.target.value)}
                                rows={1}
                                className="text-sm"
                                disabled={isPlanningCompleted}
                              />
                            </div>
                            {!isPlanningCompleted && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeInitiative(objIndex, initIndex)}
                                className="h-6 px-2 shrink-0"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Add Objective Button */}
          {!isPlanningCompleted && objectives.length < maxObjectives && (
            <Button
              variant="outline"
              onClick={addObjective}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Objetivo ({objectives.length}/{maxObjectives})
            </Button>
          )}

          {!isPlanningCompleted && objectives.length >= maxObjectives && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
              <p className="text-sm text-foreground">
                Você atingiu o limite de {maxObjectives} objetivos do plano Free.{" "}
                <button
                  onClick={() => setShowUpgradePrompt(true)}
                  className="text-primary hover:underline font-medium"
                >
                  Faça upgrade
                </button>{" "}
                para criar objetivos ilimitados.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <UpgradePrompt
        open={showUpgradePrompt}
        onOpenChange={setShowUpgradePrompt}
        limitType="objectives"
      />

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 w-4 h-4" />
          Voltar
        </Button>
        <div className="flex gap-2">
          {onSaveAndExit && (
            <Button variant="outline" onClick={onSaveAndExit}>
              Salvar e Sair
            </Button>
          )}
          <Button onClick={handleSave} disabled={loading} size="lg">
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Salvando...
              </>
            ) : isPlanningCompleted ? (
              <>
                Avançar
                <ArrowRight className="ml-2 w-4 h-4" />
              </>
            ) : (
              <>
                Concluir Planejamento
                <ArrowRight className="ml-2 w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
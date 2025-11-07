import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Loader2, Target, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { ICEScoreForm } from "@/components/planning/ICEScoreForm";
import { FiveW2HForm } from "@/components/planning/FiveW2HForm";
import { FiveW2HDisplay } from "@/components/planning/FiveW2HDisplay";
import { FiveW2HWizard } from "@/components/planning/FiveW2HWizard";
import { InitiativeTimeline } from "@/components/planning/InitiativeTimeline";
import { FiveW2HCompleteness } from "@/components/planning/FiveW2HCompleteness";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function InitiativeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [initiative, setInitiative] = useState<any>(null);
  const [objective, setObjective] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);

  useEffect(() => {
    loadInitiativeData();
  }, [id]);

  const loadInitiativeData = async () => {
    try {
      setLoading(true);

      // Buscar iniciativa com objetivo relacionado
      const { data: initData, error: initError } = await supabase
        .from('initiatives')
        .select(`
          *,
          strategic_objectives (
            id,
            title,
            description,
            perspective,
            company_id,
            companies (
              id,
              name,
              segment
            )
          )
        `)
        .eq('id', id)
        .single();

      if (initError) throw initError;

      setInitiative(initData);
      setObjective(initData.strategic_objectives);
      setCompany(initData.strategic_objectives?.companies);
    } catch (error: any) {
      console.error('Erro ao carregar iniciativa:', error);
      toast.error('Erro ao carregar dados da iniciativa');
    } finally {
      setLoading(false);
    }
  };

  const handleICEScoreChange = async (scores: {
    impact: number;
    confidence: number;
    ease: number;
    iceScore: number;
  }) => {
    try {
      const { error } = await supabase
        .from('initiatives')
        .update({
          impact_score: scores.impact,
          confidence_score: scores.confidence,
          ease_score: scores.ease,
        })
        .eq('id', id);

      if (error) throw error;

      // Atualizar estado local
      setInitiative((prev: any) => ({
        ...prev,
        impact_score: scores.impact,
        confidence_score: scores.confidence,
        ease_score: scores.ease,
        ice_score: scores.iceScore,
      }));
    } catch (error: any) {
      console.error('Erro ao salvar ICE Score:', error);
      toast.error('Erro ao salvar ICE Score');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!initiative) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Iniciativa não encontrada</p>
            <Button onClick={() => navigate('/objetivos')} className="mt-4">
              Voltar para Objetivos
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const perspectiveColors: Record<string, string> = {
    financeira: "bg-green-500/10 text-green-700 dark:text-green-400",
    clientes: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    processos: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
    aprendizado: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => navigate('/objetivos')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
      </div>

      {/* Título e Objetivo */}
      <Card>
        <CardHeader>
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 flex-1">
                <CardTitle className="text-2xl">{initiative.title}</CardTitle>
                {initiative.description && (
                  <CardDescription className="text-base">
                    {initiative.description}
                  </CardDescription>
                )}
              </div>
              <div className="flex gap-2 flex-wrap justify-end">
                {initiative.status && (
                  <Badge variant="outline">{initiative.status}</Badge>
                )}
                {initiative.priority_quadrant && (
                  <Badge>{initiative.priority_quadrant}</Badge>
                )}
              </div>
            </div>

            {objective && (
              <div className="flex items-center gap-2 pt-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Vinculado ao objetivo:
                </span>
                <Badge
                  variant="secondary"
                  className={
                    objective.perspective
                      ? perspectiveColors[objective.perspective.toLowerCase()]
                      : ""
                  }
                >
                  {objective.title}
                </Badge>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* 5W2H Completeness & Timeline */}
      <div className="grid md:grid-cols-2 gap-6">
        <FiveW2HCompleteness
          data={{
            what: initiative.what,
            why: initiative.why,
            who: initiative.who,
            when_deadline: initiative.when_deadline,
            where_location: initiative.where_location,
            how: initiative.how,
            how_much: initiative.how_much,
          }}
        />
        <InitiativeTimeline initiative={initiative} />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="ice" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="ice">ICE Score</TabsTrigger>
          <TabsTrigger value="5w2h-wizard">5W2H Wizard</TabsTrigger>
          <TabsTrigger value="5w2h-form">Editar Avançado</TabsTrigger>
          <TabsTrigger value="5w2h-view">Visualizar</TabsTrigger>
        </TabsList>

        <TabsContent value="ice" className="space-y-4">
          <ICEScoreForm
            initiativeId={id!}
            initialImpact={initiative.impact_score || 5}
            initialConfidence={initiative.confidence_score || 5}
            initialEase={initiative.ease_score || 5}
            onScoresChange={handleICEScoreChange}
          />

          {initiative.ice_score && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Resultado do ICE Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {initiative.impact_score}
                    </div>
                    <div className="text-sm text-muted-foreground">Impact</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {initiative.confidence_score}
                    </div>
                    <div className="text-sm text-muted-foreground">Confidence</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                      {initiative.ease_score}
                    </div>
                    <div className="text-sm text-muted-foreground">Ease</div>
                  </div>
                  <div className="border-l pl-4">
                    <div className="text-4xl font-bold text-primary">
                      {initiative.ice_score}
                    </div>
                    <div className="text-sm text-muted-foreground">ICE Total</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="5w2h-wizard">
          <FiveW2HWizard
            initiativeId={id!}
            initiativeTitle={initiative.title}
            initiativeDescription={initiative.description}
            objectiveTitle={objective?.title}
            companyData={company}
            initialData={{
              what: initiative.what,
              why: initiative.why,
              who: initiative.who,
              when_deadline: initiative.when_deadline,
              where_location: initiative.where_location,
              how: initiative.how,
              how_much: initiative.how_much,
            }}
            onSave={loadInitiativeData}
          />
        </TabsContent>

        <TabsContent value="5w2h-form">
          <FiveW2HForm
            initiativeId={id!}
            initiativeTitle={initiative.title}
            initiativeDescription={initiative.description}
            objectiveTitle={objective?.title}
            companyData={company}
            initialData={{
              what: initiative.what,
              why: initiative.why,
              who: initiative.who,
              when_deadline: initiative.when_deadline,
              where_location: initiative.where_location,
              how: initiative.how,
              how_much: initiative.how_much,
            }}
            onSave={loadInitiativeData}
          />
        </TabsContent>

        <TabsContent value="5w2h-view">
          <FiveW2HDisplay
            data={{
              what: initiative.what,
              why: initiative.why,
              who: initiative.who,
              when_deadline: initiative.when_deadline,
              where_location: initiative.where_location,
              how: initiative.how,
              how_much: initiative.how_much,
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

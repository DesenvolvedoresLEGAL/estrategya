import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { LogOut, TrendingUp, Target, Plus } from "lucide-react";
import { toast } from "sonner";
import { MetricCard } from "@/components/metrics/MetricCard";
import { UpdateMetricModal } from "@/components/metrics/UpdateMetricModal";
import { AddMetricModal } from "@/components/metrics/AddMetricModal";
import { BSC_PERSPECTIVES, BSC_PERSPECTIVE_LABELS, PERSPECTIVE_VARIATIONS } from "@/lib/constants/perspectives";

const Metricas = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [objectives, setObjectives] = useState<any[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<any>(null);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [addMetricModalOpen, setAddMetricModalOpen] = useState(false);
  const [selectedObjective, setSelectedObjective] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [companyId, setCompanyId] = useState<string>("");

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }
      
      setUser(session.user);
      await loadMetrics(session.user.id);
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadMetrics = async (userId: string) => {
    try {
      // Buscar empresa do usuário
      const { data: companies } = await supabase
        .from('companies')
        .select('id')
        .eq('owner_user_id', userId)
        .limit(1);

      if (!companies || companies.length === 0) return;

      setCompanyId(companies[0].id);

      // Buscar objetivos com métricas e histórico de atualizações
      const { data, error } = await supabase
        .from('strategic_objectives')
        .select(`
          *,
          metrics (
            *,
            metric_updates (*)
          )
        `)
        .eq('company_id', companies[0].id)
        .order('priority', { ascending: true });

      if (error) throw error;
      setObjectives(data || []);
    } catch (error: any) {
      console.error('Error loading metrics:', error);
      toast.error("Erro ao carregar métricas");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleUpdateMetric = (metric: any, objective: any) => {
    setSelectedMetric({ ...metric, objective });
    setUpdateModalOpen(true);
  };

  const handleUpdateComplete = async () => {
    setUpdateModalOpen(false);
    setSelectedMetric(null);
    if (user) {
      await loadMetrics(user.id);
    }
  };

  const handleAddMetric = (objective: any) => {
    setSelectedObjective(objective);
    setAddMetricModalOpen(true);
  };

  const handleAddMetricComplete = async () => {
    setAddMetricModalOpen(false);
    setSelectedObjective(null);
    if (user) {
      await loadMetrics(user.id);
    }
  };

  // Filtrar métricas por perspectiva
  const getFilteredObjectives = () => {
    if (activeTab === "all") return objectives;
    
    // Normalizar a perspectiva usando o mapeamento de variações
    const validValues = PERSPECTIVE_VARIATIONS[activeTab] || [activeTab];
    return objectives.filter(obj => 
      validValues.some(v => obj.perspective?.toLowerCase() === v.toLowerCase())
    );
  };

  const getTotalMetrics = () => {
    return objectives.reduce((sum, obj) => sum + (obj.metrics?.length || 0), 0);
  };

  const getUpdatedMetrics = () => {
    return objectives.reduce((sum, obj) => {
      const updated = obj.metrics?.filter((m: any) => m.current_value) || [];
      return sum + updated.length;
    }, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando métricas...</p>
        </div>
      </div>
    );
  }

  const filteredObjectives = getFilteredObjectives();

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <TrendingUp className="w-8 h-8 text-primary" />
          Gestão de Métricas
        </h1>
        <p className="text-muted-foreground mt-2">
          Acompanhe a evolução dos seus indicadores estratégicos
        </p>
      </div>

      {/* Main Content */}
      <main>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Métricas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{getTotalMetrics()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Distribuídas em {objectives.length} objetivos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Métricas Atualizadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{getUpdatedMetrics()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round((getUpdatedMetrics() / getTotalMetrics()) * 100)}% do total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Objetivos Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{objectives.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Com métricas definidas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs por Perspectiva */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value={BSC_PERSPECTIVES.FINANCEIRA}>{BSC_PERSPECTIVE_LABELS[BSC_PERSPECTIVES.FINANCEIRA]}</TabsTrigger>
            <TabsTrigger value={BSC_PERSPECTIVES.CLIENTES}>{BSC_PERSPECTIVE_LABELS[BSC_PERSPECTIVES.CLIENTES]}</TabsTrigger>
            <TabsTrigger value={BSC_PERSPECTIVES.PROCESSOS}>{BSC_PERSPECTIVE_LABELS[BSC_PERSPECTIVES.PROCESSOS]}</TabsTrigger>
            <TabsTrigger value={BSC_PERSPECTIVES.APRENDIZADO}>{BSC_PERSPECTIVE_LABELS[BSC_PERSPECTIVES.APRENDIZADO]}</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-6">
            {filteredObjectives.length === 0 ? (
              <Card className="p-12">
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  {activeTab === "all" ? (
                    <>
                      <h3 className="text-lg font-semibold mb-2">
                        Nenhum objetivo criado
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Comece criando seu planejamento estratégico para definir objetivos e métricas.
                      </p>
                      <Button onClick={() => navigate("/planejamento")}>
                        <Plus className="w-4 h-4 mr-2" />
                        Criar Planejamento
                      </Button>
                    </>
                  ) : (
                    <>
                      <h3 className="text-lg font-semibold mb-2">
                        Nenhum objetivo na perspectiva {BSC_PERSPECTIVE_LABELS[activeTab as keyof typeof BSC_PERSPECTIVE_LABELS]}
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Adicione objetivos nesta perspectiva durante o planejamento estratégico.
                      </p>
                      <Button onClick={() => navigate("/objetivos")}>
                        Ver Objetivos
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            ) : (
              filteredObjectives.map((objective) => (
                <Card key={objective.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="h-5 w-5 text-primary" />
                          <CardTitle>{objective.title}</CardTitle>
                        </div>
                        <CardDescription>{objective.description}</CardDescription>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">
                            {objective.perspective || 'Geral'}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {objective.metrics?.length || 0}/5 métricas
                          </span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddMetric(objective)}
                        disabled={objective.metrics?.length >= 5}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Adicionar Métrica
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {objective.metrics && objective.metrics.length > 0 ? (
                      objective.metrics.map((metric: any) => (
                        <MetricCard
                          key={metric.id}
                          metric={metric}
                          objective={objective}
                          onUpdate={() => handleUpdateMetric(metric, objective)}
                        />
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhuma métrica definida para este objetivo
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Update Modal */}
      {selectedMetric && (
        <UpdateMetricModal
          open={updateModalOpen}
          onOpenChange={setUpdateModalOpen}
          metric={selectedMetric}
          onUpdateComplete={handleUpdateComplete}
        />
      )}

      {/* Add Metric Modal */}
      {selectedObjective && (
        <AddMetricModal
          open={addMetricModalOpen}
          onOpenChange={setAddMetricModalOpen}
          objectiveId={selectedObjective.id}
          objectiveTitle={selectedObjective.title}
          onSuccess={handleAddMetricComplete}
        />
      )}
    </div>
  );
};

export default Metricas;
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

const Metricas = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [objectives, setObjectives] = useState<any[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<any>(null);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

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

      // Buscar objetivos com métricas e histórico de atualizações
      const { data, error } = await supabase
        .from('strategic_objectives')
        .select(`
          *,
          metrics (
            *,
            metric_updates (
              *,
              order: recorded_at.desc
            )
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

  // Filtrar métricas por perspectiva
  const getFilteredObjectives = () => {
    if (activeTab === "all") return objectives;
    return objectives.filter(obj => 
      obj.perspective?.toLowerCase() === activeTab.toLowerCase()
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-primary" />
                Gestão de Métricas
              </h1>
              <p className="text-sm text-muted-foreground">
                {user?.email}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate("/dashboard")}>
                <Target className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <Button variant="outline" onClick={handleLogout} size="sm">
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
            <TabsTrigger value="clientes">Clientes</TabsTrigger>
            <TabsTrigger value="processos">Processos</TabsTrigger>
            <TabsTrigger value="crescimento">Crescimento</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-6">
            {filteredObjectives.length === 0 ? (
              <Card className="p-12">
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Nenhuma métrica encontrada
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {activeTab === "all" 
                      ? "Complete o planejamento estratégico para criar métricas"
                      : "Nenhuma métrica nesta perspectiva"}
                  </p>
                  <Button onClick={() => navigate("/planejamento")}>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Planejamento
                  </Button>
                </div>
              </Card>
            ) : (
              filteredObjectives.map((objective) => (
                <Card key={objective.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="mb-2">{objective.title}</CardTitle>
                        <CardDescription>{objective.description}</CardDescription>
                      </div>
                      <Badge variant="outline">
                        {objective.perspective || 'Geral'}
                      </Badge>
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
    </div>
  );
};

export default Metricas;
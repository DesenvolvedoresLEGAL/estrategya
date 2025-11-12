import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ObjectiveDetailCard } from "@/components/objectives/ObjectiveDetailCard";
import { InitiativesFilter, FilterState } from "@/components/objectives/InitiativesFilter";
import { Target, ArrowLeft, RefreshCw, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Objetivos() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [objectives, setObjectives] = useState<any[]>([]);
  const [filteredObjectives, setFilteredObjectives] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("todos");

  useEffect(() => {
    loadObjectives();
  }, []);

  const loadObjectives = async () => {
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/auth");
        return;
      }

      // Get company
      const { data: companies } = await supabase
        .from("companies")
        .select("id")
        .eq("owner_user_id", user.id)
        .limit(1)
        .single();

      if (!companies) {
        navigate("/");
        return;
      }

      // Get objectives with all related data
      const { data: objectivesData, error } = await supabase
        .from("strategic_objectives")
        .select(
          `
          *,
          initiatives (
            id,
            title,
            status,
            priority_quadrant,
            ice_score,
            impact_score,
            confidence_score,
            ease_score
          ),
          metrics (
            id,
            name,
            current_value,
            target
          ),
          objective_updates (
            id,
            status,
            progress_percentage,
            notes,
            created_at,
            updated_by
          )
        `,
        )
        .eq("company_id", companies.id)
        .order("priority", { ascending: true });

      if (error) throw error;

      // Sort updates by date (newest first)
      const formattedData =
        objectivesData?.map((obj) => ({
          ...obj,
          objective_updates: obj.objective_updates?.sort(
            (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
          ),
        })) || [];

      setObjectives(formattedData);
      setFilteredObjectives(formattedData);
    } catch (error: any) {
      console.error("Error loading objectives:", error);
      toast({
        title: "Erro ao carregar objetivos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterObjectives = (status?: string) => {
    if (!status || status === "todos") {
      setFilteredObjectives(objectives);
      return;
    }

    const filtered = objectives.filter((obj) => {
      const latestUpdate = obj.objective_updates?.[0];
      return latestUpdate?.status === status;
    });

    setFilteredObjectives(filtered);
  };

  const handleFilterChange = (filters: FilterState) => {
    let filtered = [...objectives];

    // Apply status filter from activeTab
    if (activeTab !== "todos") {
      filtered = filtered.filter((obj) => {
        const latestUpdate = obj.objective_updates?.[0];
        return latestUpdate?.status === activeTab;
      });
    }

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (obj) =>
          obj.title?.toLowerCase().includes(searchLower) ||
          obj.description?.toLowerCase().includes(searchLower) ||
          obj.initiatives?.some((ini: any) => ini.title?.toLowerCase().includes(searchLower)),
      );
    }

    // Apply ICE Score range filter (filter initiatives)
    filtered = filtered.map((obj) => ({
      ...obj,
      initiatives: obj.initiatives?.filter(
        (ini: any) => !ini.ice_score || (ini.ice_score >= filters.iceMin && ini.ice_score <= filters.iceMax),
      ),
    }));

    // Apply Who filter
    if (filters.who) {
      const whoLower = filters.who.toLowerCase();
      filtered = filtered.map((obj) => ({
        ...obj,
        initiatives: obj.initiatives?.filter((ini: any) => ini.who?.toLowerCase().includes(whoLower)),
      }));
    }

    // Apply 5W2H status filter
    if (filters.has5W2H !== "all") {
      filtered = filtered.map((obj) => ({
        ...obj,
        initiatives: obj.initiatives?.filter((ini: any) => {
          const has5W2H = ini.what && ini.why && ini.who;
          return filters.has5W2H === "complete" ? has5W2H : !has5W2H;
        }),
      }));
    }

    // Apply quadrant filter
    if (filters.quadrant !== "all") {
      filtered = filtered.map((obj) => ({
        ...obj,
        initiatives: obj.initiatives?.filter((ini: any) => ini.priority_quadrant === filters.quadrant),
      }));
    }

    setFilteredObjectives(filtered);
  };

  useEffect(() => {
    filterObjectives(activeTab);
  }, [activeTab, objectives]);

  const getStatusCount = (status: string) => {
    if (status === "todos") return objectives.length;

    return objectives.filter((obj) => {
      const latestUpdate = obj.objective_updates?.[0];
      return latestUpdate?.status === status;
    }).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando objetivos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Gestão de OKRs</h1>
            <p className="text-muted-foreground">Acompanhe e atualize seus objetivos estratégicos</p>
          </div>
          <Button onClick={loadObjectives}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>

        {/* Filtros Avançados */}
        <InitiativesFilter onFilterChange={handleFilterChange} />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
            <TabsTrigger value="todos" className="gap-2">
              Todos
              <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">{getStatusCount("todos")}</span>
            </TabsTrigger>
            <TabsTrigger value="em_andamento" className="gap-2">
              Em Andamento
              <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">{getStatusCount("em_andamento")}</span>
            </TabsTrigger>
            <TabsTrigger value="em_risco" className="gap-2">
              Em Risco
              <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">{getStatusCount("em_risco")}</span>
            </TabsTrigger>
            <TabsTrigger value="concluido" className="gap-2">
              Concluídos
              <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">{getStatusCount("concluido")}</span>
            </TabsTrigger>
            <TabsTrigger value="pausado" className="gap-2">
              Pausados
              <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">{getStatusCount("pausado")}</span>
            </TabsTrigger>
            <TabsTrigger value="nao_iniciado" className="gap-2">
              Não Iniciados
              <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">{getStatusCount("nao_iniciado")}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {filteredObjectives.length === 0 ? (
              <div className="text-center py-12">
                <Target className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Nenhum objetivo encontrado</h3>
                <p className="text-muted-foreground">
                  {activeTab === "todos"
                    ? "Crie seu primeiro planejamento estratégico para começar"
                    : "Nenhum objetivo com este status no momento"}
                </p>
                {activeTab === "todos" && (
                  <Button className="mt-4" onClick={() => navigate("/planejamento")}>
                    Criar Planejamento
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredObjectives.map((objective) => (
                  <ObjectiveDetailCard key={objective.id} objective={objective} onUpdate={loadObjectives} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

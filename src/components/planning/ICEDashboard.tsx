import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { ICEScoreChart } from "./ICEScoreChart";
import { ICERankingList } from "./ICERankingList";
import { ICEEvolutionChart } from "./ICEEvolutionChart";
import { InitiativeComparison } from "./InitiativeComparison";
import { BarChart3, TrendingUp, ArrowLeftRight, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ICEDashboardProps {
  companyId: string;
  initiatives: any[];
}

export const ICEDashboard = ({ companyId, initiatives }: ICEDashboardProps) => {
  const [selectedPerspective, setSelectedPerspective] = useState<string>("todas");
  const [filteredInitiatives, setFilteredInitiatives] = useState(initiatives);

  useEffect(() => {
    filterInitiatives();
  }, [selectedPerspective, initiatives]);

  const filterInitiatives = async () => {
    if (selectedPerspective === "todas") {
      setFilteredInitiatives(initiatives);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('initiatives')
        .select(`
          *,
          strategic_objectives (
            id,
            title,
            perspective,
            company_id
          )
        `)
        .eq('strategic_objectives.company_id', companyId)
        .eq('strategic_objectives.perspective', selectedPerspective)
        .not('ice_score', 'is', null);

      if (error) throw error;

      setFilteredInitiatives(data || []);
    } catch (error) {
      console.error('Erro ao filtrar iniciativas:', error);
      setFilteredInitiatives([]);
    }
  };

  const perspectiveOptions = [
    { value: "todas", label: "Todas as Perspectivas" },
    { value: "Financeira", label: "Financeira" },
    { value: "Clientes", label: "Clientes" },
    { value: "Processos", label: "Processos Internos" },
    { value: "Aprendizado", label: "Aprendizado e Crescimento" },
  ];

  const getStatsByPerspective = () => {
    const stats: Record<string, { count: number; avgICE: number }> = {
      Financeira: { count: 0, avgICE: 0 },
      Clientes: { count: 0, avgICE: 0 },
      Processos: { count: 0, avgICE: 0 },
      Aprendizado: { count: 0, avgICE: 0 },
    };

    initiatives.forEach((init: any) => {
      const perspective = init.strategic_objectives?.perspective;
      if (perspective && stats[perspective]) {
        stats[perspective].count++;
        stats[perspective].avgICE += init.ice_score || 0;
      }
    });

    // Calcular médias
    Object.keys(stats).forEach((key) => {
      if (stats[key].count > 0) {
        stats[key].avgICE = Math.round(stats[key].avgICE / stats[key].count);
      }
    });

    return stats;
  };

  const stats = getStatsByPerspective();

  const perspectiveColors: Record<string, string> = {
    Financeira: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
    Clientes: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
    Processos: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
    Aprendizado: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
  };

  return (
    <div className="space-y-6">
      {/* Filtro de Perspectiva */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              <CardTitle>Dashboard ICE Score</CardTitle>
            </div>
            <Select value={selectedPerspective} onValueChange={setSelectedPerspective}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Selecione uma perspectiva" />
              </SelectTrigger>
              <SelectContent>
                {perspectiveOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <CardDescription>
            {selectedPerspective === "todas"
              ? "Visão geral de todas as iniciativas"
              : `Iniciativas da perspectiva ${selectedPerspective}`}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Stats por Perspectiva BSC */}
      {selectedPerspective === "todas" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(stats).map(([perspective, data]) => (
            <Card key={perspective} className={`border ${perspectiveColors[perspective]}`}>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold mb-1">{data.count}</div>
                  <div className="text-xs text-muted-foreground mb-2">{perspective}</div>
                  {data.count > 0 && (
                    <Badge variant="outline" className="text-xs">
                      ICE médio: {data.avgICE}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tabs para diferentes visualizações */}
      <Tabs defaultValue="chart" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="chart">
            <BarChart3 className="h-4 w-4 mr-2" />
            Scatter
          </TabsTrigger>
          <TabsTrigger value="ranking">
            <TrendingUp className="h-4 w-4 mr-2" />
            Ranking
          </TabsTrigger>
          <TabsTrigger value="evolution">
            <TrendingUp className="h-4 w-4 mr-2" />
            Evolução
          </TabsTrigger>
          <TabsTrigger value="compare">
            <ArrowLeftRight className="h-4 w-4 mr-2" />
            Comparar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chart">
          <ICEScoreChart initiatives={filteredInitiatives} />
        </TabsContent>

        <TabsContent value="ranking">
          <Card>
            <CardHeader>
              <CardTitle>Ranking ICE Score</CardTitle>
              <CardDescription>
                {selectedPerspective === "todas"
                  ? "Todas as iniciativas ordenadas por ICE Score"
                  : `Iniciativas da perspectiva ${selectedPerspective}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ICERankingList initiatives={filteredInitiatives} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evolution">
          <ICEEvolutionChart
            companyId={companyId}
            perspective={selectedPerspective === "todas" ? undefined : selectedPerspective}
          />
        </TabsContent>

        <TabsContent value="compare">
          <InitiativeComparison companyId={companyId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowRight, ArrowDown } from "lucide-react";

interface InitiativeItem {
  initiative_index: number;
  titulo: string;
  impacto: string;
  esforco: string;
  justificativa: string;
}

interface MatrizProps {
  fazer_agora: InitiativeItem[];
  planejar: InitiativeItem[];
  oportunidades_rapidas: InitiativeItem[];
  evitar: InitiativeItem[];
}

export const MatrizImpactoEsforco = ({ fazer_agora, planejar, oportunidades_rapidas, evitar }: MatrizProps) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Fazer Agora - Alto Impacto, Baixo Esforço */}
        <Card className="p-6 border-2 border-green-500 bg-green-50 dark:bg-green-950">
          <div className="flex items-center gap-2 mb-4">
            <ArrowUp className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-bold text-green-700 dark:text-green-300">Fazer Agora</h3>
            <Badge variant="default" className="ml-auto">Prioridade 1</Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Alto impacto, baixo esforço</p>
          <div className="space-y-3">
            {fazer_agora.map((item, idx) => (
              <div key={idx} className="bg-white dark:bg-card p-3 rounded-lg">
                <h4 className="font-semibold text-sm mb-1">{item.titulo}</h4>
                <p className="text-xs text-muted-foreground">{item.justificativa}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Planejar - Alto Impacto, Alto Esforço */}
        <Card className="p-6 border-2 border-blue-500 bg-blue-50 dark:bg-blue-950">
          <div className="flex items-center gap-2 mb-4">
            <ArrowRight className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-blue-700 dark:text-blue-300">Planejar</h3>
            <Badge variant="secondary" className="ml-auto">Prioridade 2</Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Alto impacto, alto esforço</p>
          <div className="space-y-3">
            {planejar.map((item, idx) => (
              <div key={idx} className="bg-white dark:bg-card p-3 rounded-lg">
                <h4 className="font-semibold text-sm mb-1">{item.titulo}</h4>
                <p className="text-xs text-muted-foreground">{item.justificativa}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Oportunidades Rápidas - Médio Impacto, Baixo Esforço */}
        <Card className="p-6 border-2 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <div className="flex items-center gap-2 mb-4">
            <ArrowRight className="w-5 h-5 text-yellow-600" />
            <h3 className="text-lg font-bold text-yellow-700 dark:text-yellow-300">Oportunidades Rápidas</h3>
            <Badge variant="outline" className="ml-auto">Prioridade 3</Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Médio impacto, baixo esforço</p>
          <div className="space-y-3">
            {oportunidades_rapidas.map((item, idx) => (
              <div key={idx} className="bg-white dark:bg-card p-3 rounded-lg">
                <h4 className="font-semibold text-sm mb-1">{item.titulo}</h4>
                <p className="text-xs text-muted-foreground">{item.justificativa}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Evitar - Baixo Impacto */}
        <Card className="p-6 border-2 border-gray-300 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center gap-2 mb-4">
            <ArrowDown className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300">Evitar ou Deixar para Depois</h3>
            <Badge variant="outline" className="ml-auto">Baixa prioridade</Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Baixo impacto</p>
          <div className="space-y-3">
            {evitar.map((item, idx) => (
              <div key={idx} className="bg-white dark:bg-card p-3 rounded-lg">
                <h4 className="font-semibold text-sm mb-1">{item.titulo}</h4>
                <p className="text-xs text-muted-foreground">{item.justificativa}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

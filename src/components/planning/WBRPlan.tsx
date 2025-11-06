import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, Zap, BarChart3, Calendar } from "lucide-react";

interface WBRData {
  mci: string;
  acoes_semanais: Array<{
    titulo: string;
    descricao: string;
    metrica_impacto: string;
  }>;
  placar: {
    metricas: Array<{
      nome: string;
      meta: string;
      frequencia: string;
    }>;
  };
  cadencia: {
    reuniao_tipo: string;
    frequencia: string;
    duracao?: string;
    participantes_sugeridos: string;
    pauta: string;
  };
}

interface WBRPlanProps {
  wbr: WBRData;
}

export const WBRPlan = ({ wbr }: WBRPlanProps) => {
  return (
    <div className="space-y-6">
      {/* MCI - Meta Crucialmente Importante */}
      <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20">
        <div className="flex items-start gap-3">
          <Target className="w-8 h-8 text-primary mt-1" />
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Meta Crucialmente Importante (12 semanas)
            </h3>
            <p className="text-xl font-bold text-foreground">{wbr.mci}</p>
          </div>
        </div>
      </Card>

      {/* Ações Semanais de Alavanca */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold">Ações Semanais de Alavanca</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {wbr.acoes_semanais.map((acao, idx) => (
            <Card key={idx} className="p-4">
              <Badge className="mb-2">Ação {idx + 1}</Badge>
              <h4 className="font-semibold mb-2">{acao.titulo}</h4>
              <p className="text-sm text-muted-foreground mb-2">{acao.descricao}</p>
              <div className="text-xs font-medium text-primary bg-primary/10 p-2 rounded">
                Métrica: {acao.metrica_impacto}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Placar Visível */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold">Placar Visível</h3>
        </div>
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {wbr.placar.metricas.map((metrica, idx) => (
              <div key={idx} className="p-3 bg-muted/50 rounded-lg">
                <h4 className="font-semibold text-sm mb-1">{metrica.nome}</h4>
                <p className="text-lg font-bold text-primary mb-1">{metrica.meta}</p>
                <Badge variant="outline" className="text-xs">{metrica.frequencia}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Cadência de Responsabilidade */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold">Cadência de Responsabilidade</h3>
        </div>
        <Card className="p-4">
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground mb-1">Tipo de Reunião</h4>
              <p className="font-medium">{wbr.cadencia.reuniao_tipo}</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground mb-1">Frequência</h4>
              <p>{wbr.cadencia.frequencia}</p>
              {wbr.cadencia.duracao && (
                <Badge variant="outline" className="mt-1">{wbr.cadencia.duracao}</Badge>
              )}
            </div>
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground mb-1">Participantes Sugeridos</h4>
              <p className="text-sm">{wbr.cadencia.participantes_sugeridos}</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground mb-1">Pauta da Reunião</h4>
              <div className="text-sm text-muted-foreground whitespace-pre-line bg-muted/50 p-3 rounded">
                {wbr.cadencia.pauta}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

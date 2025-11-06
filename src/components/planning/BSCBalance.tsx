import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BSCPerspective {
  coberto: boolean;
  itens: string[];
  sugestao: string | null;
}

interface BSCData {
  financas: BSCPerspective;
  clientes: BSCPerspective;
  processos: BSCPerspective;
  aprendizado: BSCPerspective;
  explicacao: string;
}

interface BSCBalanceProps {
  bsc: BSCData;
  onAddSuggestion?: (perspectiva: string, sugestao: string) => void;
}

export const BSCBalance = ({ bsc, onAddSuggestion }: BSCBalanceProps) => {
  const perspectives = [
    { key: 'financas', label: 'Finanças', data: bsc.financas },
    { key: 'clientes', label: 'Clientes', data: bsc.clientes },
    { key: 'processos', label: 'Processos Internos', data: bsc.processos },
    { key: 'aprendizado', label: 'Aprendizado e Crescimento', data: bsc.aprendizado },
  ];

  return (
    <div className="space-y-6">
      {/* Explicação */}
      <Card className="p-6 bg-muted/50">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-primary mt-1" />
          <div>
            <h4 className="font-semibold mb-2">Por que o equilíbrio é importante?</h4>
            <p className="text-sm text-muted-foreground">{bsc.explicacao}</p>
          </div>
        </div>
      </Card>

      {/* Perspectivas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {perspectives.map((perspective) => (
          <Card key={perspective.key} className="p-4">
            <div className="flex items-center gap-2 mb-3">
              {perspective.data.coberto ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-orange-600" />
              )}
              <h4 className="font-semibold">{perspective.label}</h4>
              <Badge variant={perspective.data.coberto ? "default" : "secondary"} className="ml-auto">
                {perspective.data.coberto ? "Coberto" : "Descoberto"}
              </Badge>
            </div>

            {perspective.data.itens.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-muted-foreground mb-2">Itens existentes:</p>
                <ul className="text-sm space-y-1">
                  {perspective.data.itens.map((item, idx) => (
                    <li key={idx} className="text-xs">• {item}</li>
                  ))}
                </ul>
              </div>
            )}

            {perspective.data.sugestao && (
              <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-950 rounded-lg border border-orange-200 dark:border-orange-800">
                <p className="text-xs font-medium text-orange-800 dark:text-orange-200 mb-2">
                  Sugestão para cobrir essa perspectiva:
                </p>
                <p className="text-sm text-orange-900 dark:text-orange-100 mb-3">
                  {perspective.data.sugestao}
                </p>
                {onAddSuggestion && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onAddSuggestion(perspective.key, perspective.data.sugestao!)}
                  >
                    Adicionar KR Sugerido
                  </Button>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

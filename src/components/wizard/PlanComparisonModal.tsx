import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, ArrowRight, Crown, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PlanComparisonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTier: "free" | "pro" | "enterprise";
  blockedFeature: string;
}

export const PlanComparisonModal = ({ open, onOpenChange, currentTier, blockedFeature }: PlanComparisonModalProps) => {
  const navigate = useNavigate();

  const features = [
    {
      name: "Objetivos Estratégicos",
      free: "Até 3",
      pro: "Ilimitados",
      enterprise: "Ilimitados",
    },
    {
      name: "Iniciativas por Objetivo",
      free: "Até 5",
      pro: "Ilimitadas",
      enterprise: "Ilimitadas",
    },
    {
      name: "Geração com IA",
      free: false,
      pro: true,
      enterprise: true,
    },
    {
      name: "Frameworks Avançados",
      free: false,
      pro: "OGSM, OKR, BSC, ICE",
      enterprise: "OGSM, OKR, BSC, ICE",
    },
    {
      name: "Matriz Priorização",
      free: false,
      pro: true,
      enterprise: true,
    },
    {
      name: "Plano de Execução 4DX",
      free: false,
      pro: true,
      enterprise: true,
    },
    {
      name: "Métricas e KPIs",
      free: "Básico",
      pro: "Avançado",
      enterprise: "Avançado + IA",
    },
    {
      name: "Exportação PDF",
      free: "Com marca d'água",
      pro: "Sem marca d'água",
      enterprise: "Premium",
    },
    {
      name: "Membros da Equipe",
      free: "1",
      pro: "10",
      enterprise: "Ilimitado",
    },
    {
      name: "Audit Log",
      free: false,
      pro: false,
      enterprise: true,
    },
    {
      name: "Permissões Avançadas",
      free: false,
      pro: false,
      enterprise: true,
    },
  ];

  const renderFeatureValue = (value: any) => {
    if (typeof value === "boolean") {
      return value ? (
        <Check className="w-4 h-4 text-success mx-auto" />
      ) : (
        <X className="w-4 h-4 text-muted-foreground mx-auto" />
      );
    }
    return <span className="text-sm">{value}</span>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            Desbloqueie Recursos Premium
          </DialogTitle>
          <DialogDescription>
            Você está tentando acessar: <strong>{blockedFeature}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Plan Badge */}
          <div className="flex items-center justify-center gap-3 pb-4 border-b">
            <span className="text-sm text-muted-foreground">Seu plano atual:</span>
            <Badge variant={currentTier === "free" ? "secondary" : currentTier === "pro" ? "default" : "outline"} className="text-sm">
              {currentTier === "free" ? "FREE" : currentTier === "pro" ? "PRO" : "ENTERPRISE"}
            </Badge>
          </div>

          {/* Comparison Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Recurso</th>
                  <th className="text-center py-3 px-4">
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-medium">FREE</span>
                      <span className="text-xs text-muted-foreground">R$ 0</span>
                    </div>
                  </th>
                  <th className="text-center py-3 px-4 bg-primary/5 rounded-t-lg">
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-1">
                        <Crown className="w-4 h-4 text-primary" />
                        <span className="font-medium">PRO</span>
                      </div>
                      <span className="text-xs text-muted-foreground">R$ 97/mês</span>
                    </div>
                  </th>
                  <th className="text-center py-3 px-4">
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-medium">ENTERPRISE</span>
                      <span className="text-xs text-muted-foreground">Sob consulta</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {features.map((feature, index) => (
                  <tr key={index} className={`border-b ${index % 2 === 0 ? "bg-muted/20" : ""}`}>
                    <td className="py-3 px-4 text-sm font-medium">{feature.name}</td>
                    <td className="py-3 px-4 text-center">{renderFeatureValue(feature.free)}</td>
                    <td className="py-3 px-4 text-center bg-primary/5">{renderFeatureValue(feature.pro)}</td>
                    <td className="py-3 px-4 text-center">{renderFeatureValue(feature.enterprise)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            {currentTier === "free" && (
              <>
                <Button
                  onClick={() => {
                    navigate("/pricing");
                    onOpenChange(false);
                  }}
                  size="lg"
                  className="flex-1"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Fazer Upgrade para PRO
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  size="lg"
                  className="flex-1"
                >
                  Continuar com Free
                </Button>
              </>
            )}
            {currentTier === "pro" && (
              <>
                <Button
                  onClick={() => {
                    window.location.href = "https://enterprise.lovable.dev/";
                  }}
                  size="lg"
                  className="flex-1"
                >
                  Falar com Vendas (Enterprise)
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  size="lg"
                  className="flex-1"
                >
                  Voltar
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
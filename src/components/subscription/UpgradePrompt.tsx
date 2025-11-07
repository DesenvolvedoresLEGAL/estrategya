import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Zap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface UpgradePromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: string;
  limitType?: "objectives" | "initiatives" | "team_members" | "plans" | "companies" | "export_pdf";
}

export const UpgradePrompt = ({ open, onOpenChange, feature, limitType }: UpgradePromptProps) => {
  const { data: plans } = useQuery({
    queryKey: ["subscription-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .order("price_monthly", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const getLimitMessage = () => {
    switch (limitType) {
      case "objectives":
        return "Você atingiu o limite de objetivos do seu plano atual.";
      case "initiatives":
        return "Você atingiu o limite de iniciativas por objetivo.";
      case "team_members":
        return "Você atingiu o limite de membros da equipe.";
      case "plans":
        return "Você atingiu o limite de planos/cenários estratégicos ativos.";
      case "companies":
        return "Você atingiu o limite de empresas do seu plano atual.";
      case "export_pdf":
        return "A exportação em PDF não está disponível no seu plano.";
      default:
        return `A funcionalidade "${feature}" não está disponível no seu plano.`;
    }
  };

  const handleUpgrade = (planId: string, tier: string) => {
    if (tier === "business") {
      // Para Enterprise, abrir contato ao invés de checkout
      window.open("https://legal.team/contato", "_blank");
      return;
    }

    // Para outros planos, seguir com checkout
    supabase.functions.invoke("create-checkout-session", {
      body: { planId },
    }).then(({ data, error }) => {
      if (error) {
        console.error("Error creating checkout session:", error);
        return;
      }
      if (data?.url) {
        window.location.href = data.url;
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Upgrade seu Plano
          </DialogTitle>
          <DialogDescription>{getLimitMessage()}</DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-3 gap-4 mt-6">
          {plans?.map((plan) => {
            const features = plan.features as string[];
            const limits = plan.limits as Record<string, any>;
            const isPro = plan.tier === "pro";
            const isEnterprise = plan.tier === "business";

            return (
              <div
                key={plan.id}
                className={`border rounded-lg p-6 relative ${
                  isPro ? "border-primary shadow-lg" : ""
                }`}
              >
                {isPro && (
                  <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary">
                    Mais Popular
                  </Badge>
                )}

                <div className="mb-4">
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <div className="mt-2">
                    {plan.price_monthly !== null ? (
                      <>
                        <span className="text-3xl font-bold">
                          R$ {plan.price_monthly?.toFixed(2)}
                        </span>
                        <span className="text-muted-foreground">/mês</span>
                      </>
                    ) : (
                      <span className="text-2xl font-bold">Sob consulta</span>
                    )}
                  </div>
                  {plan.price_annual && (
                    <p className="text-sm text-muted-foreground mt-1">
                      ou R$ {plan.price_annual.toFixed(2)}/ano (economize{" "}
                      {Math.round(
                        ((plan.price_monthly * 12 - plan.price_annual) /
                          (plan.price_monthly * 12)) *
                          100
                      )}
                      %)
                    </p>
                  )}
                </div>

                <ul className="space-y-2 mb-6">
                  {features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                <div className="space-y-2 text-xs text-muted-foreground mb-6">
                  <p>
                    Empresas:{" "}
                    {limits.max_companies === -1 ? "Ilimitadas" : limits.max_companies}
                  </p>
                  <p>
                    Planos/Cenários:{" "}
                    {limits.max_plans === -1 ? "Ilimitados" : limits.max_plans}
                  </p>
                  <p>
                    Objetivos:{" "}
                    {limits.max_objectives === -1 ? "Ilimitados" : limits.max_objectives}
                  </p>
                  <p>
                    Membros:{" "}
                    {limits.max_team_members === -1 ? "Ilimitados" : limits.max_team_members}
                  </p>
                </div>

                <Button
                  onClick={() => handleUpgrade(plan.id, plan.tier)}
                  className="w-full"
                  variant={isPro ? "default" : "outline"}
                  disabled={plan.tier === "free"}
                >
                  {plan.tier === "free" 
                    ? "Plano Atual" 
                    : isEnterprise 
                    ? "Falar com a LEGAL" 
                    : "Fazer Upgrade"}
                </Button>
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-semibold mb-2">Comparação de Recursos</h4>
          <div className="grid grid-cols-4 gap-2 text-sm">
            <div className="font-medium">Recurso</div>
            <div className="font-medium text-center">Free</div>
            <div className="font-medium text-center">Pro</div>
            <div className="font-medium text-center">Enterprise</div>

            <div>Exportar PDF</div>
            <div className="text-center"><X className="h-4 w-4 mx-auto text-destructive" /></div>
            <div className="text-center"><Check className="h-4 w-4 mx-auto text-primary" /></div>
            <div className="text-center"><Check className="h-4 w-4 mx-auto text-primary" /></div>

            <div>ICE Score</div>
            <div className="text-center"><X className="h-4 w-4 mx-auto text-destructive" /></div>
            <div className="text-center"><Check className="h-4 w-4 mx-auto text-primary" /></div>
            <div className="text-center"><Check className="h-4 w-4 mx-auto text-primary" /></div>

            <div>5W2H Completo</div>
            <div className="text-center"><X className="h-4 w-4 mx-auto text-destructive" /></div>
            <div className="text-center"><Check className="h-4 w-4 mx-auto text-primary" /></div>
            <div className="text-center"><Check className="h-4 w-4 mx-auto text-primary" /></div>

            <div>Execução 4DX</div>
            <div className="text-center"><X className="h-4 w-4 mx-auto text-destructive" /></div>
            <div className="text-center"><Check className="h-4 w-4 mx-auto text-primary" /></div>
            <div className="text-center"><Check className="h-4 w-4 mx-auto text-primary" /></div>

            <div>Templates</div>
            <div className="text-center"><X className="h-4 w-4 mx-auto text-destructive" /></div>
            <div className="text-center"><Check className="h-4 w-4 mx-auto text-primary" /></div>
            <div className="text-center"><Check className="h-4 w-4 mx-auto text-primary" /></div>

            <div>Integrações</div>
            <div className="text-center"><X className="h-4 w-4 mx-auto text-destructive" /></div>
            <div className="text-center"><X className="h-4 w-4 mx-auto text-destructive" /></div>
            <div className="text-center"><Check className="h-4 w-4 mx-auto text-primary" /></div>

            <div>Colaboração</div>
            <div className="text-center"><X className="h-4 w-4 mx-auto text-destructive" /></div>
            <div className="text-center"><Check className="h-4 w-4 mx-auto text-primary" /></div>
            <div className="text-center"><Check className="h-4 w-4 mx-auto text-primary" /></div>

            <div>Branding Custom</div>
            <div className="text-center"><X className="h-4 w-4 mx-auto text-destructive" /></div>
            <div className="text-center"><X className="h-4 w-4 mx-auto text-destructive" /></div>
            <div className="text-center"><Check className="h-4 w-4 mx-auto text-primary" /></div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

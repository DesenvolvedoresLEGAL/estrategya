import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Zap, Sparkles, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface UpgradePromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: string;
  limitType?: "objectives" | "initiatives" | "team_members" | "plans" | "companies" | "export_pdf";
}

export const UpgradePrompt = ({ open, onOpenChange, feature, limitType }: UpgradePromptProps) => {
  const navigate = useNavigate();
  const { trackUpgradeClicked, trackLimitReached, trackPricingViewed } = useAnalytics();
  const [currentTier, setCurrentTier] = useState<string>("free");

  useEffect(() => {
    if (open) {
      trackLimitReached(limitType || feature || "unknown", currentTier, feature);
      loadCurrentTier();
    }
  }, [open]);

  const loadCurrentTier = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: companies } = await supabase
        .from('companies')
        .select('id')
        .eq('owner_user_id', user.id)
        .limit(1)
        .single();

      if (companies) {
        const { data: subscription } = await supabase
          .from('company_subscriptions')
          .select('*, plan:subscription_plans(*)')
          .eq('company_id', companies.id)
          .eq('status', 'active')
          .single();

        if (subscription?.plan) {
          setCurrentTier(subscription.plan.tier);
        }
      }
    } catch (error) {
      console.error('Error loading current tier:', error);
    }
  };

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
    const messages: Record<string, { title: string; description: string; benefits: string[] }> = {
      objectives: {
        title: "Limite de Objetivos Atingido",
        description: "Você atingiu o limite de 3 objetivos do plano FREE. Faça upgrade para criar objetivos ilimitados.",
        benefits: [
          "Objetivos estratégicos ilimitados",
          "Múltiplas perspectivas BSC",
          "Análise de maturidade completa"
        ]
      },
      initiatives: {
        title: "Limite de Iniciativas Atingido",
        description: "Você atingiu o limite de 3 iniciativas por objetivo. Faça upgrade para criar iniciativas ilimitadas.",
        benefits: [
          "Iniciativas ilimitadas por objetivo",
          "ICE Score para priorização",
          "5W2H detalhado para cada iniciativa"
        ]
      },
      companies: {
        title: "Limite de Empresas Atingido",
        description: "Seu plano atual permite apenas 1 empresa. Atualize para o Enterprise para gerenciar múltiplos workspaces.",
        benefits: [
          "Workspaces ilimitados no Enterprise",
          "Gestão multi-empresa unificada",
          "Relatórios consolidados e permissões avançadas"
        ]
      },
      team_members: {
        title: "Limite de Membros Atingido",
        description: "Você atingiu o limite de membros da equipe do seu plano.",
        benefits: [
          "Mais membros na equipe",
          "Gestão de permissões avançada",
          "Colaboração em tempo real"
        ]
      },
      plans: {
        title: "Limite de Planos OGSM Atingido",
        description: "Você atingiu o limite de planos estratégicos ativos do seu plano.",
        benefits: [
          "Até 3 planos ativos simultâneos no PRO",
          "Planos ilimitados no Enterprise",
          "Comparação e histórico completo"
        ]
      },
      export_pdf: {
        title: "Exportação PDF Premium",
        description: "Remova a marca d'água com o plano PRO e libere exportações premium com branding no Enterprise.",
        benefits: [
          "PDF profissional sem marca d'água (PRO)",
          "Exportações ilimitadas",
          "Branding e layouts premium (Enterprise)"
        ]
      }
    };

    const config = messages[limitType || ""] || {
      title: `Feature ${feature} Bloqueada`,
      description: `A funcionalidade "${feature}" não está disponível no plano FREE.`,
      benefits: [
        "Acesso completo a features premium",
        "Suporte prioritário",
        "Atualizações exclusivas"
      ]
    };

    return config;
  };

  const handleUpgrade = (planId: string, tier: string, planName: string) => {
    trackUpgradeClicked(currentTier, feature || limitType || "unknown", "upgrade_modal");

    if (tier === "enterprise") {
      window.open("https://legal.team/contato", "_blank");
      return;
    }

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

  const handleViewPricing = () => {
    trackPricingViewed('upgrade_modal');
    onOpenChange(false);
    navigate('/pricing');
  };

  const messageConfig = getLimitMessage();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="h-6 w-6 text-primary" />
            {messageConfig.title}
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            {messageConfig.description}
          </DialogDescription>
        </DialogHeader>

        {/* Benefits Section */}
        <div className="my-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">O que você ganha com o upgrade:</h3>
          </div>
          <ul className="space-y-2">
            {messageConfig.benefits.map((benefit, index) => (
              <li key={index} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span className="text-sm">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-6">
          {plans?.map((plan) => {
            const features = plan.features as string[];
            const limits = plan.limits as Record<string, any>;
            const isPro = plan.tier === "pro";
            const isEnterprise = plan.tier === "enterprise";

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
                  onClick={() => handleUpgrade(plan.id, plan.tier, plan.name)}
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

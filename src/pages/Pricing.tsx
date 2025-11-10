import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Zap, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useQuery } from "@tanstack/react-query";

export default function Pricing() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { trackPricingViewed, trackUpgradeClicked } = useAnalytics();
  const [currentTier, setCurrentTier] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | undefined>();

  useEffect(() => {
    trackPricingViewed('direct_page');
    loadCurrentPlan();
  }, []);

  const loadCurrentPlan = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCurrentTier(null);
        return;
      }

      const { data: companies } = await supabase
        .from('companies')
        .select('id')
        .eq('owner_user_id', user.id)
        .limit(1)
        .single();

      if (companies) {
        setCompanyId(companies.id);
        
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
      console.error('Error loading current plan:', error);
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

  const handleUpgrade = (planId: string, tier: string, planName: string) => {
    trackUpgradeClicked(currentTier, planName, 'pricing_page');

    if (tier === "enterprise") {
      window.open("https://legal.team/contato", "_blank");
      return;
    }

    supabase.functions.invoke("create-checkout-session", {
      body: { planId },
    }).then(({ data, error }) => {
      if (error) {
        console.error("Error creating checkout session:", error);
        toast({
          title: "Erro ao iniciar checkout",
          description: "Tente novamente mais tarde",
          variant: "destructive"
        });
        return;
      }
      if (data?.url) {
        window.location.href = data.url;
      }
    });
  };

  const featureComparison = [
    { name: "Empresas", free: "1", pro: "1", enterprise: "Ilimitadas" },
    { name: "Planos Estratégicos Ativos", free: "1", pro: "3", enterprise: "Ilimitados" },
    { name: "Objetivos Estratégicos", free: "3", pro: "Ilimitados", enterprise: "Ilimitados" },
    { name: "Iniciativas por Objetivo", free: "5", pro: "Ilimitadas", enterprise: "Ilimitadas" },
    { name: "Membros da Equipe", free: "1", pro: "3", enterprise: "Ilimitados" },
    { name: "IA Avançada", free: "Básica", pro: "Completa", enterprise: "Completa" },
    { name: "Templates Prontos", free: false, pro: true, enterprise: true },
    { name: "Templates Customizados", free: false, pro: false, enterprise: true },
    { name: "Exportação PDF", free: "Com marca d'água", pro: "Sem marca d'água", enterprise: "Premium" },
    { name: "ICE Score", free: false, pro: true, enterprise: true },
    { name: "5W2H Detalhado", free: false, pro: true, enterprise: true },
    { name: "4DX/WBR Execution", free: false, pro: true, enterprise: true },
    { name: "Dashboard Completo", free: "Básico", pro: "Completo", enterprise: "Completo" },
    { name: "Colaboração em Tempo Real", free: false, pro: true, enterprise: true },
    { name: "Integrações Externas", free: false, pro: false, enterprise: true },
    { name: "Histórico e Audit Log", free: false, pro: false, enterprise: true },
    { name: "Permissões Avançadas", free: false, pro: false, enterprise: true },
    { name: "Branding Personalizado", free: false, pro: false, enterprise: true },
    { name: "Suporte", free: "Email", pro: "Prioritário", enterprise: "Dedicado" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Header */}
        <div className="mb-12">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          
          <div className="text-center px-4">
            {currentTier && (
              <Badge className="mb-3 sm:mb-4" variant="secondary">
                Plano Atual: {currentTier.toUpperCase()}
              </Badge>
            )}
            <h1 className="heading-2 mb-3 sm:mb-4">
              Escolha o Plano Ideal
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Comece gratuitamente e escale conforme sua estratégia cresce
            </p>
          </div>
        </div>

        {/* Pricing Cards - Mobile Optimized */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16">
          {plans?.map((plan) => {
            const features = plan.features as string[];
            const limits = plan.limits as Record<string, any>;
            const isPro = plan.tier === "pro";
            const isEnterprise = plan.tier === "enterprise";
            const isCurrent = plan.tier === currentTier;

            return (
              <Card
                key={plan.id}
                className={`relative ${
                  isPro ? "border-primary border-2 shadow-xl" : ""
                } ${isCurrent ? "bg-primary/5" : ""}`}
              >
                {isPro && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                    Mais Popular
                  </Badge>
                )}
                {isCurrent && (
                  <Badge className="absolute -top-3 right-4 bg-green-500">
                    Plano Atual
                  </Badge>
                )}
                
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription className="min-h-[3rem]">
                    {plan.tier === "free" && "Para começar seu planejamento"}
                    {plan.tier === "pro" && "Para times que executam estratégia"}
                    {plan.tier === "enterprise" && "Para organizações avançadas"}
                  </CardDescription>
                  <div className="mt-4">
                    {plan.price_monthly ? (
                      <>
                        <span className="text-4xl font-bold">
                          R$ {plan.price_monthly}
                        </span>
                        <span className="text-muted-foreground">/mês</span>
                        {plan.price_annual && (
                          <p className="text-sm text-muted-foreground mt-1">
                            ou R$ {plan.price_annual}/ano (economize{" "}
                            {Math.round(((plan.price_monthly * 12 - plan.price_annual) / (plan.price_monthly * 12)) * 100)}%)
                          </p>
                        )}
                      </>
                    ) : (
                      <span className="text-4xl font-bold">
                        {plan.tier === "free" ? "Grátis" : "Sob consulta"}
                      </span>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  <Button
                    className="w-full mb-6"
                    variant={isPro ? "default" : "outline"}
                    disabled={isCurrent}
                    onClick={() => handleUpgrade(plan.id, plan.tier, plan.name)}
                  >
                    {isCurrent ? "Plano Atual" : isEnterprise ? "Falar com Vendas" : "Fazer Upgrade"}
                  </Button>

                  <div className="space-y-3">
                    <p className="font-semibold text-sm mb-2">Principais recursos:</p>
                    {features.slice(0, 6).map((feature, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                    
                    <div className="pt-4 border-t">
                      <p className="font-semibold text-sm mb-2">Limites:</p>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>• {limits.max_companies >= 999999 ? "Empresas ilimitadas" : `${limits.max_companies} empresa(s)`}</p>
                        <p>• {limits.max_objectives >= 999999 ? "Objetivos ilimitados" : `${limits.max_objectives} objetivos`}</p>
                        <p>• {limits.max_team_members >= 999999 ? "Time ilimitado" : `${limits.max_team_members} membros`}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Feature Comparison Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Comparação Completa de Recursos</CardTitle>
            <CardDescription>Veja todas as diferenças entre os planos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Recurso</th>
                    <th className="text-center py-3 px-4 font-semibold">FREE</th>
                    <th className="text-center py-3 px-4 font-semibold bg-primary/5">PRO</th>
                    <th className="text-center py-3 px-4 font-semibold">ENTERPRISE</th>
                  </tr>
                </thead>
                <tbody>
                  {featureComparison.map((feature, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium">{feature.name}</td>
                      <td className="py-3 px-4 text-center">
                        {typeof feature.free === 'boolean' ? (
                          feature.free ? (
                            <Check className="h-5 w-5 text-green-500 mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-muted-foreground mx-auto" />
                          )
                        ) : (
                          <span className="text-sm">{feature.free}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center bg-primary/5">
                        {typeof feature.pro === 'boolean' ? (
                          feature.pro ? (
                            <Check className="h-5 w-5 text-green-500 mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-muted-foreground mx-auto" />
                          )
                        ) : (
                          <span className="text-sm font-medium">{feature.pro}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {typeof feature.enterprise === 'boolean' ? (
                          feature.enterprise ? (
                            <Check className="h-5 w-5 text-green-500 mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-muted-foreground mx-auto" />
                          )
                        ) : (
                          <span className="text-sm">{feature.enterprise}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Ainda tem dúvidas?</h2>
          <p className="text-muted-foreground mb-6">
            Nossa equipe está pronta para ajudar você a escolher o melhor plano
          </p>
          <Button variant="outline" onClick={() => window.open("https://legal.team/contato", "_blank")}>
            Falar com Especialista
          </Button>
        </div>
      </div>
    </div>
  );
}
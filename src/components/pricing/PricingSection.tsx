import { PricingCard } from "./PricingCard";
import { useNavigate } from "react-router-dom";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

export const PricingSection = () => {
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: company } = useQuery({
    queryKey: ["user-company", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("companies")
        .select("id")
        .eq("owner_user_id", user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const { tier } = useSubscriptionLimits(company?.id);

  const handleFreePlan = () => {
    if (user) {
      navigate("/planejamento");
    } else {
      navigate("/auth");
    }
  };

  const handleProPlan = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (!company?.id) {
      toast.error("Empresa não encontrada. Por favor, complete o cadastro.");
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("create-abacatepay-checkout", {
        body: { 
          planTier: "pro",
          companyId: company.id
        },
      });

      if (error) {
        console.error("Error creating checkout:", error);
        throw error;
      }

      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        toast.error("Erro ao gerar link de pagamento. Tente novamente.");
      }
    } catch (error) {
      console.error("Error creating checkout:", error);
      toast.error("Erro ao processar upgrade. Tente novamente.");
    }
  };

  const handleEnterprisePlan = () => {
    window.open("https://legal.team/contato", "_blank");
  };

  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Escolha o plano ideal para você
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Do teste gratuito ao suporte dedicado, temos o plano perfeito para sua estratégia.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <PricingCard
            title="Free"
            subtitle="Para testar o método"
            description="Monte seu primeiro planejamento estratégico com IA."
            features={[
              "Wizard completo (contexto + diagnóstico)",
              "SWOT + PESTEL",
              "1 plano estratégico salvo",
              "Dashboard básico",
              "IA básica (análise e objetivos)",
              "Exportação em PDF com marca d'água",
              "Sem integrações",
            ]}
            buttonText="Começar grátis"
            onButtonClick={handleFreePlan}
            price={null}
            currentTier={user ? tier : undefined}
          />

          <PricingCard
            title="Pro"
            subtitle="Para empresas que vão usar de verdade"
            description="Mais planos, IA avançada e templates prontos."
            features={[
              "1 empresa",
              "Até 3 planos estratégicos ativos",
              "3 membros da equipe",
              "IA avançada (insights, 5W2H, sugestões)",
              "Templates prontos por área",
              "Dashboard completo",
              "Exportação em PDF",
              "ICE Score e priorização",
              "Métricas por perspectiva BSC",
              "4DX/WBR para execução",
            ]}
            buttonText="Liberar PRO"
            onButtonClick={handleProPlan}
            isRecommended
            price={{ monthly: 199.90, annual: 1990 }}
            currentTier={user ? tier : undefined}
          />

          <PricingCard
            title="Enterprise"
            subtitle="Para times, consultorias e escala"
            description="Tudo do PRO + controle, integrações e histórico."
            features={[
              "Múltiplas empresas/workspaces",
              "Planos ilimitados",
              "Time ilimitado",
              "Múltiplos usuários e permissões",
              "Integrações externas",
              "Histórico e log de mudanças",
              "Templates próprios do cliente",
              "Branding personalizado",
              "Relatórios customizados e exportações premium",
              "Suporte dedicado + SLA",
            ]}
            buttonText="Falar com a LEGAL"
            onButtonClick={handleEnterprisePlan}
            price={{ monthly: 999.90, annual: 9990 }}
            currentTier={user ? tier : undefined}
          />
        </div>
      </div>
    </section>
  );
};

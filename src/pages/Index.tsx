import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Target, TrendingUp, Users, Zap } from "lucide-react";
import { PricingSection } from "@/components/pricing/PricingSection";

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section - Mobile Optimized */}
      <div className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <div className="relative max-w-7xl mx-auto container-padding section-padding">
          <div className="text-center text-primary-foreground">
            <h1 className="heading-1 mb-4 sm:mb-6 animate-fade-in">Estrategya Planner OS</h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 sm:mb-8 opacity-90 max-w-3xl mx-auto leading-relaxed px-2">
              Planejamento estratégico de classe mundial em minutos, não semanas. Baseado em frameworks usados pelas
              melhores empresas do mundo.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
              <Button
                size="lg"
                variant="secondary"
                onClick={() => navigate(user ? "/planejamento" : "/auth")}
                className="text-base sm:text-lg px-6 sm:px-8 w-full sm:w-auto touch-target"
              >
                {user ? "Continuar Planejamento" : "Começar Agora"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section - Mobile Optimized */}
      <div className="max-w-7xl mx-auto container-padding section-padding">
        <div className="text-center mb-12 sm:mb-16 px-4">
          <h2 className="heading-3 mb-3 sm:mb-4">Estratégia que funciona na prática</h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Responda poucas perguntas e receba um plano completo com objetivos, iniciativas e métricas
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          <div className="bg-card p-4 sm:p-6 rounded-lg sm:rounded-xl shadow-lg border border-border hover:shadow-xl transition-shadow">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
              <Target className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2">IA Estratégica</h3>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Análise com frameworks OKR, BSC e OGSM em linguagem simples
            </p>
          </div>

          <div className="bg-card p-4 sm:p-6 rounded-lg sm:rounded-xl shadow-lg border border-border hover:shadow-xl transition-shadow">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-success/10 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-success" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2">Objetivos Claros</h3>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              De visão a execução em 5 passos guiados
            </p>
          </div>

          <div className="bg-card p-4 sm:p-6 rounded-lg sm:rounded-xl shadow-lg border border-border hover:shadow-xl transition-shadow">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2">Execução em Equipe</h3>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Responsáveis, prazos e métricas integrados
            </p>
          </div>

          <div className="bg-card p-4 sm:p-6 rounded-lg sm:rounded-xl shadow-lg border border-border hover:shadow-xl transition-shadow">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-warning/10 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
              <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-warning" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2">Rápido e Eficaz</h3>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Plano completo em minutos, não semanas
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <PricingSection />

      {/* CTA Section - Mobile Optimized */}
      <div className="bg-muted py-12 sm:py-16">
        <div className="max-w-4xl mx-auto text-center container-padding">
          <h2 className="heading-3 mb-3 sm:mb-4 px-2">Pronto para transformar sua estratégia?</h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 px-2 leading-relaxed">
            Ferramenta gratuita desenvolvida pela LEGAL para empreendedores brasileiros
          </p>
          <Button
            size="lg"
            onClick={() => navigate(user ? "/planejamento" : "/auth")}
            className="text-base sm:text-lg px-6 sm:px-8 w-full sm:w-auto touch-target"
          >
            {user ? "Ir para o Planejamento" : "Criar Conta Grátis"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;

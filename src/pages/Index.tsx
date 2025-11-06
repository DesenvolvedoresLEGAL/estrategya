import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Target, TrendingUp, Users, Zap } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center text-primary-foreground">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
              LEGAL Strategic Planner OS
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-3xl mx-auto">
              Planejamento estratégico de classe mundial em minutos, não semanas.
              Baseado em frameworks usados pelas melhores empresas do mundo.
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                size="lg"
                variant="secondary"
                onClick={() => navigate(user ? "/planejamento" : "/auth")}
                className="text-lg px-8"
              >
                {user ? "Continuar Planejamento" : "Começar Agora"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Estratégia que funciona na prática
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Responda poucas perguntas e receba um plano completo com objetivos, iniciativas e métricas
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-card p-6 rounded-xl shadow-lg border border-border hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">IA Estratégica</h3>
            <p className="text-muted-foreground">
              Análise com frameworks OKR, BSC e OGSM em linguagem simples
            </p>
          </div>

          <div className="bg-card p-6 rounded-xl shadow-lg border border-border hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-success" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Objetivos Claros</h3>
            <p className="text-muted-foreground">
              De visão a execução em 5 passos guiados
            </p>
          </div>

          <div className="bg-card p-6 rounded-xl shadow-lg border border-border hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Execução em Equipe</h3>
            <p className="text-muted-foreground">
              Responsáveis, prazos e métricas integrados
            </p>
          </div>

          <div className="bg-card p-6 rounded-xl shadow-lg border border-border hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-warning" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Rápido e Eficaz</h3>
            <p className="text-muted-foreground">
              Plano completo em minutos, não semanas
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-muted py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold mb-4">
            Pronto para transformar sua estratégia?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Ferramenta gratuita desenvolvida pela LEGAL para empreendedores brasileiros
          </p>
          <Button
            size="lg"
            onClick={() => navigate(user ? "/planejamento" : "/auth")}
            className="text-lg px-8"
          >
            {user ? "Ir para o Planejamento" : "Criar Conta Grátis"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;

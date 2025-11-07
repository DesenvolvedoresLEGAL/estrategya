import { Auth as SupabaseAuth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Building2, Target, TrendingUp, Users } from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";

const Auth = () => {
  const navigate = useNavigate();
  const { trackSignup, trackLogin } = useAnalytics();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        // Track signup or login
        if (event === 'SIGNED_IN') {
          // Check if it's a new user by checking if they have a company
          supabase
            .from('companies')
            .select('id')
            .eq('owner_user_id', session.user.id)
            .single()
            .then(({ data }) => {
              if (!data) {
                trackSignup('email');
              } else {
                trackLogin('email');
              }
            });
        }
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen flex">
      {/* Left side - Hero */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-hero p-12 flex-col justify-between text-primary-foreground">
        <div>
          <h1 className="text-4xl font-bold mb-4">LEGAL Strategic Planner OS</h1>
          <p className="text-xl opacity-90">
            Planejamento estratégico de classe mundial, simples como deveria ser.
          </p>
        </div>

        <div className="space-y-8">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white/10 rounded-lg backdrop-blur-sm">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">IA Estratégica</h3>
              <p className="opacity-80">
                Análise baseada em frameworks de classe mundial (OKR, BSC, OGSM)
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 bg-white/10 rounded-lg backdrop-blur-sm">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">Objetivos Claros</h3>
              <p className="opacity-80">
                De visão estratégica a iniciativas executáveis em minutos
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 bg-white/10 rounded-lg backdrop-blur-sm">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">Execução em Equipe</h3>
              <p className="opacity-80">
                Métricas, responsáveis e acompanhamento integrados
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm opacity-75">
          <Building2 className="w-5 h-5" />
          <span>Desenvolvido pela LEGAL para empreendedores de alto impacto</span>
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 lg:hidden">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Strategic Planner OS
            </h1>
            <p className="text-muted-foreground">
              Entre para começar seu planejamento estratégico
            </p>
          </div>

          <div className="bg-card p-8 rounded-2xl shadow-xl border border-border">
            <h2 className="text-2xl font-bold text-center mb-6 text-foreground">
              Acesse sua conta
            </h2>
            
            <SupabaseAuth
              supabaseClient={supabase}
              appearance={{
                theme: ThemeSupa,
                variables: {
                  default: {
                    colors: {
                      brand: 'hsl(217 91% 25%)',
                      brandAccent: 'hsl(217 91% 35%)',
                    },
                  },
                },
                className: {
                  container: 'space-y-4',
                  button: 'w-full bg-primary hover:bg-primary/90 text-primary-foreground',
                  input: 'w-full bg-background border-border',
                },
              }}
              providers={[]}
              view="sign_in"
              showLinks={true}
              localization={{
                variables: {
                  sign_in: {
                    email_label: 'Email',
                    password_label: 'Senha',
                    button_label: 'Entrar',
                    loading_button_label: 'Entrando...',
                    link_text: 'Já tem uma conta? Entre',
                  },
                  sign_up: {
                    email_label: 'Email',
                    password_label: 'Senha',
                    button_label: 'Criar conta',
                    loading_button_label: 'Criando conta...',
                    link_text: 'Não tem conta? Crie uma',
                  },
                },
              }}
            />

            <p className="text-center text-sm text-muted-foreground mt-6">
              Ao criar uma conta, você concorda com nossos termos de uso
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;

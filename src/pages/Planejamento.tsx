import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Stepper } from "@/components/Stepper";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { EtapaContexto } from "@/components/wizard/EtapaContexto";
import { EtapaSWOT } from "@/components/wizard/EtapaSWOT";
import { EtapaAnalise } from "@/components/wizard/EtapaAnalise";
import { EtapaOGSM } from "@/components/wizard/EtapaOGSM";
import { EtapaOKRsBSC } from "@/components/wizard/EtapaOKRsBSC";
import { EtapaObjetivos } from "@/components/wizard/EtapaObjetivos";
import { EtapaMetricas } from "@/components/wizard/EtapaMetricas";

const steps = [
  { id: 1, title: "Contexto", description: "Empresa + MVV" },
  { id: 2, title: "SWOT", description: "Diagnóstico" },
  { id: 3, title: "Análise IA", description: "Leitura Estratégica" },
  { id: 4, title: "OGSM", description: "Direcionamento" },
  { id: 5, title: "OKRs + BSC", description: "Objetivos" },
  { id: 6, title: "Priorização", description: "Matriz 2x2" },
  { id: 7, title: "Métricas", description: "KPIs" },
];

const Planejamento = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);

  // Dados do wizard
  const [companyData, setCompanyData] = useState<any>(null);
  const [swotData, setSWOTData] = useState<any>(null);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [ogsmData, setOgsmData] = useState<any>(null);
  const [okrsBscData, setOkrsBscData] = useState<any>(null);
  const [objectivesData, setObjectivesData] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }
      
      setUser(session.user);
      setLoading(false);
      
      // Carregar dados existentes se houver
      await loadExistingData(session.user.id);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadExistingData = async (userId: string) => {
    try {
      const { data: companies } = await supabase
        .from('companies')
        .select('*')
        .eq('owner_user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (companies && companies.length > 0) {
        setCompanyData(companies[0]);
        
        // Carregar contexto estratégico
        const { data: context } = await supabase
          .from('strategic_context')
          .select('*')
          .eq('company_id', companies[0].id)
          .single();
        
        if (context) {
          setSWOTData(context);
          if (context.ia_analysis) {
            setCurrentStep(3);
          }
        }

        // Carregar objetivos
        const { data: objectives } = await supabase
          .from('strategic_objectives')
          .select('*, initiatives(*), metrics(*)')
          .eq('company_id', companies[0].id);
        
        if (objectives && objectives.length > 0) {
          setObjectivesData(objectives);
          setCurrentStep(5);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleNext = (data?: any) => {
    if (currentStep === 1 && data) {
      setCompanyData(data);
    } else if (currentStep === 2 && data) {
      setSWOTData(data);
    } else if (currentStep === 3 && data) {
      setAnalysisData(data);
    } else if (currentStep === 4 && data) {
      setOgsmData(data);
    } else if (currentStep === 5 && data) {
      setOkrsBscData(data);
    } else if (currentStep === 6 && data) {
      setObjectivesData(data);
    }
    
    if (currentStep < 7) {
      setCurrentStep(currentStep + 1);
    } else {
      toast.success("Planejamento concluído!");
      navigate("/dashboard");
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Strategic Planner OS
              </h1>
              <p className="text-sm text-muted-foreground">
                {user?.email}
              </p>
            </div>
            <Button variant="outline" onClick={handleLogout} size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Stepper 
          steps={steps} 
          currentStep={currentStep}
          onStepClick={(step) => {
            // Permitir voltar para etapas anteriores completadas
            if (step < currentStep) {
              setCurrentStep(step);
            }
          }}
        />

        <div className="mt-8">
          {currentStep === 1 && (
            <EtapaContexto
              initialData={companyData}
              onNext={handleNext}
              userId={user!.id}
            />
          )}

          {currentStep === 2 && (
            <EtapaSWOT
              companyData={companyData}
              initialData={swotData}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}

          {currentStep === 3 && (
            <EtapaAnalise
              companyData={companyData}
              swotData={swotData}
              initialData={analysisData}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}

          {currentStep === 4 && (
            <EtapaOGSM
              companyData={companyData}
              analysisData={analysisData}
              initialData={ogsmData}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}

          {currentStep === 5 && (
            <EtapaOKRsBSC
              companyData={companyData}
              ogsmData={ogsmData}
              initialData={okrsBscData}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}

          {currentStep === 6 && (
            <EtapaObjetivos
              companyData={companyData}
              analysisData={analysisData}
              initialData={objectivesData}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}

          {currentStep === 7 && (
            <EtapaMetricas
              companyData={companyData}
              objectivesData={objectivesData}
              onBack={handleBack}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default Planejamento;

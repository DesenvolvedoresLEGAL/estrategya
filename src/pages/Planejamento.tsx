import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Stepper } from "@/components/Stepper";
import { Button } from "@/components/ui/button";
import { LogOut, Save } from "lucide-react";
import { toast } from "sonner";
import { EtapaContexto } from "@/components/wizard/EtapaContexto";
import { EtapaSWOT } from "@/components/wizard/EtapaSWOT";
import { EtapaAnalise } from "@/components/wizard/EtapaAnalise";
import { EtapaOGSM } from "@/components/wizard/EtapaOGSM";
import { EtapaOKRsBSC } from "@/components/wizard/EtapaOKRsBSC";
import { EtapaPriorizacao } from "@/components/wizard/EtapaPriorizacao";
import { EtapaExecucao } from "@/components/wizard/EtapaExecucao";
import { EtapaMetricas } from "@/components/wizard/EtapaMetricas";
import { useWizardProgress } from "@/hooks/useWizardProgress";

const steps = [
  { 
    id: 1, 
    title: "Contexto", 
    description: "Empresa + MVV",
    tooltip: "Defina o contexto da empresa, incluindo Missão, Visão e Valores. Opcionalmente, faça upload de dados históricos."
  },
  { 
    id: 2, 
    title: "SWOT", 
    description: "Diagnóstico",
    tooltip: "Análise SWOT: identifique Forças, Fraquezas, Oportunidades e Ameaças do seu negócio."
  },
  { 
    id: 3, 
    title: "Análise IA", 
    description: "Leitura Estratégica",
    tooltip: "A IA analisa seu contexto e SWOT, gerando uma leitura executiva e linhas estratégicas usando frameworks globais."
  },
  { 
    id: 4, 
    title: "OGSM", 
    description: "Direcionamento",
    tooltip: "Framework OGSM: Objective (objetivo), Goals (metas), Strategies (estratégias) e Measures (medidas)."
  },
  { 
    id: 5, 
    title: "OKRs + BSC", 
    description: "Objetivos",
    tooltip: "Transforme seus Goals em OKRs (Objectives and Key Results) e valide com as 4 perspectivas do Balanced Scorecard."
  },
  { 
    id: 6, 
    title: "Priorização", 
    description: "Matriz 2x2",
    tooltip: "Matriz Impacto x Esforço: priorize iniciativas em 4 quadrantes (Fazer Agora, Planejar, Quick Wins, Evitar)."
  },
  { 
    id: 7, 
    title: "Execução", 
    description: "Plano 4DX",
    tooltip: "As 4 Disciplinas da Execução: foco no crucialmente importante, medidas de direção, placar visível e cadência de responsabilização."
  },
  { 
    id: 8, 
    title: "Métricas", 
    description: "KPIs",
    tooltip: "Defina métricas específicas (KPIs) para cada OKR, permitindo acompanhamento preciso do progresso."
  },
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
  const [prioritizationData, setPrioritizationData] = useState<any>(null);
  const [executionData, setExecutionData] = useState<any>(null);

  // Hook para gerenciar progresso do wizard
  const {
    isLoading: progressLoading,
    completedSteps,
    loadProgress,
    saveProgress,
    markStepCompleted,
  } = useWizardProgress(user?.id || null, companyData?.id || null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }
      
      setUser(session.user);
      
      // Carregar dados existentes se houver
      await loadExistingData(session.user.id);
      
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Carregar progresso salvo quando companyData estiver disponível
  useEffect(() => {
    const restoreProgress = async () => {
      if (companyData?.id && user?.id) {
        const savedProgress = await loadProgress();
        if (savedProgress && savedProgress.currentStep > currentStep) {
          setCurrentStep(savedProgress.currentStep);
          toast.success('Progresso restaurado!');
        }
      }
    };
    
    restoreProgress();
  }, [companyData?.id, user?.id]);

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

        // Carregar dados OGSM se houver
        const { data: ogsm } = await supabase
          .from('ogsm')
          .select('*')
          .eq('company_id', companies[0].id)
          .maybeSingle();
        
        if (ogsm) {
          setOgsmData(ogsm);
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

  const handleNext = async (data?: any) => {
    // Marcar etapa atual como concluída
    await markStepCompleted(currentStep);
    
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
      setPrioritizationData(data);
    } else if (currentStep === 7 && data) {
      setExecutionData(data);
    }
    
    if (currentStep < 8) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      
      // Salvar progresso automaticamente
      if (companyData?.id) {
        await saveProgress(nextStep, {
          companyData,
          swotData,
          analysisData,
          ogsmData,
          okrsBscData,
          prioritizationData,
          executionData,
        });
      }
    } else {
      toast.success("Planejamento concluído!");
      navigate("/dashboard");
    }
  };

  const handleBack = async () => {
    if (currentStep > 1) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      
      // Salvar progresso ao voltar
      if (companyData?.id) {
        await saveProgress(prevStep);
      }
    }
  };

  if (loading || progressLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {progressLoading ? 'Carregando progresso...' : 'Carregando...'}
          </p>
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
            <div className="flex items-center gap-2">
              {completedSteps.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary/10 text-primary">
                  <Save className="w-4 h-4" />
                  <span className="text-xs font-medium">
                    Progresso salvo
                  </span>
                </div>
              )}
              <Button variant="outline" onClick={handleLogout} size="sm">
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Stepper 
          steps={steps} 
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepClick={async (step) => {
            // Permitir navegar para etapas completadas ou atual
            if (completedSteps.includes(step) || step === currentStep) {
              setCurrentStep(step);
              if (companyData?.id) {
                await saveProgress(step);
              }
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
            <EtapaPriorizacao
              companyData={companyData}
              okrsBscData={okrsBscData}
              initialData={prioritizationData}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}

          {currentStep === 7 && (
            <EtapaExecucao
              companyData={companyData}
              prioritizationData={prioritizationData}
              initialData={executionData}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}

          {currentStep === 8 && (
            <EtapaMetricas
              companyData={companyData}
              okrsBscData={okrsBscData}
              onBack={handleBack}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default Planejamento;

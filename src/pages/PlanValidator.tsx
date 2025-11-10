import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";

interface TestAccount {
  email: string;
  expectedTier: string;
  companyId?: string;
  companyName?: string;
  actualTier?: string;
}

export default function PlanValidator() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [testAccounts, setTestAccounts] = useState<TestAccount[]>([
    { email: "wagsansevero@gmail.com", expectedTier: "enterprise" },
    { email: "legaltest@openai.com", expectedTier: "pro" },
    { email: "legaloperadora@gmail.com", expectedTier: "free" },
  ]);
  const [currentUser, setCurrentUser] = useState<string>("");
  const [selectedAccount, setSelectedAccount] = useState<TestAccount | null>(null);
  
  const { limits, tier, hasFeature, pdfExportMode, currentUsage } = useSubscriptionLimits(
    selectedAccount?.companyId
  );

  useEffect(() => {
    loadTestAccountsData();
  }, []);

  const loadTestAccountsData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log("🔍 [PlanValidator] Current user:", user?.email, "| User ID:", user?.id);
      
      if (user?.email) {
        setCurrentUser(user.email);
      }

      // Buscar empresas do usuário atual com LEFT JOIN para não perder dados
      const { data: companiesData, error: companiesError } = await supabase
        .from("companies")
        .select(`
          id,
          name,
          owner_user_id,
          company_subscriptions (
            id,
            status,
            plan:subscription_plans (
              tier,
              name
            )
          )
        `)
        .eq("owner_user_id", user?.id);

      console.log("🔍 [PlanValidator] Companies query result:", {
        data: companiesData,
        error: companiesError,
        count: companiesData?.length
      });

      if (companiesError) {
        console.error("❌ [PlanValidator] Error fetching companies:", companiesError);
      }

      // Para simplificar, vamos apenas buscar para o usuário atual
      const updatedAccounts = testAccounts.map((account) => {
        // Se for a conta atual, buscar os dados
        if (user?.email === account.email && companiesData && companiesData.length > 0) {
          const company = companiesData[0];
          const subscriptions = company.company_subscriptions;
          const subscription = subscriptions?.[0];
          
          console.log("🔍 [PlanValidator] Processing account:", account.email, {
            companyId: company.id,
            companyName: company.name,
            subscriptions: subscriptions,
            subscription: subscription,
            tier: subscription?.plan?.tier
          });
          
          return {
            ...account,
            companyId: company.id,
            companyName: company.name,
            actualTier: subscription?.plan?.tier || "free",
          };
        }
        
        console.log("⚠️ [PlanValidator] No data for account:", account.email);
        return account;
      });

      console.log("🔍 [PlanValidator] Updated accounts:", updatedAccounts);

      setTestAccounts(updatedAccounts);
      const currentAccount = updatedAccounts.find(a => a.email === user?.email);
      console.log("🔍 [PlanValidator] Selected account:", currentAccount);
      
      if (currentAccount) {
        setSelectedAccount(currentAccount);
      } else if (updatedAccounts[0]) {
        setSelectedAccount(updatedAccounts[0]);
      }
    } catch (error) {
      console.error("❌ [PlanValidator] Error loading test accounts:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados das contas de teste",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testCases = {
    enterprise: [
      { id: "ent-1", label: "Criar múltiplas empresas (ilimitadas)", checked: false },
      { id: "ent-2", label: "Criar planos OGSM ilimitados", checked: false },
      { id: "ent-3", label: "Criar objetivos ilimitados", checked: false },
      { id: "ent-4", label: "Criar iniciativas ilimitadas por objetivo", checked: false },
      { id: "ent-5", label: "Convidar membros ilimitados", checked: false },
      { id: "ent-6", label: "ICE Score disponível", checked: false },
      { id: "ent-7", label: "5W2H disponível", checked: false },
      { id: "ent-8", label: "4DX/WBR disponível", checked: false },
      { id: "ent-9", label: "Exportar PDF premium (sem marca d'água)", checked: false },
      { id: "ent-10", label: "Templates básicos disponíveis", checked: false },
      { id: "ent-11", label: "Templates customizados disponíveis", checked: false },
      { id: "ent-12", label: "Integrações disponíveis", checked: false },
      { id: "ent-13", label: "Colaboração disponível", checked: false },
      { id: "ent-14", label: "Branding personalizado disponível", checked: false },
      { id: "ent-15", label: "Audit log disponível", checked: false },
      { id: "ent-16", label: "Permissões avançadas disponíveis", checked: false },
    ],
    pro: [
      { id: "pro-1", label: "Criar 1 empresa", checked: false },
      { id: "pro-2", label: "Criar até 3 planos OGSM", checked: false },
      { id: "pro-3", label: "Criar objetivos ilimitados", checked: false },
      { id: "pro-4", label: "Criar iniciativas ilimitadas", checked: false },
      { id: "pro-5", label: "Convidar até 3 membros", checked: false },
      { id: "pro-6", label: "ICE Score disponível", checked: false },
      { id: "pro-7", label: "5W2H disponível", checked: false },
      { id: "pro-8", label: "4DX/WBR disponível", checked: false },
      { id: "pro-9", label: "Exportar PDF standard (sem marca d'água)", checked: false },
      { id: "pro-10", label: "Templates básicos disponíveis", checked: false },
      { id: "pro-11", label: "Colaboração disponível", checked: false },
      { id: "pro-12", label: "Templates customizados BLOQUEADOS", checked: false },
      { id: "pro-13", label: "Integrações BLOQUEADAS", checked: false },
      { id: "pro-14", label: "Branding BLOQUEADO", checked: false },
      { id: "pro-15", label: "Audit log BLOQUEADO", checked: false },
      { id: "pro-16", label: "Modal de upgrade aparece ao tentar criar 2ª empresa", checked: false },
    ],
    free: [
      { id: "free-1", label: "Criar 1 empresa", checked: false },
      { id: "free-2", label: "Criar 1 plano OGSM", checked: false },
      { id: "free-3", label: "Criar até 3 objetivos", checked: false },
      { id: "free-4", label: "Criar até 5 iniciativas por objetivo", checked: false },
      { id: "free-5", label: "Apenas 1 membro (owner)", checked: false },
      { id: "free-6", label: "Exportar PDF com marca d'água", checked: false },
      { id: "free-7", label: "ICE Score BLOQUEADO", checked: false },
      { id: "free-8", label: "5W2H BLOQUEADO", checked: false },
      { id: "free-9", label: "4DX/WBR BLOQUEADO", checked: false },
      { id: "free-10", label: "Templates BLOQUEADOS", checked: false },
      { id: "free-11", label: "Colaboração BLOQUEADA", checked: false },
      { id: "free-12", label: "Modal de upgrade ao atingir 3 objetivos", checked: false },
      { id: "free-13", label: "Modal de upgrade ao tentar criar 2º plano OGSM", checked: false },
      { id: "free-14", label: "Modal de upgrade ao tentar convidar membro", checked: false },
    ],
  };

  const getTestsForTier = (tier: string) => {
    return testCases[tier as keyof typeof testCases] || [];
  };

  const checkAutoValidations = () => {
    if (!selectedAccount) return;
    
    const checks = {
      tierMatch: selectedAccount.actualTier === selectedAccount.expectedTier,
      hasCompany: !!selectedAccount.companyId,
      limitsCorrect: {
        companies: limits.max_companies,
        plans: limits.max_plans,
        objectives: limits.max_objectives,
        initiatives: limits.max_initiatives_per_objective,
        members: limits.max_team_members,
      },
      featuresCorrect: {
        ice_score: hasFeature('ice_score'),
        five_w2h: hasFeature('five_w2h'),
        four_dx_wbr: hasFeature('four_dx_wbr'),
        basic_templates: hasFeature('basic_templates'),
        custom_templates: hasFeature('custom_templates'),
        integrations: hasFeature('integrations'),
        collaboration: hasFeature('collaboration'),
        branding: hasFeature('branding'),
        audit_log: hasFeature('audit_log'),
        advanced_permissions: hasFeature('advanced_permissions'),
      },
      pdfMode: pdfExportMode,
    };

    return checks;
  };

  const autoChecks = selectedAccount ? checkAutoValidations() : null;

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Validador de Planos - Fase 4</h1>
        <p className="text-muted-foreground">
          Teste e valide os limites e features de cada plano de assinatura
        </p>
        {currentUser && (
          <Badge variant="outline" className="mt-2">
            Logado como: {currentUser}
          </Badge>
        )}
      </div>

      <Tabs defaultValue={testAccounts[0]?.email} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          {testAccounts.map((account) => (
            <TabsTrigger
              key={account.email}
              value={account.email}
              onClick={() => setSelectedAccount(account)}
            >
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs">{account.expectedTier.toUpperCase()}</span>
                <span className="text-xs truncate max-w-[120px]">{account.email}</span>
              </div>
            </TabsTrigger>
          ))}
        </TabsList>

        {testAccounts.map((account) => (
          <TabsContent key={account.email} value={account.email} className="space-y-6">
            {/* Account Status Card */}
            <Card>
              <CardHeader>
                <CardTitle>Status da Conta</CardTitle>
                <CardDescription>Informações e validações automáticas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium mb-1">Email</p>
                    <p className="text-sm text-muted-foreground">{account.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Empresa</p>
                    <p className="text-sm text-muted-foreground">
                      {account.companyName || "Sem empresa"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Plano Esperado</p>
                    <Badge variant="outline">{account.expectedTier.toUpperCase()}</Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Plano Atual</p>
                    <Badge
                      variant={
                        tier === account.expectedTier ? "default" : "destructive"
                      }
                    >
                      {tier?.toUpperCase() || "N/A"}
                    </Badge>
                  </div>
                </div>

                {autoChecks && (
                  <div className="border-t pt-4 mt-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Validações Automáticas
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Plano correto</span>
                        {autoChecks.tierMatch ? (
                          <Check className="h-5 w-5 text-green-500" />
                        ) : (
                          <X className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Possui empresa</span>
                        {autoChecks.hasCompany ? (
                          <Check className="h-5 w-5 text-green-500" />
                        ) : (
                          <X className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Modo PDF</span>
                        <Badge variant="outline">{autoChecks.pdfMode}</Badge>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Limits Card */}
            <Card>
              <CardHeader>
                <CardTitle>Limites Configurados</CardTitle>
                <CardDescription>Valores atuais no banco de dados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="border rounded-lg p-3">
                    <p className="text-sm font-medium mb-1">Empresas</p>
                    <p className="text-2xl font-bold">
                      {limits.max_companies >= 999999 ? "∞" : limits.max_companies}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Uso: {currentUsage.companies}
                    </p>
                  </div>
                  <div className="border rounded-lg p-3">
                    <p className="text-sm font-medium mb-1">Planos OGSM</p>
                    <p className="text-2xl font-bold">
                      {limits.max_plans >= 999999 ? "∞" : limits.max_plans}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Uso: {currentUsage.plans}
                    </p>
                  </div>
                  <div className="border rounded-lg p-3">
                    <p className="text-sm font-medium mb-1">Objetivos</p>
                    <p className="text-2xl font-bold">
                      {limits.max_objectives >= 999999 ? "∞" : limits.max_objectives}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Uso: {currentUsage.objectives}
                    </p>
                  </div>
                  <div className="border rounded-lg p-3">
                    <p className="text-sm font-medium mb-1">Iniciativas/Obj</p>
                    <p className="text-2xl font-bold">
                      {limits.max_initiatives_per_objective >= 999999
                        ? "∞"
                        : limits.max_initiatives_per_objective}
                    </p>
                  </div>
                  <div className="border rounded-lg p-3">
                    <p className="text-sm font-medium mb-1">Membros</p>
                    <p className="text-2xl font-bold">
                      {limits.max_team_members >= 999999 ? "∞" : limits.max_team_members}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Uso: {currentUsage.teamMembers}
                    </p>
                  </div>
                  <div className="border rounded-lg p-3">
                    <p className="text-sm font-medium mb-1">Modo PDF</p>
                    <p className="text-xl font-bold">{pdfExportMode}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Features Card */}
            <Card>
              <CardHeader>
                <CardTitle>Features Habilitadas</CardTitle>
                <CardDescription>Status de cada funcionalidade</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { key: "ice_score", label: "ICE Score" },
                    { key: "five_w2h", label: "5W2H" },
                    { key: "four_dx_wbr", label: "4DX/WBR" },
                    { key: "basic_templates", label: "Templates Básicos" },
                    { key: "custom_templates", label: "Templates Custom" },
                    { key: "integrations", label: "Integrações" },
                    { key: "collaboration", label: "Colaboração" },
                    { key: "branding", label: "Branding" },
                    { key: "audit_log", label: "Audit Log" },
                    { key: "advanced_permissions", label: "Permissões Avançadas" },
                  ].map((feature) => (
                    <div
                      key={feature.key}
                      className="flex items-center justify-between border rounded-lg p-2"
                    >
                      <span className="text-sm">{feature.label}</span>
                      {hasFeature(feature.key as any) ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Manual Test Checklist */}
            <Card>
              <CardHeader>
                <CardTitle>Checklist de Testes Manuais</CardTitle>
                <CardDescription>
                  Marque conforme testar cada funcionalidade manualmente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {getTestsForTier(account.expectedTier).map((test) => (
                    <div key={test.id} className="flex items-center space-x-3">
                      <Checkbox
                        id={test.id}
                        checked={test.checked}
                        onCheckedChange={(checked) => {
                          // Update test state
                          const updatedTests = getTestsForTier(account.expectedTier).map((t) =>
                            t.id === test.id ? { ...t, checked: !!checked } : t
                          );
                          // Save to state (simplified for demo)
                          console.log("Test updated:", test.id, checked);
                        }}
                      />
                      <label
                        htmlFor={test.id}
                        className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {test.label}
                      </label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Instruções de Teste
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Como usar este validador:</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Faça login com cada conta de teste nas abas acima</li>
              <li>Verifique se as "Validações Automáticas" estão corretas</li>
              <li>Confirme os "Limites Configurados" batem com o esperado</li>
              <li>Revise as "Features Habilitadas" para cada plano</li>
              <li>Execute os testes do "Checklist de Testes Manuais" um por um</li>
              <li>Marque cada item conforme validar manualmente na aplicação</li>
            </ol>
          </div>
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2">Testes Críticos:</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Tentar criar além dos limites deve mostrar modal de upgrade</li>
              <li>• Features bloqueadas devem exibir UpgradePrompt ao clicar</li>
              <li>• PDF do FREE deve ter marca d'água, PRO e Enterprise não</li>
              <li>• ICE Score, 5W2H e 4DX devem estar bloqueados no FREE</li>
            </ul>
          </div>
          <Button onClick={loadTestAccountsData} className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Recarregar Dados
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

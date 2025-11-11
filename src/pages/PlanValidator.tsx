import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Check,
  X,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Loader2,
  Info,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface TestAccount {
  email: string;
  expectedTier: string;
  companyId?: string;
  companyName?: string;
  actualTier?: string;
  subscriptionStatus?: string;
  dataLoaded?: boolean;
  statusMessage?: string;
  lastSyncedAt?: string;
}

type SubscriptionRecord = {
  id: string;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  plan?: {
    tier?: string | null;
    name?: string | null;
    limits?: Record<string, unknown> | null;
  } | null;
};

const SUBSCRIPTION_STATUS_PRIORITY = [
  "active",
  "trialing",
  "past_due",
  "unpaid",
  "paused",
  "cancelled",
  "canceled",
];

const normalizeSubscriptions = (
  subscriptions: SubscriptionRecord[] | SubscriptionRecord | null | undefined
): SubscriptionRecord[] => {
  if (!subscriptions) {
    return [];
  }

  if (Array.isArray(subscriptions)) {
    return subscriptions.filter(Boolean) as SubscriptionRecord[];
  }

  return [subscriptions];
};

const sortSubscriptionsByRelevance = (subscriptions: SubscriptionRecord[] = []) => {
  return [...subscriptions].sort((a, b) => {
    const statusA = a.status?.toLowerCase() ?? "";
    const statusB = b.status?.toLowerCase() ?? "";
    const statusIndexA = SUBSCRIPTION_STATUS_PRIORITY.indexOf(statusA);
    const statusIndexB = SUBSCRIPTION_STATUS_PRIORITY.indexOf(statusB);
    const normalizedStatusA = statusIndexA === -1 ? SUBSCRIPTION_STATUS_PRIORITY.length : statusIndexA;
    const normalizedStatusB = statusIndexB === -1 ? SUBSCRIPTION_STATUS_PRIORITY.length : statusIndexB;

    if (normalizedStatusA !== normalizedStatusB) {
      return normalizedStatusA - normalizedStatusB;
    }

    const dateA = a.updated_at ?? a.created_at ?? null;
    const dateB = b.updated_at ?? b.created_at ?? null;
    const timeA = dateA ? new Date(dateA).getTime() : 0;
    const timeB = dateB ? new Date(dateB).getTime() : 0;

    return timeB - timeA;
  });
};

const pickMostRelevantSubscription = (subscriptions: SubscriptionRecord[] = []) => {
  const sorted = sortSubscriptionsByRelevance(subscriptions);
  return sorted[0] ?? null;
};

const tierPriorityMap: Record<string, number> = {
  enterprise: 3,
  pro: 2,
  free: 1,
};

const rankTier = (tier?: string | null) => {
  if (!tier) return 0;
  return tierPriorityMap[tier.toLowerCase()] ?? 0;
};

const pickBestCompanyWithSubscription = (companies: any[]) => {
  const enriched = companies
    .map(company => {
      const subscriptions = normalizeSubscriptions(
        company?.company_subscriptions as SubscriptionRecord[] | SubscriptionRecord | null | undefined
      );
      const subscription = pickMostRelevantSubscription(subscriptions);
      return { company, subscription };
    })
    .sort((a, b) => {
      const tierDiff = rankTier(b.subscription?.plan?.tier ?? null) - rankTier(a.subscription?.plan?.tier ?? null);
      if (tierDiff !== 0) {
        return tierDiff;
      }

      const statusA = a.subscription?.status?.toLowerCase() ?? "";
      const statusB = b.subscription?.status?.toLowerCase() ?? "";
      const statusIndexA = SUBSCRIPTION_STATUS_PRIORITY.indexOf(statusA);
      const statusIndexB = SUBSCRIPTION_STATUS_PRIORITY.indexOf(statusB);
      const normalizedStatusA = statusIndexA === -1 ? SUBSCRIPTION_STATUS_PRIORITY.length : statusIndexA;
      const normalizedStatusB = statusIndexB === -1 ? SUBSCRIPTION_STATUS_PRIORITY.length : statusIndexB;

      if (normalizedStatusA !== normalizedStatusB) {
        return normalizedStatusA - normalizedStatusB;
      }

      const dateA = a.subscription?.updated_at ?? a.subscription?.created_at ?? null;
      const dateB = b.subscription?.updated_at ?? b.subscription?.created_at ?? null;
      const timeA = dateA ? new Date(dateA).getTime() : 0;
      const timeB = dateB ? new Date(dateB).getTime() : 0;

      return timeB - timeA;
    });

  return enriched[0] ?? null;
};

export default function PlanValidator() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [reloadingAccount, setReloadingAccount] = useState<string | null>(null);
  const defaultAccounts: TestAccount[] = useMemo(
    () => [
      { email: "wagsansevero@gmail.com", expectedTier: "enterprise" },
      { email: "legaltest@openai.com", expectedTier: "pro" },
      { email: "legaloperadora@gmail.com", expectedTier: "free" },
    ],
    []
  );
  const [testAccounts, setTestAccounts] = useState<TestAccount[]>(defaultAccounts);
  const [currentUser, setCurrentUser] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>(defaultAccounts[0]?.email ?? "");

  const selectedAccount = useMemo(
    () => testAccounts.find(account => account.email === activeTab) ?? null,
    [activeTab, testAccounts]
  );

  const {
    limits,
    tier,
    hasFeature,
    pdfExportMode,
    currentUsage,
    dataSource,
  } = useSubscriptionLimits(selectedAccount?.companyId);

  // Fetch saved validation checks
  const { data: savedChecks = [] } = useQuery({
    queryKey: ['validation-checks', selectedAccount?.email],
    queryFn: async () => {
      if (!selectedAccount?.email) return [];
      
      const { data, error } = await supabase
        .from('plan_validation_checks')
        .select('*')
        .eq('account_email', selectedAccount.email);
      
      if (error) {
        console.error('Error fetching validation checks:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!selectedAccount?.email,
  });

  // Mutation to toggle check
  const toggleCheckMutation = useMutation({
    mutationFn: async ({ testId, checked }: { testId: string; checked: boolean }) => {
      if (!selectedAccount?.email) throw new Error('No account selected');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('plan_validation_checks')
        .upsert({
          user_id: user.id,
          account_email: selectedAccount.email,
          expected_tier: selectedAccount.expectedTier,
          company_id: selectedAccount.companyId || null,
          test_id: testId,
          checked,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,account_email,test_id'
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['validation-checks'] });
      toast({
        title: "✅ Checklist atualizado",
        description: "Sua marcação foi salva com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error updating check:', error);
      toast({
        title: "❌ Erro ao salvar",
        description: "Não foi possível salvar a marcação.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    void loadTestAccountsData();
  }, []);

  useEffect(() => {
    if (!selectedAccount || !selectedAccount.dataLoaded || !tier) {
      return;
    }

    setTestAccounts(prev =>
      prev.map(account =>
        account.email === selectedAccount.email && account.actualTier !== tier
          ? { ...account, actualTier: tier }
          : account
      )
    );
  }, [tier, selectedAccount]);

  const loadTestAccountsData = async (targetEmail?: string) => {
    const isTargetedReload = Boolean(targetEmail);
    if (isTargetedReload && targetEmail) {
      setReloadingAccount(targetEmail);
    } else {
      setLoading(true);
    }

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("❌ [PlanValidator] Error fetching auth user:", userError);
        throw userError;
      }

      console.log("🔍 [PlanValidator] Current user:", user?.email, "| User ID:", user?.id);

      if (!user?.email) {
        throw new Error("Usuário não autenticado. Faça login para validar os planos.");
      }

      if (targetEmail && targetEmail !== user.email) {
        console.warn(
          "⚠️ [PlanValidator] Attempt to reload data for a different account blocked by RLS",
          { targetEmail, currentUser: user.email }
        );
        toast({
          title: "Conta protegida",
          description: "Por segurança, só é possível recarregar os dados da conta logada.",
        });
        return;
      }

      setCurrentUser(user.email);

      const { data: ownedCompanies, error: ownedCompaniesError } = await supabase
        .from("companies")
        .select(`
          id,
          name,
          owner_user_id,
          company_subscriptions:company_subscriptions!left (
            id,
            status,
            created_at,
            updated_at,
            plan:subscription_plans!left (
              tier,
              name,
              limits
            )
          )
        `)
        .eq("owner_user_id", user.id);

      console.log("🔍 [PlanValidator] Owned companies:", {
        ownedCompanies,
        ownedCompaniesError,
      });

      if (ownedCompaniesError) {
        console.error("❌ [PlanValidator] Error fetching owned companies:", ownedCompaniesError);
      }

      const { data: membershipCompanies, error: membershipError } = await supabase
        .from("team_members")
        .select(`
          company:companies (
            id,
            name,
            owner_user_id,
            company_subscriptions:company_subscriptions!left (
              id,
              status,
              created_at,
              updated_at,
              plan: subscription_plans!left (
                tier,
                name,
                limits
              )
              )
            )
          )
        `)
        .eq("user_id", user.id);

      console.log("🔍 [PlanValidator] Membership companies:", {
        membershipCompanies,
        membershipError,
      });

      if (membershipError) {
        console.error("❌ [PlanValidator] Error fetching membership companies:", membershipError);
      }

      const flattenedMembershipCompanies = (membershipCompanies || [])
        .map((entry: any) => entry.company)
        .filter((company: any): company is NonNullable<typeof company> => Boolean(company));

      const combinedCompaniesMap = new Map<string, any>();
      for (const company of [...(ownedCompanies || []), ...flattenedMembershipCompanies]) {
        if (!company) continue;
        combinedCompaniesMap.set(company.id, company);
      }

      const combinedCompanies = Array.from(combinedCompaniesMap.values());
      console.log("🔍 [PlanValidator] Combined companies for user:", combinedCompanies);

      const bestCompanyEntry = pickBestCompanyWithSubscription(combinedCompanies);
      const targetCompany = bestCompanyEntry?.company;
      const subscription = bestCompanyEntry?.subscription;

      console.log("✅ [PlanValidator] Selected company and subscription:", {
        targetCompany,
        subscription,
      });
      const resolvedTier = subscription?.plan?.tier;
      const fetchTimestamp = new Date().toISOString();

      const updatedAccounts = testAccounts.map(account => {
        const isCurrentUserAccount = account.email === user.email;

        if (!isCurrentUserAccount) {
          return {
            ...account,
            actualTier: undefined,
            companyId: undefined,
            companyName: undefined,
            dataLoaded: false,
            statusMessage:
              account.statusMessage ||
              "Faça login com esta conta para ver os dados completos.",
          };
        }

        if (!targetCompany) {
          console.warn(
            "⚠️ [PlanValidator] No company associated with the current user",
            { account: account.email }
          );

          return {
            ...account,
            companyId: undefined,
            companyName: undefined,
            actualTier: undefined,
            subscriptionStatus: undefined,
            dataLoaded: false,
            statusMessage:
              "Nenhuma empresa encontrada para esta conta. Crie uma empresa para carregar os dados.",
            lastSyncedAt: fetchTimestamp,
          };
        }
        console.log("✅ [PlanValidator] Company data resolved for account", {
          email: account.email,
          companyId: targetCompany.id,
          companyName: targetCompany.name,
          subscription,
        });

        return {
          ...account,
          companyId: targetCompany.id,
          companyName: targetCompany.name,
          actualTier: resolvedTier,
          subscriptionStatus: subscription?.status,
          dataLoaded: true,
          statusMessage: undefined,
          lastSyncedAt: fetchTimestamp,
        };
      });

      console.log("🔍 [PlanValidator] Updated accounts:", updatedAccounts);

      setTestAccounts(updatedAccounts);

      if (user.email) {
        setActiveTab(prev => (prev === user.email ? prev : user.email));
      }
    } catch (error) {
      console.error("❌ [PlanValidator] Error loading test accounts:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados das contas de teste",
        variant: "destructive",
      });
    } finally {
      if (isTargetedReload) {
        setReloadingAccount(null);
      } else {
        setLoading(false);
      }
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

  const getTestsForTier = (tierKey: string) => {
    return testCases[tierKey as keyof typeof testCases] || [];
  };

  const getDataSourceLabel = (source: string | undefined) => {
    switch (source) {
      case "database":
        return "Banco";
      case "fallback":
        return "Fallback";
      default:
        return "Indefinido";
    }
  };

  const checkAutoValidations = (account: TestAccount) => {
    if (!account) return null;

    const normalizedTier = (tier || account.actualTier || "").toLowerCase();
    const expectedTier = account.expectedTier.toLowerCase();

    const checks = {
      tierMatch: normalizedTier === expectedTier && normalizedTier !== "",
      hasCompany: !!account.companyId,
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
      dataSource: getDataSourceLabel(dataSource),
    };

    return checks;
  };

  const autoChecks =
    selectedAccount && selectedAccount.dataLoaded
      ? checkAutoValidations(selectedAccount)
      : null;

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'enterprise':
        return 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white';
      case 'pro':
        return 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white';
      case 'free':
        return 'bg-gradient-to-r from-gray-400 to-gray-600 text-white';
      default:
        return 'bg-muted';
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
      {/* Header Section with Gradient */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Validador de Planos - Fase 4
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Teste e valide os limites e features de cada plano de assinatura
            </p>
          </div>
          {currentUser && (
            <Badge variant="outline" className="self-start sm:self-auto px-4 py-2 text-xs">
              <Check className="h-3 w-3 mr-1" />
              Logado como: {currentUser}
            </Badge>
          )}
        </div>
        
        <Alert className="border-l-4 border-l-primary bg-primary/5">
          <Info className="h-4 w-4 text-primary" />
          <AlertTitle className="text-primary font-semibold">Como testar múltiplas contas</AlertTitle>
          <AlertDescription className="text-sm">
            Os dados completos são exibidos apenas para a conta atualmente autenticada.
            Para validar outras contas de teste, faça login com cada email e utilize o botão de recarregar
            dados na aba correspondente.
          </AlertDescription>
        </Alert>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={value => setActiveTab(value)}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-muted/50">
          {testAccounts.map((account) => (
            <TabsTrigger
              key={account.email}
              value={account.email}
              className="data-[state=active]:bg-background data-[state=active]:shadow-md transition-all"
            >
              <div className="flex flex-col items-center gap-1.5 py-2">
                <div className={`flex items-center gap-2 font-bold px-3 py-1 rounded-full text-xs ${getTierColor(account.expectedTier)}`}>
                  {account.dataLoaded ? (
                    <CheckCircle className="h-3.5 w-3.5" />
                  ) : (
                    <AlertCircle className="h-3.5 w-3.5" />
                  )}
                  <span>{account.expectedTier.toUpperCase()}</span>
                </div>
                <span className="text-xs truncate max-w-[120px] text-muted-foreground">{account.email}</span>
                {account.email === currentUser && (
                  <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                    Ativa
                  </Badge>
                )}
              </div>
            </TabsTrigger>
          ))}
        </TabsList>

        {testAccounts.map((account) => {
          const isActiveAccount = account.email === activeTab;
          const comparisonTier = (account.actualTier || (isActiveAccount ? tier : undefined) || "").toLowerCase();
          const resolvedTierLabel = (account.actualTier || (isActiveAccount && tier !== "unknown" ? tier : undefined) || "N/A")
            .toString()
            .toUpperCase();
          const tierMatchesExpectation =
            comparisonTier !== "" && comparisonTier === account.expectedTier.toLowerCase();

          return (
            <TabsContent key={account.email} value={account.email} className="space-y-6">
              {/* Sync Status Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-muted/30 rounded-lg border">
                <div className="flex items-center gap-3">
                  {account.dataLoaded ? (
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      <div>
                        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Sincronizado
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {account.lastSyncedAt
                            ? new Date(account.lastSyncedAt).toLocaleString('pt-BR')
                            : "Agora"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-amber-500" />
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Não carregado
                      </Badge>
                    </div>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void loadTestAccountsData(account.email)}
                  disabled={reloadingAccount === account.email}
                  className="hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {reloadingAccount === account.email ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Recarregar dados
                </Button>
              </div>

            {!account.dataLoaded && (
              <Alert className="border-l-4 border-l-amber-500 bg-amber-500/5">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <AlertTitle className="text-amber-700">Dados protegidos</AlertTitle>
                <AlertDescription className="text-amber-600">
                  {account.statusMessage ||
                    "Faça login com esta conta para visualizar os dados deste plano."}
                </AlertDescription>
              </Alert>
            )}

            {/* Account Status Card */}
            <Card className="border-t-4 border-t-primary shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Info className="h-5 w-5 text-primary" />
                    Status da Conta
                  </CardTitle>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${getTierColor(account.expectedTier)}`}>
                    {account.expectedTier.toUpperCase()}
                  </div>
                </div>
                <CardDescription>Informações e validações automáticas do plano</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Email</p>
                    <p className="text-sm font-medium truncate">{account.email}</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Empresa</p>
                    <p className="text-sm font-medium truncate">
                      {account.companyName || "Sem empresa"}
                    </p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Plano Esperado</p>
                    <Badge variant="outline" className="mt-1">{account.expectedTier.toUpperCase()}</Badge>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Plano Atual</p>
                    <Badge
                      className="mt-1"
                      variant={
                        tierMatchesExpectation
                          ? "default"
                          : account.actualTier || (isActiveAccount ? tier : undefined)
                          ? "destructive"
                          : "outline"
                      }
                    >
                      {resolvedTierLabel}
                    </Badge>
                  </div>
                  {account.subscriptionStatus && (
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Status da Assinatura</p>
                      <Badge variant="outline" className="mt-1">{account.subscriptionStatus}</Badge>
                    </div>
                  )}
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Fonte dos dados</p>
                    <Badge variant="outline" className="mt-1">{getDataSourceLabel(dataSource)}</Badge>
                  </div>
                </div>

                {autoChecks && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-4 flex items-center gap-2 text-primary">
                      <CheckCircle className="h-5 w-5" />
                      Validações Automáticas
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <span className="text-sm font-medium">Plano correto</span>
                        {autoChecks.tierMatch ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <Check className="h-5 w-5" />
                            <span className="text-xs font-bold">SIM</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-red-600">
                            <X className="h-5 w-5" />
                            <span className="text-xs font-bold">NÃO</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <span className="text-sm font-medium">Possui empresa</span>
                        {autoChecks.hasCompany ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <Check className="h-5 w-5" />
                            <span className="text-xs font-bold">SIM</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-red-600">
                            <X className="h-5 w-5" />
                            <span className="text-xs font-bold">NÃO</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <span className="text-sm font-medium">Modo PDF</span>
                        <Badge 
                          variant={autoChecks.pdfMode === 'premium' ? 'default' : 'outline'}
                          className="font-bold"
                        >
                          {autoChecks.pdfMode}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <span className="text-sm font-medium">Origem</span>
                        <Badge 
                          variant={autoChecks.dataSource === 'Banco' ? 'default' : 'secondary'}
                          className="font-bold"
                        >
                          {autoChecks.dataSource}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Limits Card */}
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-xl flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-primary" />
                  Limites Configurados
                </CardTitle>
                <CardDescription>Valores máximos e uso atual do plano</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {account.dataLoaded ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="relative border-2 border-primary/20 rounded-xl p-4 bg-gradient-to-br from-primary/5 to-transparent hover:border-primary/40 transition-colors">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Empresas</p>
                      <p className="text-3xl font-bold text-primary mb-2">
                        {limits.max_companies >= 999999 ? "∞" : limits.max_companies}
                      </p>
                      <div className="flex items-center gap-2 text-xs">
                        <div className="flex-1 bg-muted rounded-full h-1.5">
                          <div 
                            className="bg-primary h-1.5 rounded-full transition-all"
                            style={{ 
                              width: limits.max_companies >= 999999 ? '0%' : 
                                `${Math.min((currentUsage.companies / limits.max_companies) * 100, 100)}%` 
                            }}
                          />
                        </div>
                        <span className="text-muted-foreground font-medium">{currentUsage.companies}</span>
                      </div>
                    </div>
                    
                    <div className="relative border-2 border-blue-500/20 rounded-xl p-4 bg-gradient-to-br from-blue-500/5 to-transparent hover:border-blue-500/40 transition-colors">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Planos OGSM</p>
                      <p className="text-3xl font-bold text-blue-600 mb-2">
                        {limits.max_plans >= 999999 ? "∞" : limits.max_plans}
                      </p>
                      <div className="flex items-center gap-2 text-xs">
                        <div className="flex-1 bg-muted rounded-full h-1.5">
                          <div 
                            className="bg-blue-500 h-1.5 rounded-full transition-all"
                            style={{ 
                              width: limits.max_plans >= 999999 ? '0%' : 
                                `${Math.min((currentUsage.plans / limits.max_plans) * 100, 100)}%` 
                            }}
                          />
                        </div>
                        <span className="text-muted-foreground font-medium">{currentUsage.plans}</span>
                      </div>
                    </div>
                    
                    <div className="relative border-2 border-purple-500/20 rounded-xl p-4 bg-gradient-to-br from-purple-500/5 to-transparent hover:border-purple-500/40 transition-colors">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Objetivos</p>
                      <p className="text-3xl font-bold text-purple-600 mb-2">
                        {limits.max_objectives >= 999999 ? "∞" : limits.max_objectives}
                      </p>
                      <div className="flex items-center gap-2 text-xs">
                        <div className="flex-1 bg-muted rounded-full h-1.5">
                          <div 
                            className="bg-purple-500 h-1.5 rounded-full transition-all"
                            style={{ 
                              width: limits.max_objectives >= 999999 ? '0%' : 
                                `${Math.min((currentUsage.objectives / limits.max_objectives) * 100, 100)}%` 
                            }}
                          />
                        </div>
                        <span className="text-muted-foreground font-medium">{currentUsage.objectives}</span>
                      </div>
                    </div>
                    
                    <div className="relative border-2 border-cyan-500/20 rounded-xl p-4 bg-gradient-to-br from-cyan-500/5 to-transparent hover:border-cyan-500/40 transition-colors">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Iniciativas/Obj</p>
                      <p className="text-3xl font-bold text-cyan-600">
                        {limits.max_initiatives_per_objective >= 999999
                          ? "∞"
                          : limits.max_initiatives_per_objective}
                      </p>
                    </div>
                    
                    <div className="relative border-2 border-green-500/20 rounded-xl p-4 bg-gradient-to-br from-green-500/5 to-transparent hover:border-green-500/40 transition-colors">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Membros</p>
                      <p className="text-3xl font-bold text-green-600 mb-2">
                        {limits.max_team_members >= 999999 ? "∞" : limits.max_team_members}
                      </p>
                      <div className="flex items-center gap-2 text-xs">
                        <div className="flex-1 bg-muted rounded-full h-1.5">
                          <div 
                            className="bg-green-500 h-1.5 rounded-full transition-all"
                            style={{ 
                              width: limits.max_team_members >= 999999 ? '0%' : 
                                `${Math.min((currentUsage.teamMembers / limits.max_team_members) * 100, 100)}%` 
                            }}
                          />
                        </div>
                        <span className="text-muted-foreground font-medium">{currentUsage.teamMembers}</span>
                      </div>
                    </div>
                    
                    <div className="relative border-2 border-amber-500/20 rounded-xl p-4 bg-gradient-to-br from-amber-500/5 to-transparent hover:border-amber-500/40 transition-colors">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Modo PDF</p>
                      <p className="text-2xl font-bold text-amber-600 capitalize">{pdfExportMode}</p>
                    </div>
                  </div>
                ) : (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Dados indisponíveis para esta conta. Faça login com este email para carregar os limites reais.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Features Card */}
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Check className="h-5 w-5 text-primary" />
                  Features Habilitadas
                </CardTitle>
                <CardDescription>Status e disponibilidade de cada funcionalidade</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {account.dataLoaded ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
                    ].map((feature) => {
                      const enabled = hasFeature(feature.key as any);
                      return (
                        <div
                          key={feature.key}
                          className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                            enabled 
                              ? 'bg-green-500/5 border-green-500/20 hover:border-green-500/40' 
                              : 'bg-muted/30 border-muted hover:border-muted-foreground/20'
                          }`}
                        >
                          <span className={`text-sm font-medium ${enabled ? 'text-green-700' : 'text-muted-foreground'}`}>
                            {feature.label}
                          </span>
                          {enabled ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <X className="h-5 w-5 text-muted-foreground/50" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      As features habilitadas só podem ser verificadas quando os dados da conta estiverem carregados.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Manual Test Checklist */}
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3 border-b bg-gradient-to-r from-primary/5 to-transparent">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      Checklist de Testes Manuais
                    </CardTitle>
                    <CardDescription className="mt-2">
                      Marque conforme testar cada funcionalidade manualmente. Suas marcações são salvas automaticamente.
                    </CardDescription>
                  </div>
                  {savedChecks.length > 0 && (
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        {savedChecks.filter(c => c.checked).length}
                        <span className="text-sm text-muted-foreground">/{getTestsForTier(account.expectedTier).length}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">concluídos</p>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  {getTestsForTier(account.expectedTier).map((test) => {
                    const savedCheck = savedChecks.find(c => c.test_id === test.id);
                    const isChecked = savedCheck?.checked || false;
                    
                    return (
                      <div 
                        key={test.id} 
                        className={`flex items-start space-x-3 p-3 rounded-lg border-2 transition-all ${
                          isChecked 
                            ? 'bg-green-500/5 border-green-500/20' 
                            : 'border-muted hover:bg-accent/30'
                        }`}
                      >
                        <Checkbox
                          id={test.id}
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            toggleCheckMutation.mutate({
                              testId: test.id,
                              checked: !!checked,
                            });
                          }}
                          disabled={toggleCheckMutation.isPending}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-1">
                          <label
                            htmlFor={test.id}
                            className={`text-sm leading-snug cursor-pointer font-medium block ${
                              isChecked ? 'text-green-700' : ''
                            }`}
                          >
                            {test.label}
                          </label>
                          {savedCheck?.updated_at && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Check className="h-3 w-3" />
                              {new Date(savedCheck.updated_at).toLocaleString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          )}
                        </div>
                        {isChecked && (
                          <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Instructions Card */}
      <Card className="mt-6 border-t-4 border-t-primary shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Info className="h-6 w-6 text-primary" />
            Instruções de Teste
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-primary" />
                </div>
                <h4 className="font-semibold text-lg">Como usar este validador</h4>
              </div>
              <ol className="space-y-2 text-sm">
                {[
                  "Faça login com cada conta de teste nas abas acima",
                  "Verifique se as Validações Automáticas estão corretas",
                  "Confirme se os Limites Configurados batem com o esperado",
                  "Revise as Features Habilitadas para cada plano",
                  "Execute os testes do Checklist de Testes Manuais",
                  "Marque cada item conforme validar manualmente"
                ].map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                      {i + 1}
                    </span>
                    <span className="text-muted-foreground">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                </div>
                <h4 className="font-semibold text-lg">Testes Críticos</h4>
              </div>
              <ul className="space-y-2 text-sm">
                {[
                  "Tentar criar além dos limites deve mostrar modal de upgrade",
                  "Features bloqueadas devem exibir UpgradePrompt ao clicar",
                  "PDF do FREE deve ter marca d'água, PRO e Enterprise não",
                  "ICE Score, 5W2H e 4DX devem estar bloqueados no FREE"
                ].map((critical, i) => (
                  <li key={i} className="flex gap-2 items-start">
                    <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{critical}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <Button
              onClick={() => void loadTestAccountsData()}
              className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              size="lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Carregando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Recarregar Todos os Dados
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

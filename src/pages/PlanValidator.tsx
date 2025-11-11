import { useEffect, useMemo, useState } from "react";
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
              plan:subscription_plans!left (
                tier,
                name,
                limits
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
        .map(entry => entry.company)
        .filter((company): company is NonNullable<typeof company> => Boolean(company));

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
        <Alert className="mt-4">
          <Info className="h-4 w-4" />
          <AlertTitle>Como testar múltiplas contas</AlertTitle>
          <AlertDescription>
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
        <TabsList className="grid w-full grid-cols-3">
          {testAccounts.map((account) => (
            <TabsTrigger
              key={account.email}
              value={account.email}
            >
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1 text-xs">
                  {account.dataLoaded ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <AlertCircle className="h-3 w-3 text-amber-500" />
                  )}
                  <span>{account.expectedTier.toUpperCase()}</span>
                </div>
                <span className="text-xs truncate max-w-[120px]">{account.email}</span>
                {account.email === currentUser && (
                  <Badge variant="secondary" className="text-[10px]">
                    Conta atual
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
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">
                  Última sincronização:{" "}
                  {account.lastSyncedAt
                    ? new Date(account.lastSyncedAt).toLocaleString()
                    : "nunca"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {account.dataLoaded ? (
                  <Badge variant="outline" className="bg-green-500/10 text-green-600">
                    Dados sincronizados
                  </Badge>
                ) : (
                  <Badge variant="outline">Dados não carregados</Badge>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void loadTestAccountsData(account.email)}
                  disabled={reloadingAccount === account.email}
                >
                  {reloadingAccount === account.email ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Recarregar dados
                </Button>
              </div>
            </div>

            {!account.dataLoaded && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Dados protegidos</AlertTitle>
                <AlertDescription>
                  {account.statusMessage ||
                    "Faça login com esta conta para visualizar os dados deste plano."}
                </AlertDescription>
              </Alert>
            )}

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
                    <div>
                      <p className="text-sm font-medium mb-1">Status da Assinatura</p>
                      <Badge variant="outline">{account.subscriptionStatus}</Badge>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium mb-1">Fonte dos dados</p>
                    <Badge variant="outline">{getDataSourceLabel(dataSource)}</Badge>
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
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Origem dos limites</span>
                        <Badge variant="outline">{autoChecks.dataSource}</Badge>
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
                {account.dataLoaded ? (
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
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Dados indisponíveis para esta conta. Faça login com este email para carregar os limites reais.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Features Card */}
            <Card>
              <CardHeader>
                <CardTitle>Features Habilitadas</CardTitle>
                <CardDescription>Status de cada funcionalidade</CardDescription>
              </CardHeader>
              <CardContent>
                {account.dataLoaded ? (
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
                ) : (
                  <p className="text-sm text-muted-foreground">
                    As features habilitadas só podem ser verificadas quando os dados da conta estiverem carregados.
                  </p>
                )}
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
          );
        })}
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
          <Button
            onClick={() => void loadTestAccountsData()}
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Recarregar Dados
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

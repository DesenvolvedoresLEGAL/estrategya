import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type SubscriptionQueryResult = {
  id: string;
  status: string | null;
  created_at: string | null;
  updated_at?: string | null;
  plan?: {
    tier?: string | null;
    limits?: Partial<SubscriptionLimits> | null;
    pdf_export_mode?: SubscriptionLimits["pdf_export_mode"] | null;
  } | null;
};
interface SubscriptionLimits {
  max_companies: number;
  max_plans: number;
  max_objectives: number;
  max_initiatives_per_objective: number;
  max_team_members: number;
  pdf_export_mode: "none" | "watermark" | "standard" | "premium";
  ice_score: boolean;
  five_w2h: boolean;
  four_dx_wbr: boolean;
  basic_templates: boolean;
  custom_templates: boolean;
  integrations: boolean;
  collaboration: boolean;
  branding: boolean;
  audit_log: boolean;
  advanced_permissions: boolean;
}

export type FeatureFlag =
  | "ice_score"
  | "five_w2h"
  | "four_dx_wbr"
  | "basic_templates"
  | "custom_templates"
  | "integrations"
  | "collaboration"
  | "branding"
  | "audit_log"
  | "advanced_permissions";

interface SubscriptionData {
  limits: SubscriptionLimits;
  tier: string;
  status: string;
  isLoading: boolean;
  canCreateCompany: () => Promise<boolean>;
  canCreatePlan: (companyId: string) => Promise<boolean>;
  canCreateObjective: (companyId: string) => Promise<boolean>;
  canCreateInitiative: (objectiveId: string) => Promise<boolean>;
  canInviteTeamMember: (companyId: string) => Promise<boolean>;
  canExportPDF: () => boolean;
  shouldApplyWatermark: () => boolean;
  hasPremiumPDF: () => boolean;
  pdfExportMode: SubscriptionLimits["pdf_export_mode"];
  hasFeature: (feature: FeatureFlag) => boolean;
  currentUsage: {
    companies: number;
    plans: number;
    objectives: number;
    teamMembers: number;
  };
  dataSource: "database" | "fallback" | "unknown";
  isUsingFallbackPlan: boolean;
}

export const useSubscriptionLimits = (companyId: string | undefined): SubscriptionData => {
  console.log("🔍 [useSubscriptionLimits] Hook called with companyId:", companyId);

  const { data: subscription, isLoading } = useQuery({
    queryKey: ["subscription", companyId],
    queryFn: async () => {
      console.log("🔍 [useSubscriptionLimits] Query function running for companyId:", companyId);

      if (!companyId) {
        console.log("⚠️ [useSubscriptionLimits] No companyId provided, skipping subscription fetch");
        return null;
      }

      const { data, error } = await supabase
        .from("company_subscriptions")
        .select(`
          *,
          plan:subscription_plans(*)
        `)
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(10);

      console.log("🔍 [useSubscriptionLimits] Subscription query result:", {
        companyId,
        data,
        error,
      });

      if (error) {
        console.log("⚠️ [useSubscriptionLimits] Subscription error, falling back to free plan:", error);
      }

      const subscriptionHistory = (data as SubscriptionQueryResult[] | null) ?? [];

      const prioritizedStatuses = ["active", "trialing", "past_due", "unpaid"];
      const activeSubscription = subscriptionHistory.find((record) => {
        if (!record?.status) return false;
        return prioritizedStatuses.includes(record.status.toLowerCase());
      });

      const fallbackSubscription = subscriptionHistory[0] ?? null;
      const selectedSubscription = activeSubscription ?? fallbackSubscription;

      if (selectedSubscription) {
        console.log("✅ [useSubscriptionLimits] Resolved subscription record:", {
          companyId,
          status: selectedSubscription.status,
          tier: selectedSubscription.plan?.tier,
          created_at: selectedSubscription.created_at,
        });
        return selectedSubscription;
      }

      console.log("⚠️ [useSubscriptionLimits] No subscription records found, loading free plan fallback");

      const { data: freePlan } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("tier", "free")
        .single();

      console.log("🔍 [useSubscriptionLimits] Free plan fallback:", freePlan);

      if (freePlan) {
        return {
          id: "fallback-free-plan",
          plan: freePlan,
          status: "active",
          created_at: null,
          updated_at: null,
          tier: "free",
          isFallback: true,
        } as SubscriptionQueryResult & { isFallback: boolean; tier: string };
      }

      if (error) {
        console.error("❌ [useSubscriptionLimits] Error loading subscription:", error);
        throw error;
      }

      return null;
    },
    enabled: !!companyId,
    retry: 1,
  });

  const { data: currentUsage } = useQuery({
    queryKey: ["subscription-usage", companyId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      console.log("🔍 [useSubscriptionLimits] Usage query user:", user?.id);
      if (!user) return { companies: 0, plans: 0, objectives: 0, teamMembers: 0 };

      // Count companies owned by user
      const { count: companiesCount } = await supabase
        .from("companies")
        .select("*", { count: "exact", head: true })
        .eq("owner_user_id", user.id);

      // Count plans (OGSM records) for the specific company
      const { count: plansCount } = companyId ? await supabase
        .from("ogsm")
        .select("*", { count: "exact", head: true })
        .eq("company_id", companyId) : { count: 0 };

      // Count current objectives
      const { count: objectivesCount } = companyId ? await supabase
        .from("strategic_objectives")
        .select("*", { count: "exact", head: true })
        .eq("company_id", companyId) : { count: 0 };

      // Count current team members
      const { count: teamMembersCount } = companyId ? await supabase
        .from("team_members")
        .select("*", { count: "exact", head: true })
        .eq("company_id", companyId) : { count: 0 };

      console.log("🔍 [useSubscriptionLimits] Usage counters:", {
        companyId,
        companiesCount,
        plansCount,
        objectivesCount,
        teamMembersCount,
      });

      return {
        companies: companiesCount || 0,
        plans: plansCount || 0,
        objectives: objectivesCount || 0,
        teamMembers: teamMembersCount || 0,
      };
    },
    enabled: true,
  });

  const defaultLimits: SubscriptionLimits = {
    max_companies: 1,
    max_plans: 1,
    max_objectives: 3,
    max_initiatives_per_objective: 5,
    max_team_members: 1,
    pdf_export_mode: "watermark",
    ice_score: false,
    five_w2h: false,
    four_dx_wbr: false,
    basic_templates: false,
    custom_templates: false,
    integrations: false,
    collaboration: false,
    branding: false,
    audit_log: false,
    advanced_permissions: false,
  };

  const planLimits = (subscription?.plan?.limits as unknown as Partial<SubscriptionLimits>) || {};
  const limits: SubscriptionLimits = { ...defaultLimits, ...planLimits };

  const pdfExportMode = limits.pdf_export_mode || "watermark";

  const isFallbackFromQuery = Boolean((subscription as any)?.isFallback);
  const hasSubscriptionData = Boolean(subscription?.plan);
  const dataSource: SubscriptionData["dataSource"] = !companyId
    ? "unknown"
    : isFallbackFromQuery || !hasSubscriptionData
      ? "fallback"
      : "database";
  const isUsingFallbackPlan = dataSource !== "database";

  console.log("🔍 [useSubscriptionLimits] Final computed values:", {
    companyId,
    tier: subscription?.plan?.tier,
    dataSource,
    isUsingFallbackPlan,
    limits,
    pdfExportMode,
  });

  const canCreateCompany = async (): Promise<boolean> => {
    if (limits.max_companies >= 999999) return true;
    const usage = currentUsage?.companies || 0;
    return usage < limits.max_companies;
  };

  const canCreatePlan = async (cId: string): Promise<boolean> => {
    if (limits.max_plans >= 999999) return true;
    
    const { count } = await supabase
      .from("ogsm")
      .select("*", { count: "exact", head: true })
      .eq("company_id", cId);

    return (count || 0) < limits.max_plans;
  };

  const canCreateObjective = async (cId: string): Promise<boolean> => {
    if (limits.max_objectives >= 999999) return true;
    
    const { count } = await supabase
      .from("strategic_objectives")
      .select("*", { count: "exact", head: true })
      .eq("company_id", cId);

    return (count || 0) < limits.max_objectives;
  };

  const canCreateInitiative = async (objectiveId: string): Promise<boolean> => {
    if (limits.max_initiatives_per_objective >= 999999) return true;
    
    const { count } = await supabase
      .from("initiatives")
      .select("*", { count: "exact", head: true })
      .eq("objective_id", objectiveId);

    return (count || 0) < limits.max_initiatives_per_objective;
  };

  const canInviteTeamMember = async (cId: string): Promise<boolean> => {
    if (limits.max_team_members >= 999999) return true;
    
    const { count } = await supabase
      .from("team_members")
      .select("*", { count: "exact", head: true })
      .eq("company_id", cId);

    return (count || 0) < limits.max_team_members;
  };

  const canExportPDF = (): boolean => {
    return pdfExportMode !== "none";
  };

  const shouldApplyWatermark = (): boolean => {
    return pdfExportMode === "watermark";
  };

  const hasPremiumPDF = (): boolean => {
    return pdfExportMode === "premium";
  };

  const hasFeature = (feature: FeatureFlag): boolean => {
    return Boolean(limits[feature]);
  };

  return {
    limits,
    pdfExportMode,
    tier: subscription?.plan?.tier || (hasSubscriptionData ? "free" : companyId ? "unknown" : "unknown"),
    status: subscription?.status || (hasSubscriptionData ? "active" : "unknown"),
    isLoading,
    canCreateCompany,
    canCreatePlan,
    canCreateObjective,
    canCreateInitiative,
    canInviteTeamMember,
    canExportPDF,
    shouldApplyWatermark,
    hasPremiumPDF,
    hasFeature,
    currentUsage: currentUsage || { companies: 0, plans: 0, objectives: 0, teamMembers: 0 },
    dataSource,
    isUsingFallbackPlan,
  };
};

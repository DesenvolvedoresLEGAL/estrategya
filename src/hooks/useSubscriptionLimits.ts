import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
}

export const useSubscriptionLimits = (companyId: string | undefined): SubscriptionData => {
  const { data: subscription, isLoading } = useQuery({
    queryKey: ["subscription", companyId],
    queryFn: async () => {
      if (!companyId) return null;

      const { data, error } = await supabase
        .from("company_subscriptions")
        .select(`
          *,
          plan:subscription_plans(*)
        `)
        .eq("company_id", companyId)
        .single();

      if (error) {
        // If no subscription exists, return default free plan
        const { data: freePlan } = await supabase
          .from("subscription_plans")
          .select("*")
          .eq("tier", "free")
          .single();

        if (freePlan) {
          return {
            plan: freePlan,
            status: "active",
            tier: "free",
          };
        }
        throw error;
      }

      return data;
    },
    enabled: !!companyId,
  });

  const { data: currentUsage } = useQuery({
    queryKey: ["subscription-usage", companyId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
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
    tier: subscription?.plan?.tier || "free",
    status: subscription?.status || "active",
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
  };
};

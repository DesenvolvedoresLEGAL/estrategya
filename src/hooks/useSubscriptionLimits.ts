import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SubscriptionLimits {
  max_companies: number;
  max_plans: number;
  max_objectives: number;
  max_initiatives_per_objective: number;
  max_team_members: number;
  ai_insights_per_month: number;
  export_pdf: boolean;
  ice_score: boolean;
  "5w2h": boolean;
  "4dx_execution": boolean;
  templates: boolean;
  integrations: boolean;
  collaboration: boolean;
  custom_branding: boolean;
}

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
  hasFeature: (feature: keyof SubscriptionLimits) => boolean;
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

  const limits: SubscriptionLimits = (subscription?.plan?.limits as unknown as SubscriptionLimits) || {
    max_companies: 1,
    max_plans: 1,
    max_objectives: 3,
    max_initiatives_per_objective: 3,
    max_team_members: 1,
    ai_insights_per_month: 5,
    export_pdf: false,
    ice_score: false,
    "5w2h": false,
    "4dx_execution": false,
    templates: false,
    integrations: false,
    collaboration: false,
    custom_branding: false,
  };

  const canCreateCompany = async (): Promise<boolean> => {
    if (limits.max_companies === -1) return true;
    const usage = currentUsage?.companies || 0;
    return usage < limits.max_companies;
  };

  const canCreatePlan = async (cId: string): Promise<boolean> => {
    if (limits.max_plans === -1) return true;
    
    const { count } = await supabase
      .from("ogsm")
      .select("*", { count: "exact", head: true })
      .eq("company_id", cId);

    return (count || 0) < limits.max_plans;
  };

  const canCreateObjective = async (cId: string): Promise<boolean> => {
    if (limits.max_objectives === -1) return true;
    
    const { count } = await supabase
      .from("strategic_objectives")
      .select("*", { count: "exact", head: true })
      .eq("company_id", cId);

    return (count || 0) < limits.max_objectives;
  };

  const canCreateInitiative = async (objectiveId: string): Promise<boolean> => {
    if (limits.max_initiatives_per_objective === -1) return true;
    
    const { count } = await supabase
      .from("initiatives")
      .select("*", { count: "exact", head: true })
      .eq("objective_id", objectiveId);

    return (count || 0) < limits.max_initiatives_per_objective;
  };

  const canInviteTeamMember = async (cId: string): Promise<boolean> => {
    if (limits.max_team_members === -1) return true;
    
    const { count } = await supabase
      .from("team_members")
      .select("*", { count: "exact", head: true })
      .eq("company_id", cId);

    return (count || 0) < limits.max_team_members;
  };

  const canExportPDF = (): boolean => {
    return limits.export_pdf === true;
  };

  const hasFeature = (feature: keyof SubscriptionLimits): boolean => {
    return !!limits[feature];
  };

  return {
    limits,
    tier: subscription?.plan?.tier || "free",
    status: subscription?.status || "active",
    isLoading,
    canCreateCompany,
    canCreatePlan,
    canCreateObjective,
    canCreateInitiative,
    canInviteTeamMember,
    canExportPDF,
    hasFeature,
    currentUsage: currentUsage || { companies: 0, plans: 0, objectives: 0, teamMembers: 0 },
  };
};

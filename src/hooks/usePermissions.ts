import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSubscriptionLimits } from "./useSubscriptionLimits";

export type Permission = 
  | "view_objectives"
  | "edit_objectives"
  | "delete_objectives"
  | "view_initiatives"
  | "edit_initiatives"
  | "delete_initiatives"
  | "manage_team"
  | "manage_settings";

export type UserRole = "owner" | "admin" | "editor" | "viewer";

interface UsePermissionsReturn {
  hasPermission: (permission: Permission) => boolean;
  userRole: UserRole | null;
  isLoading: boolean;
  canManagePermissions: boolean;
}

export const usePermissions = (companyId: string | undefined): UsePermissionsReturn => {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { hasFeature } = useSubscriptionLimits(companyId);
  
  const hasAdvancedPermissions = hasFeature('advanced_permissions');

  useEffect(() => {
    if (!companyId) {
      setIsLoading(false);
      return;
    }

    loadUserRole();
  }, [companyId]);

  const loadUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !companyId) return;

      const { data: member } = await supabase
        .from("team_members")
        .select("role")
        .eq("company_id", companyId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (member) {
        setUserRole(member.role as UserRole);
      }
    } catch (error) {
      console.error("Error loading user role:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const defaultPermissions: Record<UserRole, Record<Permission, boolean>> = {
    owner: {
      view_objectives: true,
      edit_objectives: true,
      delete_objectives: true,
      view_initiatives: true,
      edit_initiatives: true,
      delete_initiatives: true,
      manage_team: true,
      manage_settings: true,
    },
    admin: {
      view_objectives: true,
      edit_objectives: true,
      delete_objectives: true,
      view_initiatives: true,
      edit_initiatives: true,
      delete_initiatives: true,
      manage_team: true,
      manage_settings: false,
    },
    editor: {
      view_objectives: true,
      edit_objectives: true,
      delete_objectives: false,
      view_initiatives: true,
      edit_initiatives: true,
      delete_initiatives: false,
      manage_team: false,
      manage_settings: false,
    },
    viewer: {
      view_objectives: true,
      edit_objectives: false,
      delete_objectives: false,
      view_initiatives: true,
      edit_initiatives: false,
      delete_initiatives: false,
      manage_team: false,
      manage_settings: false,
    },
  };

  const hasPermission = (permission: Permission): boolean => {
    if (!userRole) return false;

    // If advanced permissions are enabled, could load custom permissions from DB
    // For now, use default permissions
    return defaultPermissions[userRole]?.[permission] || false;
  };

  return {
    hasPermission,
    userRole,
    isLoading,
    canManagePermissions: hasAdvancedPermissions && userRole === 'owner',
  };
};

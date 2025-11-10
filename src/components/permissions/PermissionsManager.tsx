import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { UpgradePrompt } from "@/components/subscription/UpgradePrompt";
import { 
  Shield, 
  Lock, 
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  Settings
} from "lucide-react";
import { toast } from "sonner";

interface Permission {
  id: string;
  name: string;
  description: string;
  icon: any;
}

interface RolePermissions {
  role: string;
  permissions: Record<string, boolean>;
}

interface PermissionsManagerProps {
  companyId: string;
}

const availablePermissions: Permission[] = [
  {
    id: "view_objectives",
    name: "Ver Objetivos",
    description: "Visualizar todos os objetivos estratégicos",
    icon: Eye,
  },
  {
    id: "edit_objectives",
    name: "Editar Objetivos",
    description: "Criar e modificar objetivos estratégicos",
    icon: Edit,
  },
  {
    id: "delete_objectives",
    name: "Deletar Objetivos",
    description: "Remover objetivos do sistema",
    icon: Trash2,
  },
  {
    id: "view_initiatives",
    name: "Ver Iniciativas",
    description: "Visualizar todas as iniciativas",
    icon: Eye,
  },
  {
    id: "edit_initiatives",
    name: "Editar Iniciativas",
    description: "Criar e modificar iniciativas",
    icon: Edit,
  },
  {
    id: "delete_initiatives",
    name: "Deletar Iniciativas",
    description: "Remover iniciativas do sistema",
    icon: Trash2,
  },
  {
    id: "manage_team",
    name: "Gerenciar Equipe",
    description: "Convidar e remover membros",
    icon: UserPlus,
  },
  {
    id: "manage_settings",
    name: "Gerenciar Configurações",
    description: "Alterar configurações da empresa",
    icon: Settings,
  },
];

const defaultRolePermissions: Record<string, Record<string, boolean>> = {
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

export const PermissionsManager = ({ companyId }: PermissionsManagerProps) => {
  const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>>>(
    defaultRolePermissions
  );
  const [selectedRole, setSelectedRole] = useState<string>("admin");
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [saving, setSaving] = useState(false);

  const { hasFeature, tier } = useSubscriptionLimits(companyId);
  const hasAdvancedPermissions = hasFeature('advanced_permissions');

  const roles = [
    { value: "owner", label: "Owner", description: "Acesso total ao sistema" },
    { value: "admin", label: "Admin", description: "Gerenciamento completo" },
    { value: "editor", label: "Editor", description: "Pode editar mas não deletar" },
    { value: "viewer", label: "Viewer", description: "Apenas visualização" },
  ];

  const togglePermission = (permissionId: string) => {
    if (!hasAdvancedPermissions) {
      setShowUpgradePrompt(true);
      return;
    }

    if (selectedRole === "owner") {
      toast.error("Não é possível modificar permissões do Owner");
      return;
    }

    setPermissions(prev => ({
      ...prev,
      [selectedRole]: {
        ...prev[selectedRole],
        [permissionId]: !prev[selectedRole][permissionId],
      },
    }));
  };

  const savePermissions = async () => {
    if (!hasAdvancedPermissions) {
      setShowUpgradePrompt(true);
      return;
    }

    setSaving(true);
    try {
      // In a real implementation, save to database
      // For now, just simulate save
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Permissões atualizadas com sucesso!");
    } catch (error) {
      console.error("Error saving permissions:", error);
      toast.error("Erro ao salvar permissões");
    } finally {
      setSaving(false);
    }
  };

  const resetToDefault = () => {
    setPermissions(defaultRolePermissions);
    toast.success("Permissões resetadas para os valores padrão");
  };

  if (!hasAdvancedPermissions) {
    return (
      <>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Permissões Avançadas - Feature Enterprise</CardTitle>
            </div>
            <CardDescription>
              O sistema de permissões granulares está disponível apenas no plano Enterprise
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-4 border rounded-lg bg-muted/50">
              <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold mb-2">Por que Permissões Avançadas?</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Controle granular de acesso por role</li>
                  <li>• Defina quem pode ver, editar e deletar</li>
                  <li>• Proteção de dados sensíveis</li>
                  <li>• Conformidade com políticas de segurança</li>
                  <li>• Auditoria completa de acessos</li>
                </ul>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
              <div>
                <p className="text-sm font-medium mb-1">Planos com permissões básicas:</p>
                <p className="text-xs text-muted-foreground">Owner, Admin, Viewer</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Enterprise adiciona:</p>
                <p className="text-xs text-muted-foreground">Editor + Permissões customizáveis</p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-3">
                Seu plano atual: <Badge variant="outline">{tier?.toUpperCase()}</Badge>
              </p>
              <Button onClick={() => setShowUpgradePrompt(true)} className="w-full">
                Fazer Upgrade para Enterprise
              </Button>
            </div>
          </CardContent>
        </Card>

        <UpgradePrompt 
          open={showUpgradePrompt}
          onOpenChange={setShowUpgradePrompt}
          feature="Permissões Avançadas"
        />
      </>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Gerenciamento de Permissões
        </CardTitle>
        <CardDescription>
          Configure permissões granulares para cada role da equipe
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Role Selector */}
        <div>
          <Label className="mb-2 block">Selecione a Role</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {roles.map((role) => (
              <button
                key={role.value}
                onClick={() => setSelectedRole(role.value)}
                className={`p-3 border rounded-lg text-left transition-colors ${
                  selectedRole === role.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-accent"
                }`}
              >
                <p className="font-medium text-sm">{role.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{role.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Permissions List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-4">
            <Label>Permissões para {roles.find(r => r.value === selectedRole)?.label}</Label>
            {selectedRole === "owner" && (
              <Badge variant="secondary">Não editável</Badge>
            )}
          </div>

          <div className="space-y-3">
            {availablePermissions.map((permission) => {
              const PermIcon = permission.icon;
              const isEnabled = permissions[selectedRole]?.[permission.id] || false;
              const isOwner = selectedRole === "owner";

              return (
                <div
                  key={permission.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isEnabled ? "bg-primary/10" : "bg-muted"}`}>
                      <PermIcon className={`h-4 w-4 ${isEnabled ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{permission.name}</p>
                      <p className="text-xs text-muted-foreground">{permission.description}</p>
                    </div>
                  </div>

                  <Switch
                    checked={isEnabled}
                    onCheckedChange={() => togglePermission(permission.id)}
                    disabled={isOwner}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t">
          <Button 
            onClick={savePermissions} 
            disabled={saving}
            className="flex-1"
          >
            {saving ? "Salvando..." : "Salvar Permissões"}
          </Button>
          <Button 
            variant="outline" 
            onClick={resetToDefault}
          >
            Resetar Padrão
          </Button>
        </div>

        {/* Info Box */}
        <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg text-sm">
          <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
          <p className="text-muted-foreground">
            As permissões definidas aqui serão aplicadas a todos os membros com a role selecionada.
            Owner sempre tem acesso total.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

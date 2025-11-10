import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TeamManagement } from "@/components/team/TeamManagement";
import { AuditLog } from "@/components/audit/AuditLog";
import { PermissionsManager } from "@/components/permissions/PermissionsManager";
import { Users, Clock, Shield } from "lucide-react";

const Equipe = () => {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompany();
  }, []);

  const loadCompany = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: company } = await supabase
        .from("companies")
        .select("id")
        .eq("owner_user_id", user.id)
        .maybeSingle();

      if (company) {
        setCompanyId(company.id);
      }
    } catch (error) {
      console.error("Error loading company:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!companyId) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Empresa não encontrada</CardTitle>
            <CardDescription>
              Você precisa criar uma empresa primeiro para gerenciar a equipe
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Gestão de Equipe</h1>
        <p className="text-muted-foreground">
          Gerencie membros, permissões e acompanhe o histórico de atividades
        </p>
      </div>

      <Tabs defaultValue="team" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="team">
            <Users className="h-4 w-4 mr-2" />
            Membros da Equipe
          </TabsTrigger>
          <TabsTrigger value="permissions">
            <Shield className="h-4 w-4 mr-2" />
            Permissões
          </TabsTrigger>
          <TabsTrigger value="audit">
            <Clock className="h-4 w-4 mr-2" />
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="space-y-6">
          <TeamManagement companyId={companyId} />
        </TabsContent>

        <TabsContent value="permissions" className="space-y-6">
          <PermissionsManager companyId={companyId} />
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <AuditLog companyId={companyId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Equipe;

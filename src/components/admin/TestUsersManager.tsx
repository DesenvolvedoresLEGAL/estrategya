import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus, Trash2, Key, Building2, Loader2, Zap } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TestUser {
  email: string;
  password: string;
  tier: 'free' | 'pro' | 'enterprise';
  companyName: string;
}

export const TestUsersManager = () => {
  const { toast } = useToast();
  const [creating, setCreating] = useState(false);
  const [testUser, setTestUser] = useState<TestUser>({
    email: "",
    password: "Teste@123",
    tier: "free",
    companyName: "",
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingEmail, setDeletingEmail] = useState("");

  const predefinedUsers: TestUser[] = [
    {
      email: "teste.free@legal.dev",
      password: "TesteFree@123",
      tier: "free",
      companyName: "Empresa Teste FREE"
    },
    {
      email: "teste.pro@legal.dev",
      password: "TestePro@123",
      tier: "pro",
      companyName: "Empresa Teste PRO"
    }
  ];

  const createTestUser = async (user: TestUser) => {
    setCreating(true);
    try {
      // 1. Criar o usuário via Admin API (precisa estar autenticado como admin)
      const { data: { user: authUser }, error: signUpError } = await supabase.auth.signUp({
        email: user.email,
        password: user.password,
        options: {
          data: {
            is_test_user: true,
            test_tier: user.tier
          }
        }
      });

      if (signUpError) throw signUpError;
      if (!authUser) throw new Error("Usuário não foi criado");

      // 2. Criar a empresa para o usuário
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: user.companyName,
          owner_user_id: authUser.id,
          segment: "Tecnologia",
          model: "B2B",
          region: "Brasil"
        })
        .select()
        .single();

      if (companyError) throw companyError;

      // 3. Se for PRO ou ENTERPRISE, criar subscription
      if (user.tier !== 'free') {
        // Buscar o plano correspondente
        const { data: plans } = await supabase
          .from('subscription_plans')
          .select('id')
          .eq('tier', user.tier)
          .single();

        if (plans) {
          const currentDate = new Date();
          const endDate = new Date();
          endDate.setFullYear(endDate.getFullYear() + 1);

          const { error: subError } = await supabase
            .from('company_subscriptions')
            .insert({
              company_id: company.id,
              plan_id: plans.id,
              status: 'active',
              current_period_start: currentDate.toISOString(),
              current_period_end: endDate.toISOString()
            });

          if (subError) throw subError;
        }
      }

      toast({
        title: "Usuário de teste criado!",
        description: `${user.email} - Plano ${user.tier.toUpperCase()}`,
      });

      // Limpar form
      setTestUser({
        email: "",
        password: "Teste@123",
        tier: "free",
        companyName: "",
      });

    } catch (error: any) {
      console.error('Error creating test user:', error);
      toast({
        title: "Erro ao criar usuário",
        description: error.message || "Tente novamente",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  const deleteTestUser = async (email: string) => {
    try {
      // Buscar o usuário
      const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
      
      if (listError) throw listError;
      
      const user = users?.find((u: any) => u.email === email);
      if (!user) {
        toast({
          title: "Usuário não encontrado",
          variant: "destructive"
        });
        return;
      }

      // Deletar empresa (cascata vai deletar subscription)
      const { error: companyError } = await supabase
        .from('companies')
        .delete()
        .eq('owner_user_id', user.id);

      if (companyError) throw companyError;

      // Deletar usuário
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
      
      if (deleteError) throw deleteError;

      toast({
        title: "Usuário deletado",
        description: `${email} foi removido`,
      });

    } catch (error: any) {
      console.error('Error deleting test user:', error);
      toast({
        title: "Erro ao deletar usuário",
        description: error.message || "Tente novamente",
        variant: "destructive"
      });
    }
    setShowDeleteConfirm(false);
    setDeletingEmail("");
  };

  const confirmDelete = (email: string) => {
    setDeletingEmail(email);
    setShowDeleteConfirm(true);
  };

  return (
    <div className="space-y-6">
      {/* Quick Create Predefined Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Criação Rápida - Usuários Pré-configurados
          </CardTitle>
          <CardDescription>
            Crie usuários de teste com um clique usando emails e senhas padrão
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {predefinedUsers.map((user) => (
              <Card key={user.email} className="border-2">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant={user.tier === 'pro' ? 'default' : 'secondary'}>
                        {user.tier.toUpperCase()}
                      </Badge>
                      <Badge variant="outline">{user.companyName}</Badge>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Email:</span>
                        <code className="text-xs bg-muted px-2 py-1 rounded">{user.email}</code>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Senha:</span>
                        <code className="text-xs bg-muted px-2 py-1 rounded">{user.password}</code>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => createTestUser(user)}
                        disabled={creating}
                        className="flex-1"
                        size="sm"
                      >
                        {creating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <UserPlus className="h-4 w-4 mr-2" />
                        )}
                        Criar
                      </Button>
                      <Button
                        onClick={() => confirmDelete(user.email)}
                        variant="destructive"
                        size="sm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Custom Test User Creation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Criar Usuário de Teste Customizado
          </CardTitle>
          <CardDescription>
            Configure manualmente um novo usuário de teste
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@exemplo.com"
                  value={testUser.email}
                  onChange={(e) => setTestUser({ ...testUser, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="text"
                  placeholder="Mínimo 8 caracteres"
                  value={testUser.password}
                  onChange={(e) => setTestUser({ ...testUser, password: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tier">Plano</Label>
                <Select
                  value={testUser.tier}
                  onValueChange={(value: any) => setTestUser({ ...testUser, tier: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">FREE</SelectItem>
                    <SelectItem value="pro">PRO</SelectItem>
                    <SelectItem value="enterprise">ENTERPRISE</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyName">Nome da Empresa</Label>
                <Input
                  id="companyName"
                  placeholder="Empresa Teste"
                  value={testUser.companyName}
                  onChange={(e) => setTestUser({ ...testUser, companyName: e.target.value })}
                />
              </div>
            </div>

            <Button
              onClick={() => createTestUser(testUser)}
              disabled={creating || !testUser.email || !testUser.companyName}
              className="w-full"
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Criar Usuário de Teste
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar o usuário <strong>{deletingEmail}</strong>?
              Esta ação não pode ser desfeita e irá remover a empresa e todos os dados associados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTestUser(deletingEmail)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
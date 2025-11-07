import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Crown, Shield, Edit, Eye, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { InviteTeamModal } from "./InviteTeamModal";

interface TeamManagementProps {
  companyId: string;
}

export const TeamManagement = ({ companyId }: TeamManagementProps) => {
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: teamMembers, isLoading } = useQuery({
    queryKey: ['team-members', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('company_id', companyId)
        .order('role');
      
      if (error) throw error;
      
      // Get user emails separately
      const membersWithEmails = await Promise.all(
        data.map(async (member) => {
          const { data: userData } = await supabase.auth.admin.getUserById(member.user_id);
          return {
            ...member,
            userEmail: userData?.user?.email || 'Email não disponível'
          };
        })
      );
      
      return membersWithEmails;
    }
  });

  const { data: currentUser } = useQuery({
    queryKey: ['current-user-role', companyId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from('team_members')
        .select('role')
        .eq('company_id', companyId)
        .eq('user_id', user.id)
        .single();
      
      return data;
    }
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', companyId] });
      toast({
        title: "Membro removido",
        description: "O membro foi removido da equipe com sucesso."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover membro",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="h-4 w-4" />;
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'editor': return <Edit className="h-4 w-4" />;
      case 'viewer': return <Eye className="h-4 w-4" />;
      default: return null;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner': return 'default';
      case 'admin': return 'secondary';
      case 'editor': return 'outline';
      default: return 'outline';
    }
  };

  const canManageTeam = currentUser?.role === 'owner' || currentUser?.role === 'admin';

  if (isLoading) {
    return <div>Carregando equipe...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Equipe</h2>
        {canManageTeam && (
          <Button onClick={() => setInviteModalOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Convidar Membro
          </Button>
        )}
      </div>

      <div className="grid gap-4">
        {teamMembers?.map((member) => (
          <Card key={member.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {getRoleIcon(member.role)}
                  <Badge variant={getRoleBadgeVariant(member.role)}>
                    {member.role}
                  </Badge>
                </div>
                <div>
                  <p className="font-medium">{member.userEmail}</p>
                  {member.invited_at && (
                    <p className="text-sm text-muted-foreground">
                      Convidado em {new Date(member.invited_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              
              {canManageTeam && member.role !== 'owner' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeMemberMutation.mutate(member.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      <InviteTeamModal
        companyId={companyId}
        open={inviteModalOpen}
        onOpenChange={setInviteModalOpen}
      />
    </div>
  );
};

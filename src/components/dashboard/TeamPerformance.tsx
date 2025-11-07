import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, Trophy, Target } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface TeamPerformanceProps {
  companyId: string;
}

export const TeamPerformance = ({ companyId }: TeamPerformanceProps) => {
  const { data: teamData } = useQuery({
    queryKey: ["team-performance", companyId],
    queryFn: async () => {
      // Get team members
      const { data: members } = await supabase
        .from("team_members")
        .select("user_id, role")
        .eq("company_id", companyId);

      if (!members) return [];

      // Get initiatives assigned to each member
      const performanceData = await Promise.all(
        members.map(async (member) => {
          const { data: initiatives } = await supabase
            .from("initiatives")
            .select(`
              id,
              title,
              status,
              ice_score,
              strategic_objectives!inner(company_id)
            `)
            .eq("assigned_to", member.user_id)
            .eq("strategic_objectives.company_id", companyId);

          const total = initiatives?.length || 0;
          const completed = initiatives?.filter(i => i.status === "concluída").length || 0;
          const inProgress = initiatives?.filter(i => i.status === "em andamento").length || 0;
          const avgIceScore = initiatives?.reduce((acc, i) => acc + (i.ice_score || 0), 0) / (total || 1);

          // Get user email
          const { data: { user } } = await supabase.auth.admin.getUserById(member.user_id);

          return {
            userId: member.user_id,
            email: user?.email || "Usuário",
            role: member.role,
            total,
            completed,
            inProgress,
            completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
            avgIceScore: Math.round(avgIceScore),
          };
        })
      );

      return performanceData.filter(p => p.total > 0).sort((a, b) => b.completionRate - a.completionRate);
    },
    enabled: !!companyId,
  });

  const getInitials = (email: string) => {
    const parts = email.split("@")[0].split(".");
    return parts
      .map(p => p[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getPerformanceBadge = (rate: number) => {
    if (rate >= 80) return { label: "Excelente", variant: "default" as const };
    if (rate >= 60) return { label: "Bom", variant: "secondary" as const };
    if (rate >= 40) return { label: "Regular", variant: "outline" as const };
    return { label: "Atenção", variant: "destructive" as const };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Performance da Equipe
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {teamData && teamData.length > 0 ? (
          teamData.map((member, idx) => {
            const badge = getPerformanceBadge(member.completionRate);
            return (
              <div key={member.userId} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(member.email)}
                    </AvatarFallback>
                  </Avatar>
                  {idx === 0 && member.completionRate > 0 && (
                    <Trophy className="h-4 w-4 text-yellow-500 absolute -top-1 -right-1" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-sm truncate">{member.email.split("@")[0]}</p>
                    <Badge variant={badge.variant} className="text-xs">
                      {badge.label}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <Progress value={member.completionRate} className="h-2" />
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        <span>{member.completed}/{member.total}</span>
                      </div>
                      <div>
                        <span>{member.inProgress} em andamento</span>
                      </div>
                      {member.avgIceScore > 0 && (
                        <div>
                          <span>ICE: {member.avgIceScore}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma iniciativa atribuída</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

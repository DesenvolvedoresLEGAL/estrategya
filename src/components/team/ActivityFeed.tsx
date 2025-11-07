import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  FileText,
  Target,
  TrendingUp,
  MessageSquare,
  UserPlus,
  CheckCircle2,
  Edit,
} from "lucide-react";

interface ActivityFeedProps {
  companyId: string;
  limit?: number;
}

export const ActivityFeed = ({ companyId, limit = 20 }: ActivityFeedProps) => {
  const { data: activities, isLoading } = useQuery({
    queryKey: ['activity-log', companyId, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_log')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      
      // Get user emails separately
      const activitiesWithEmails = await Promise.all(
        data.map(async (activity) => {
          const { data: userData } = await supabase.auth.admin.getUserById(activity.user_id);
          return {
            ...activity,
            userEmail: userData?.user?.email || 'Usuário'
          };
        })
      );
      
      return activitiesWithEmails;
    }
  });

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'created': return <FileText className="h-4 w-4" />;
      case 'updated': return <Edit className="h-4 w-4" />;
      case 'commented': return <MessageSquare className="h-4 w-4" />;
      case 'completed': return <CheckCircle2 className="h-4 w-4" />;
      case 'invited': return <UserPlus className="h-4 w-4" />;
      default: return <TrendingUp className="h-4 w-4" />;
    }
  };

  const getActionText = (activity: any) => {
    const entityTypeMap: Record<string, string> = {
      initiative: 'iniciativa',
      objective: 'objetivo',
      metric: 'métrica',
      team_member: 'membro da equipe',
      comment: 'comentário',
    };

    const actionTypeMap: Record<string, string> = {
      created: 'criou',
      updated: 'atualizou',
      commented: 'comentou em',
      completed: 'concluiu',
      invited: 'convidou',
    };

    return `${actionTypeMap[activity.action_type] || activity.action_type} ${entityTypeMap[activity.entity_type] || activity.entity_type}`;
  };

  if (isLoading) {
    return <div>Carregando atividades...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Atividades Recentes</h2>
      
      <div className="space-y-3">
        {activities?.map((activity) => (
          <Card key={activity.id} className="p-4">
            <div className="flex items-start gap-3">
              <div className="mt-1">{getActionIcon(activity.action_type)}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{activity.userEmail}</span>
                  <Badge variant="outline">{getActionText(activity)}</Badge>
                </div>
                
                {activity.details && (
                  <p className="text-sm text-muted-foreground">
                    {JSON.stringify(activity.details, null, 2)}
                  </p>
                )}
                
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(activity.created_at), {
                    addSuffix: true,
                    locale: ptBR
                  })}
                </p>
              </div>
            </div>
          </Card>
        ))}

        {activities?.length === 0 && (
          <Card className="p-8 text-center text-muted-foreground">
            Nenhuma atividade registrada ainda
          </Card>
        )}
      </div>
    </div>
  );
};

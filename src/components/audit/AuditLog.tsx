import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { UpgradePrompt } from "@/components/subscription/UpgradePrompt";
import { 
  Clock, 
  FileText, 
  Target, 
  TrendingUp, 
  Users, 
  Plus, 
  Edit, 
  Trash2,
  Lock,
  AlertCircle 
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AuditEntry {
  id: string;
  action_type: string;
  entity_type: string;
  entity_id: string;
  user_id: string;
  details: any;
  created_at: string;
  user_email?: string;
}

interface AuditLogProps {
  companyId: string;
}

const actionIcons: Record<string, any> = {
  create: Plus,
  update: Edit,
  delete: Trash2,
};

const actionColors: Record<string, string> = {
  create: "text-green-500",
  update: "text-blue-500",
  delete: "text-red-500",
};

const entityIcons: Record<string, any> = {
  objective: Target,
  initiative: FileText,
  metric: TrendingUp,
  team_member: Users,
};

export const AuditLog = ({ companyId }: AuditLogProps) => {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  
  const { hasFeature, tier } = useSubscriptionLimits(companyId);
  const hasAuditLog = hasFeature('audit_log');

  useEffect(() => {
    if (!hasAuditLog) {
      setLoading(false);
      return;
    }
    
    loadAuditLogs();
  }, [companyId, hasAuditLog, filter]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from("activity_log")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(100);

      if (filter !== "all") {
        query = query.eq("entity_type", filter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Enrich with user emails
      const userIds = [...new Set(data?.map(log => log.user_id) || [])];
      const { data: profiles } = await supabase
        .from("companies")
        .select("owner_user_id");

      const enrichedLogs = data?.map(log => ({
        ...log,
        user_email: "Usuário", // Simplified for now
      })) || [];

      setLogs(enrichedLogs);
    } catch (error) {
      console.error("Error loading audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      create: "Criou",
      update: "Atualizou",
      delete: "Deletou",
    };
    return labels[action] || action;
  };

  const getEntityLabel = (entity: string) => {
    const labels: Record<string, string> = {
      objective: "Objetivo",
      initiative: "Iniciativa",
      metric: "Métrica",
      team_member: "Membro da Equipe",
      company: "Empresa",
      ogsm: "Plano OGSM",
    };
    return labels[entity] || entity;
  };

  if (!hasAuditLog) {
    return (
      <>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Histórico e Audit Log - Feature Enterprise</CardTitle>
            </div>
            <CardDescription>
              O histórico completo de mudanças está disponível apenas no plano Enterprise
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-4 border rounded-lg bg-muted/50">
              <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold mb-2">Por que Audit Log?</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Rastreie todas as mudanças em objetivos e iniciativas</li>
                  <li>• Veja quem fez cada alteração e quando</li>
                  <li>• Mantenha conformidade e governança</li>
                  <li>• Reverta mudanças indesejadas com contexto completo</li>
                  <li>• Auditoria completa para certificações e compliance</li>
                </ul>
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
          feature="Audit Log"
        />
      </>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Histórico de Mudanças
        </CardTitle>
        <CardDescription>
          Registro completo de todas as atividades na empresa
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={filter} onValueChange={setFilter} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="objective">Objetivos</TabsTrigger>
            <TabsTrigger value="initiative">Iniciativas</TabsTrigger>
            <TabsTrigger value="metric">Métricas</TabsTrigger>
            <TabsTrigger value="team_member">Equipe</TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="space-y-4">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando histórico...
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma atividade registrada ainda
              </div>
            ) : (
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-3">
                  {logs.map((log) => {
                    const ActionIcon = actionIcons[log.action_type] || FileText;
                    const EntityIcon = entityIcons[log.entity_type] || FileText;
                    
                    return (
                      <div
                        key={log.id}
                        className="flex gap-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <ActionIcon className={`h-5 w-5 ${actionColors[log.action_type]}`} />
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {getActionLabel(log.action_type)}
                            </Badge>
                            <EntityIcon className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {getEntityLabel(log.entity_type)}
                            </span>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2">
                            por {log.user_email}
                          </p>
                          
                          {log.details && Object.keys(log.details).length > 0 && (
                            <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2 mt-2">
                              <pre className="whitespace-pre-wrap font-mono">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </div>
                          )}
                          
                          <p className="text-xs text-muted-foreground mt-2">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {formatDistanceToNow(new Date(log.created_at), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>

        <div className="mt-4 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={loadAuditLogs}
            className="w-full"
          >
            Atualizar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

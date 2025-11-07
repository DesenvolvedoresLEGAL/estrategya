import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CheckItem {
  id: string;
  label: string;
  checked: boolean;
  priority: 'high' | 'medium' | 'low';
}

export const TestChecklistValidator = () => {
  const [freeChecks, setFreeChecks] = useState<CheckItem[]>([
    { id: "free-1", label: "Bloqueado ao criar 2ª empresa", checked: false, priority: 'high' },
    { id: "free-2", label: "Bloqueado ao criar 4º objetivo", checked: false, priority: 'high' },
    { id: "free-3", label: "Bloqueado ao criar 4ª iniciativa", checked: false, priority: 'high' },
    { id: "free-4", label: "PDF com marca d'água 'Criado com LEGAL Strategic Planner'", checked: false, priority: 'high' },
    { id: "free-5", label: "ICE Score bloqueado com modal de upgrade", checked: false, priority: 'medium' },
    { id: "free-6", label: "5W2H bloqueado com modal de upgrade", checked: false, priority: 'medium' },
    { id: "free-7", label: "Templates customizados bloqueados", checked: false, priority: 'low' },
    { id: "free-8", label: "Dashboard ICE bloqueado", checked: false, priority: 'medium' },
  ]);

  const [proChecks, setProChecks] = useState<CheckItem[]>([
    { id: "pro-1", label: "Pode criar múltiplas empresas (ilimitado)", checked: false, priority: 'high' },
    { id: "pro-2", label: "Até 3 planos OGSM ativos", checked: false, priority: 'medium' },
    { id: "pro-3", label: "Objetivos ilimitados", checked: false, priority: 'high' },
    { id: "pro-4", label: "Iniciativas ilimitadas", checked: false, priority: 'high' },
    { id: "pro-5", label: "ICE Score Dashboard completo liberado", checked: false, priority: 'high' },
    { id: "pro-6", label: "5W2H Wizard liberado", checked: false, priority: 'high' },
    { id: "pro-7", label: "PDF sem marca d'água", checked: false, priority: 'high' },
    { id: "pro-8", label: "Templates prontos disponíveis", checked: false, priority: 'medium' },
    { id: "pro-9", label: "Integrações externas bloqueadas", checked: false, priority: 'low' },
    { id: "pro-10", label: "4DX/WBR simplificado", checked: false, priority: 'medium' },
  ]);

  const [enterpriseChecks, setEnterpriseChecks] = useState<CheckItem[]>([
    { id: "ent-1", label: "Empresas ilimitadas", checked: false, priority: 'high' },
    { id: "ent-2", label: "Planos OGSM ilimitados", checked: false, priority: 'high' },
    { id: "ent-3", label: "Objetivos ilimitados", checked: false, priority: 'high' },
    { id: "ent-4", label: "Iniciativas ilimitadas", checked: false, priority: 'high' },
    { id: "ent-5", label: "ICE Score completo", checked: false, priority: 'high' },
    { id: "ent-6", label: "5W2H completo", checked: false, priority: 'high' },
    { id: "ent-7", label: "PDF exportação premium", checked: false, priority: 'high' },
    { id: "ent-8", label: "Templates customizados", checked: false, priority: 'medium' },
    { id: "ent-9", label: "Integrações externas liberadas", checked: false, priority: 'medium' },
    { id: "ent-10", label: "4DX/WBR completo", checked: false, priority: 'medium' },
    { id: "ent-11", label: "Time ilimitado", checked: false, priority: 'high' },
    { id: "ent-12", label: "Suporte prioritário", checked: false, priority: 'low' },
  ]);

  const toggleCheck = (
    tier: 'free' | 'pro' | 'enterprise',
    id: string
  ) => {
    const updateChecks = (checks: CheckItem[]) =>
      checks.map(check =>
        check.id === id ? { ...check, checked: !check.checked } : check
      );

    if (tier === 'free') setFreeChecks(updateChecks(freeChecks));
    if (tier === 'pro') setProChecks(updateChecks(proChecks));
    if (tier === 'enterprise') setEnterpriseChecks(updateChecks(enterpriseChecks));
  };

  const calculateProgress = (checks: CheckItem[]) => {
    const total = checks.length;
    const completed = checks.filter(c => c.checked).length;
    return { total, completed, percentage: Math.round((completed / total) * 100) };
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, any> = {
      high: { variant: "destructive", label: "Alta" },
      medium: { variant: "default", label: "Média" },
      low: { variant: "secondary", label: "Baixa" },
    };
    const config = variants[priority];
    return <Badge variant={config.variant} className="text-xs">{config.label}</Badge>;
  };

  const ChecklistSection = ({ 
    checks, 
    tier, 
    title,
    description 
  }: { 
    checks: CheckItem[]; 
    tier: 'free' | 'pro' | 'enterprise';
    title: string;
    description: string;
  }) => {
    const progress = calculateProgress(checks);
    const highPriorityIncomplete = checks.filter(c => c.priority === 'high' && !c.checked).length;

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {progress.completed}/{progress.total}
              </div>
              <p className="text-sm text-muted-foreground">{progress.percentage}% completo</p>
            </div>
          </div>
          
          {highPriorityIncomplete > 0 && (
            <div className="flex items-center gap-2 mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm text-destructive font-medium">
                {highPriorityIncomplete} testes de alta prioridade pendentes
              </span>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {checks.map((check) => (
              <div
                key={check.id}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  check.checked ? 'bg-primary/5 border-primary/20' : 'bg-card'
                }`}
              >
                <Checkbox
                  id={check.id}
                  checked={check.checked}
                  onCheckedChange={() => toggleCheck(tier, check.id)}
                />
                <div className="flex-1">
                  <label
                    htmlFor={check.id}
                    className={`text-sm cursor-pointer ${
                      check.checked ? 'line-through text-muted-foreground' : ''
                    }`}
                  >
                    {check.label}
                  </label>
                </div>
                {getPriorityBadge(check.priority)}
                {check.checked ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const allChecks = [...freeChecks, ...proChecks, ...enterpriseChecks];
  const overallProgress = calculateProgress(allChecks);

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card className="border-2 border-primary">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Progresso Geral da Validação</h3>
              <p className="text-sm text-muted-foreground">
                Checklist completo de todas as features
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-primary">
                {overallProgress.percentage}%
              </div>
              <p className="text-sm text-muted-foreground">
                {overallProgress.completed} de {overallProgress.total} testes
              </p>
            </div>
          </div>
          
          <div className="w-full bg-secondary rounded-full h-3">
            <div
              className="bg-primary h-3 rounded-full transition-all duration-500"
              style={{ width: `${overallProgress.percentage}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Checklists por Plano */}
      <Tabs defaultValue="free" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="free">
            FREE ({calculateProgress(freeChecks).completed}/{freeChecks.length})
          </TabsTrigger>
          <TabsTrigger value="pro">
            PRO ({calculateProgress(proChecks).completed}/{proChecks.length})
          </TabsTrigger>
          <TabsTrigger value="enterprise">
            ENTERPRISE ({calculateProgress(enterpriseChecks).completed}/{enterpriseChecks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="free">
          <ChecklistSection
            checks={freeChecks}
            tier="free"
            title="Validação Plano FREE"
            description="Verificar todos os bloqueios e limitações do plano gratuito"
          />
        </TabsContent>

        <TabsContent value="pro">
          <ChecklistSection
            checks={proChecks}
            tier="pro"
            title="Validação Plano PRO"
            description="Verificar features liberadas e limites do plano PRO"
          />
        </TabsContent>

        <TabsContent value="enterprise">
          <ChecklistSection
            checks={enterpriseChecks}
            tier="enterprise"
            title="Validação Plano ENTERPRISE"
            description="Verificar acesso completo a todas as features"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
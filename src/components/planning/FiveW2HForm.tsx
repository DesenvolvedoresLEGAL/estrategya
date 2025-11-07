import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Save, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { UpgradePrompt } from "@/components/subscription/UpgradePrompt";
import { Badge } from "@/components/ui/badge";

interface FiveW2HFormProps {
  initiativeId: string;
  initiativeTitle: string;
  initiativeDescription?: string;
  objectiveTitle?: string;
  companyData?: any;
  companyId?: string;
  initialData?: {
    what?: string;
    why?: string;
    who?: string;
    when_deadline?: string;
    where_location?: string;
    how?: string;
    how_much?: number;
  };
  onSave?: () => void;
}

export const FiveW2HForm = ({
  initiativeId,
  initiativeTitle,
  initiativeDescription,
  objectiveTitle,
  companyData,
  companyId,
  initialData,
  onSave,
}: FiveW2HFormProps) => {
  const [loading, setLoading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  
  const { hasFeature } = useSubscriptionLimits(companyId);
  
  const [what, setWhat] = useState(initialData?.what || "");
  const [why, setWhy] = useState(initialData?.why || "");
  const [who, setWho] = useState(initialData?.who || "");
  const [whenDeadline, setWhenDeadline] = useState(initialData?.when_deadline || "");
  const [whereLocation, setWhereLocation] = useState(initialData?.where_location || "");
  const [how, setHow] = useState(initialData?.how || "");
  const [howMuch, setHowMuch] = useState(initialData?.how_much?.toString() || "");

  const has5W2HFeature = hasFeature('5w2h');

  if (!has5W2HFeature) {
    return (
      <>
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 relative overflow-hidden">
          <div className="absolute top-4 right-4">
            <Badge className="bg-primary text-primary-foreground">PRO</Badge>
          </div>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              <CardTitle>5W2H - Plano de Ação - Recurso PRO</CardTitle>
            </div>
            <CardDescription>
              Transforme iniciativas em planos de ação executáveis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              O método 5W2H responde 7 perguntas fundamentais para estruturar qualquer iniciativa:
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-card border rounded-lg">
                <strong className="text-primary">What</strong> - O que será feito?
              </div>
              <div className="p-3 bg-card border rounded-lg">
                <strong className="text-primary">Why</strong> - Por que é importante?
              </div>
              <div className="p-3 bg-card border rounded-lg">
                <strong className="text-primary">Who</strong> - Quem é o responsável?
              </div>
              <div className="p-3 bg-card border rounded-lg">
                <strong className="text-primary">When</strong> - Quando? (Prazo)
              </div>
              <div className="p-3 bg-card border rounded-lg">
                <strong className="text-primary">Where</strong> - Onde será executado?
              </div>
              <div className="p-3 bg-card border rounded-lg">
                <strong className="text-primary">How</strong> - Como será feito?
              </div>
              <div className="p-3 bg-card border rounded-lg col-span-2">
                <strong className="text-primary">How Much</strong> - Quanto custará?
              </div>
            </div>
            <div className="bg-primary/10 p-4 rounded-lg text-sm mt-4">
              <strong>Bônus PRO:</strong> Geração automática com IA baseada na iniciativa e objetivo estratégico
            </div>
            <Button 
              onClick={() => setShowUpgradePrompt(true)} 
              className="w-full" 
              size="lg"
            >
              Fazer Upgrade para PRO
            </Button>
          </CardContent>
        </Card>
        
        <UpgradePrompt
          open={showUpgradePrompt}
          onOpenChange={setShowUpgradePrompt}
          feature="5W2H"
        />
      </>
    );
  }

  const handleGenerateWithAI = async () => {
    setAiGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-5w2h', {
        body: {
          initiative: {
            title: initiativeTitle,
            description: initiativeDescription,
          },
          objective: { title: objectiveTitle },
          company: companyData,
        }
      });

      if (error) throw error;

      // Preencher os campos com os dados da IA
      setWhat(data.what || "");
      setWhy(data.why || "");
      setWho(data.who || "");
      
      // Calcular data sugerida
      if (data.when && typeof data.when === 'number') {
        const suggestedDate = new Date();
        suggestedDate.setDate(suggestedDate.getDate() + data.when);
        setWhenDeadline(suggestedDate.toISOString().split('T')[0]);
      }
      
      setWhereLocation(data.where || "");
      setHow(data.how || "");
      setHowMuch(data.how_much?.toString() || "");

      toast.success("5W2H gerado com IA! Revise e ajuste se necessário.");
    } catch (error: any) {
      console.error('Erro ao gerar 5W2H:', error);
      toast.error(error.message || 'Erro ao gerar 5W2H com IA');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('initiatives')
        .update({
          what,
          why,
          who,
          when_deadline: whenDeadline || null,
          where_location: whereLocation,
          how,
          how_much: howMuch ? parseFloat(howMuch) : null,
        })
        .eq('id', initiativeId);

      if (error) throw error;

      toast.success("5W2H salvo com sucesso!");
      onSave?.();
    } catch (error: any) {
      console.error('Erro ao salvar 5W2H:', error);
      toast.error('Erro ao salvar 5W2H');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>5W2H - Plano de Ação</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateWithAI}
            disabled={aiGenerating}
          >
            {aiGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Preencher com IA
              </>
            )}
          </Button>
        </div>
        <CardDescription>
          Transforme a iniciativa em um plano de ação executável
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* What */}
        <div className="space-y-2">
          <Label htmlFor="what" className="text-base font-semibold">
            What (O que será feito?)
          </Label>
          <Textarea
            id="what"
            value={what}
            onChange={(e) => setWhat(e.target.value)}
            placeholder="Descreva claramente o que será executado..."
            className="min-h-[80px]"
          />
        </div>

        {/* Why */}
        <div className="space-y-2">
          <Label htmlFor="why" className="text-base font-semibold">
            Why (Por que é importante?)
          </Label>
          <Textarea
            id="why"
            value={why}
            onChange={(e) => setWhy(e.target.value)}
            placeholder="Explique o vínculo estratégico e o impacto esperado..."
            className="min-h-[80px]"
          />
        </div>

        {/* Who */}
        <div className="space-y-2">
          <Label htmlFor="who" className="text-base font-semibold">
            Who (Quem é o responsável?)
          </Label>
          <Input
            id="who"
            value={who}
            onChange={(e) => setWho(e.target.value)}
            placeholder="Ex: Gerente de Marketing, Equipe de Vendas..."
          />
        </div>

        {/* When */}
        <div className="space-y-2">
          <Label htmlFor="when" className="text-base font-semibold">
            When (Quando? Prazo)
          </Label>
          <Input
            id="when"
            type="date"
            value={whenDeadline}
            onChange={(e) => setWhenDeadline(e.target.value)}
          />
        </div>

        {/* Where */}
        <div className="space-y-2">
          <Label htmlFor="where" className="text-base font-semibold">
            Where (Onde será executado?)
          </Label>
          <Input
            id="where"
            value={whereLocation}
            onChange={(e) => setWhereLocation(e.target.value)}
            placeholder="Ex: Online - Redes Sociais, Presencial - Loja..."
          />
        </div>

        {/* How */}
        <div className="space-y-2">
          <Label htmlFor="how" className="text-base font-semibold">
            How (Como será executado?)
          </Label>
          <Textarea
            id="how"
            value={how}
            onChange={(e) => setHow(e.target.value)}
            placeholder="Descreva os principais passos de execução..."
            className="min-h-[120px]"
          />
        </div>

        {/* How Much */}
        <div className="space-y-2">
          <Label htmlFor="howMuch" className="text-base font-semibold">
            How Much (Quanto custará?)
          </Label>
          <Input
            id="howMuch"
            type="number"
            value={howMuch}
            onChange={(e) => setHowMuch(e.target.value)}
            placeholder="Estimativa de investimento em R$"
            min="0"
            step="0.01"
          />
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={loading}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar 5W2H
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

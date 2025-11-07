import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface FiveW2HFormProps {
  initiativeId: string;
  initiativeTitle: string;
  initiativeDescription?: string;
  objectiveTitle?: string;
  companyData?: any;
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
  initialData,
  onSave,
}: FiveW2HFormProps) => {
  const [loading, setLoading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  
  const [what, setWhat] = useState(initialData?.what || "");
  const [why, setWhy] = useState(initialData?.why || "");
  const [who, setWho] = useState(initialData?.who || "");
  const [whenDeadline, setWhenDeadline] = useState(initialData?.when_deadline || "");
  const [whereLocation, setWhereLocation] = useState(initialData?.where_location || "");
  const [how, setHow] = useState(initialData?.how || "");
  const [howMuch, setHowMuch] = useState(initialData?.how_much?.toString() || "");

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

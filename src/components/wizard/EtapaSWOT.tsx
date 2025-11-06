import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, TrendingUp, TrendingDown, Target, AlertTriangle } from "lucide-react";

interface Props {
  companyData: any;
  initialData: any;
  onNext: (data: any) => void;
  onBack: () => void;
}

export const EtapaSWOT = ({ companyData, initialData, onNext, onBack }: Props) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    strengths: initialData?.strengths?.join('\n') || "",
    weaknesses: initialData?.weaknesses?.join('\n') || "",
    opportunities: initialData?.opportunities?.join('\n') || "",
    threats: initialData?.threats?.join('\n') || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);

    try {
      const swotData = {
        company_id: companyData.id,
        strengths: formData.strengths.split('\n').filter(s => s.trim()),
        weaknesses: formData.weaknesses.split('\n').filter(s => s.trim()),
        opportunities: formData.opportunities.split('\n').filter(s => s.trim()),
        threats: formData.threats.split('\n').filter(s => s.trim()),
      };

      let contextId = initialData?.id;

      if (contextId) {
        // Atualizar SWOT existente
        const { error } = await supabase
          .from('strategic_context')
          .update(swotData)
          .eq('id', contextId);

        if (error) throw error;
      } else {
        // Criar novo SWOT
        const { data, error } = await supabase
          .from('strategic_context')
          .insert(swotData)
          .select()
          .single();

        if (error) throw error;
        contextId = data.id;
      }

      toast.success("Diagnóstico salvo!");
      onNext({ ...swotData, id: contextId });
    } catch (error: any) {
      console.error('Error saving SWOT:', error);
      toast.error("Erro ao salvar diagnóstico: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Diagnóstico Rápido (SWOT)</CardTitle>
          <CardDescription>
            Liste os principais pontos de cada categoria. Adicione um por linha.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Forças */}
              <div className="space-y-2">
                <Label htmlFor="strengths" className="flex items-center gap-2 text-success">
                  <TrendingUp className="w-5 h-5" />
                  Forças (Strengths)
                </Label>
                <p className="text-sm text-muted-foreground mb-2">
                  O que você faz melhor que o mercado?
                </p>
                <Textarea
                  id="strengths"
                  value={formData.strengths}
                  onChange={(e) => setFormData({ ...formData, strengths: e.target.value })}
                  placeholder="Ex: Equipe técnica experiente&#10;Ex: Atendimento diferenciado&#10;Ex: Tecnologia própria"
                  rows={6}
                  className="font-mono text-sm"
                />
              </div>

              {/* Fraquezas */}
              <div className="space-y-2">
                <Label htmlFor="weaknesses" className="flex items-center gap-2 text-destructive">
                  <TrendingDown className="w-5 h-5" />
                  Fraquezas (Weaknesses)
                </Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Onde você precisa melhorar?
                </p>
                <Textarea
                  id="weaknesses"
                  value={formData.weaknesses}
                  onChange={(e) => setFormData({ ...formData, weaknesses: e.target.value })}
                  placeholder="Ex: Poucos vendedores&#10;Ex: Marketing fraco&#10;Ex: Processos manuais"
                  rows={6}
                  className="font-mono text-sm"
                />
              </div>

              {/* Oportunidades */}
              <div className="space-y-2">
                <Label htmlFor="opportunities" className="flex items-center gap-2 text-primary">
                  <Target className="w-5 h-5" />
                  Oportunidades (Opportunities)
                </Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Que oportunidades você vê no mercado?
                </p>
                <Textarea
                  id="opportunities"
                  value={formData.opportunities}
                  onChange={(e) => setFormData({ ...formData, opportunities: e.target.value })}
                  placeholder="Ex: Mercado em crescimento&#10;Ex: Poucos concorrentes&#10;Ex: Novas tecnologias"
                  rows={6}
                  className="font-mono text-sm"
                />
              </div>

              {/* Ameaças */}
              <div className="space-y-2">
                <Label htmlFor="threats" className="flex items-center gap-2 text-warning">
                  <AlertTriangle className="w-5 h-5" />
                  Ameaças (Threats)
                </Label>
                <p className="text-sm text-muted-foreground mb-2">
                  O que pode prejudicar seu negócio?
                </p>
                <Textarea
                  id="threats"
                  value={formData.threats}
                  onChange={(e) => setFormData({ ...formData, threats: e.target.value })}
                  placeholder="Ex: Concorrentes grandes&#10;Ex: Mudanças regulatórias&#10;Ex: Crise econômica"
                  rows={6}
                  className="font-mono text-sm"
                />
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button type="button" variant="outline" onClick={onBack}>
                <ArrowLeft className="mr-2 w-4 h-4" />
                Voltar
              </Button>
              <Button type="submit" disabled={loading} size="lg">
                {loading ? "Salvando..." : "Próximo"}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

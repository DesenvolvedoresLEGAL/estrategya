import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Target, TrendingDown, Zap, ShieldAlert, AlertCircle, Lightbulb, Save } from "lucide-react";
import { swotSchema } from "@/lib/validations/wizard";
import { z } from "zod";
import { SegmentExamplesModal } from "./SegmentExamplesModal";

interface Props {
  companyData: any;
  initialData: any;
  onNext: (data: any) => void;
  onBack: () => void;
  onSaveAndExit?: () => Promise<void>;
}

export const EtapaSWOT = ({ companyData, initialData, onNext, onBack, onSaveAndExit }: Props) => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    strengths: initialData?.strengths?.join("\n") || "",
    weaknesses: initialData?.weaknesses?.join("\n") || "",
    opportunities: initialData?.opportunities?.join("\n") || "",
    threats: initialData?.threats?.join("\n") || "",
  });
  const [examples, setExamples] = useState<any>(null);
  const [showExamplesModal, setShowExamplesModal] = useState(false);

  useEffect(() => {
    if (companyData?.segment) {
      loadSegmentExamples();
    }
  }, [companyData?.segment]);

  const loadSegmentExamples = async () => {
    try {
      const { data, error } = await supabase
        .from('segment_templates')
        .select('template_data')
        .eq('segment', companyData.segment)
        .eq('template_type', 'swot')
        .maybeSingle();
      
      if (error) throw error;
      if (data) {
        setExamples(data.template_data);
      }
    } catch (error) {
      console.error('Error loading segment examples:', error);
    }
  };

  const handleUseExample = (field: string, example: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field] ? `${prev[field]}\n${example}` : example
    }));
    toast.success('Exemplo adicionado!');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!companyData?.id) {
      toast.error("Dados da empresa não encontrados");
      return;
    }

    // Validação com Zod
    try {
      swotSchema.parse(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
        toast.error("Por favor, preencha todos os campos corretamente");
        return;
      }
    }

    setLoading(true);

    try {
      const swotArray = {
        strengths: formData.strengths.split("\n").filter(s => s.trim()),
        weaknesses: formData.weaknesses.split("\n").filter(s => s.trim()),
        opportunities: formData.opportunities.split("\n").filter(s => s.trim()),
        threats: formData.threats.split("\n").filter(s => s.trim()),
      };

      if (initialData?.id) {
        // Atualizar SWOT existente
        const { error } = await supabase
          .from('strategic_context')
          .update(swotArray)
          .eq('id', initialData.id);

        if (error) throw error;
      } else {
        // Criar novo SWOT
        const { data, error } = await supabase
          .from('strategic_context')
          .insert({
            ...swotArray,
            company_id: companyData.id,
          })
          .select()
          .single();

        if (error) throw error;
      }

      toast.success("Análise SWOT salva com sucesso!");
      onNext(swotArray);
    } catch (error: any) {
      console.error('Error saving SWOT:', error);
      toast.error(error.message || "Erro ao salvar análise SWOT");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Análise SWOT</CardTitle>
            <CardDescription>
              Identifique os pontos fortes, fracos, oportunidades e ameaças da sua empresa
            </CardDescription>
          </div>
          {examples && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowExamplesModal(true)}
            >
              <Lightbulb className="w-4 h-4 mr-2" />
              Ver exemplos para {companyData.segment}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {Object.keys(errors).length > 0 && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Por favor, preencha todos os campos com pelo menos 10 caracteres.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              <Label htmlFor="strengths">Forças (Strengths) *</Label>
            </div>
            <Textarea
              id="strengths"
              value={formData.strengths}
              onChange={(e) => {
                setFormData({ ...formData, strengths: e.target.value });
                if (errors.strengths) setErrors({ ...errors, strengths: "" });
              }}
              placeholder="Liste os pontos fortes da empresa (uma por linha)&#10;Ex: Equipe técnica altamente qualificada&#10;Ex: Base de clientes fiéis"
              rows={5}
              className={errors.strengths ? "border-destructive" : ""}
              required
            />
            {errors.strengths && (
              <p className="text-sm text-destructive">{errors.strengths}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Digite cada força em uma nova linha
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-orange-500" />
              <Label htmlFor="weaknesses">Fraquezas (Weaknesses) *</Label>
            </div>
            <Textarea
              id="weaknesses"
              value={formData.weaknesses}
              onChange={(e) => {
                setFormData({ ...formData, weaknesses: e.target.value });
                if (errors.weaknesses) setErrors({ ...errors, weaknesses: "" });
              }}
              placeholder="Liste os pontos fracos que precisam ser melhorados (uma por linha)&#10;Ex: Processos manuais&#10;Ex: Dependência de fornecedores"
              rows={5}
              className={errors.weaknesses ? "border-destructive" : ""}
              required
            />
            {errors.weaknesses && (
              <p className="text-sm text-destructive">{errors.weaknesses}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Digite cada fraqueza em uma nova linha
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-green-500" />
              <Label htmlFor="opportunities">Oportunidades (Opportunities) *</Label>
            </div>
            <Textarea
              id="opportunities"
              value={formData.opportunities}
              onChange={(e) => {
                setFormData({ ...formData, opportunities: e.target.value });
                if (errors.opportunities) setErrors({ ...errors, opportunities: "" });
              }}
              placeholder="Liste oportunidades do mercado (uma por linha)&#10;Ex: Expansão para novas regiões&#10;Ex: Demanda crescente por serviços digitais"
              rows={5}
              className={errors.opportunities ? "border-destructive" : ""}
              required
            />
            {errors.opportunities && (
              <p className="text-sm text-destructive">{errors.opportunities}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Digite cada oportunidade em uma nova linha
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-500" />
              <Label htmlFor="threats">Ameaças (Threats) *</Label>
            </div>
            <Textarea
              id="threats"
              value={formData.threats}
              onChange={(e) => {
                setFormData({ ...formData, threats: e.target.value });
                if (errors.threats) setErrors({ ...errors, threats: "" });
              }}
              placeholder="Liste as ameaças externas (uma por linha)&#10;Ex: Entrada de novos concorrentes&#10;Ex: Mudanças regulatórias"
              rows={5}
              className={errors.threats ? "border-destructive" : ""}
              required
            />
            {errors.threats && (
              <p className="text-sm text-destructive">{errors.threats}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Digite cada ameaça em uma nova linha
            </p>
          </div>

          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={onBack}>
              <ArrowLeft className="mr-2 w-4 h-4" />
              Voltar
            </Button>
            <div className="flex gap-2">
              {onSaveAndExit && (
                <Button 
                  type="button"
                  variant="ghost" 
                  onClick={onSaveAndExit}
                  disabled={loading}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Salvar e Sair
                </Button>
              )}
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : "Próximo"}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
      </form>
    </CardContent>

    {examples && (
      <SegmentExamplesModal
        open={showExamplesModal}
        onOpenChange={setShowExamplesModal}
        segment={companyData.segment}
        examples={examples}
        onUseExample={handleUseExample}
      />
    )}
  </Card>
);
};

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowRight, FileUp, AlertCircle } from "lucide-react";
import { FileUploadZone } from "./FileUploadZone";
import { companyContextSchema } from "@/lib/validations/wizard";
import { z } from "zod";

const segmentos = [
  "Eventos",
  "Telecom",
  "Serviços",
  "SaaS",
  "Indústria",
  "Educação",
  "Saúde",
  "Varejo",
  "Outro"
];

const modelos = ["B2B", "B2C", "Híbrido"];

interface Props {
  initialData: any;
  onNext: (data: any) => void;
  userId: string;
}

export const EtapaContexto = ({ initialData, onNext, userId }: Props) => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    segment: initialData?.segment || "",
    model: initialData?.model || "",
    size_team: initialData?.size_team || "",
    region: initialData?.region || "",
    main_challenge: initialData?.main_challenge || "",
    mission: initialData?.mission || "",
    vision: initialData?.vision || "",
    values: initialData?.values || "",
  });
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    // Validação com Zod
    try {
      companyContextSchema.parse(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
        toast.error("Por favor, corrija os erros no formulário");
        return;
      }
    }

    setLoading(true);

    try {
      let companyId = initialData?.id;

      if (companyId) {
        // Atualizar empresa existente
        const { error } = await supabase
          .from('companies')
          .update({
            name: formData.name.trim(),
            segment: formData.segment,
            model: formData.model,
            size_team: formData.size_team ? parseInt(formData.size_team) : null,
            region: formData.region?.trim() || null,
            main_challenge: formData.main_challenge?.trim() || null,
            mission: formData.mission?.trim() || null,
            vision: formData.vision?.trim() || null,
            values: formData.values?.trim() || null,
          })
          .eq('id', companyId);

        if (error) throw error;
      } else {
        // Criar nova empresa
        const { data, error } = await supabase
          .from('companies')
          .insert({
            name: formData.name.trim(),
            segment: formData.segment,
            model: formData.model,
            size_team: formData.size_team ? parseInt(formData.size_team) : null,
            region: formData.region?.trim() || null,
            main_challenge: formData.main_challenge?.trim() || null,
            mission: formData.mission?.trim() || null,
            vision: formData.vision?.trim() || null,
            values: formData.values?.trim() || null,
            owner_user_id: userId,
          })
          .select()
          .single();

        if (error) throw error;
        companyId = data.id;
      }

      toast.success("Contexto salvo com sucesso!");
      onNext({ ...formData, id: companyId });
    } catch (error: any) {
      console.error('Error saving company:', error);
      toast.error(error.message || "Erro ao salvar dados da empresa");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Conte-nos sobre sua empresa</CardTitle>
        <CardDescription>
          Vamos começar entendendo o contexto do seu negócio
        </CardDescription>
      </CardHeader>
      <CardContent>
        {Object.keys(errors).length > 0 && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Por favor, corrija os erros destacados no formulário.
            </AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Empresa *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: "" });
              }}
              placeholder="Ex: LEGAL Telecom"
              className={errors.name ? "border-destructive" : ""}
              required
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="segment">Segmento *</Label>
              <Select
                value={formData.segment}
                onValueChange={(value) => {
                  setFormData({ ...formData, segment: value });
                  if (errors.segment) setErrors({ ...errors, segment: "" });
                }}
                required
              >
                <SelectTrigger className={errors.segment ? "border-destructive" : ""}>
                  <SelectValue placeholder="Selecione o segmento" />
                </SelectTrigger>
                <SelectContent>
                  {segmentos.map((seg) => (
                    <SelectItem key={seg} value={seg.toLowerCase()}>
                      {seg}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.segment && (
                <p className="text-sm text-destructive">{errors.segment}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Modelo de Negócio *</Label>
              <Select
                value={formData.model}
                onValueChange={(value) => setFormData({ ...formData, model: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o modelo" />
                </SelectTrigger>
                <SelectContent>
                  {modelos.map((mod) => (
                    <SelectItem key={mod} value={mod}>
                      {mod}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="size_team">Tamanho do Time</Label>
              <Input
                id="size_team"
                type="number"
                value={formData.size_team}
                onChange={(e) => setFormData({ ...formData, size_team: e.target.value })}
                placeholder="Ex: 15"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="region">Região de Atuação</Label>
              <Input
                id="region"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                placeholder="Ex: Sul do Brasil"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="main_challenge">Principal Desafio Atual</Label>
            <Textarea
              id="main_challenge"
              value={formData.main_challenge}
              onChange={(e) => setFormData({ ...formData, main_challenge: e.target.value })}
              placeholder="Descreva o maior desafio que sua empresa enfrenta hoje..."
              rows={4}
            />
          </div>

          <div className="border-t pt-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-4">Missão, Visão e Valores</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Defina o propósito e direcionamento estratégico da sua empresa
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mission">Missão</Label>
              <Textarea
                id="mission"
                value={formData.mission}
                onChange={(e) => setFormData({ ...formData, mission: e.target.value })}
                placeholder="Por que sua empresa existe? Qual é o propósito fundamental?"
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {formData.mission.length}/500 caracteres
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vision">Visão</Label>
              <Textarea
                id="vision"
                value={formData.vision}
                onChange={(e) => setFormData({ ...formData, vision: e.target.value })}
                placeholder="Onde sua empresa quer chegar? O que deseja se tornar?"
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {formData.vision.length}/500 caracteres
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="values">Valores</Label>
              <Textarea
                id="values"
                value={formData.values}
                onChange={(e) => setFormData({ ...formData, values: e.target.value })}
                placeholder="Quais são os princípios que guiam as decisões e comportamentos?"
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {formData.values.length}/500 caracteres
              </p>
            </div>
          </div>

          <div className="border-t pt-6 space-y-4">
            <div className="flex items-center gap-2">
              <FileUp className="w-5 h-5 text-primary" />
              <div>
                <h3 className="text-lg font-semibold">Dados Históricos</h3>
                <Badge variant="outline" className="ml-2">Opcional</Badge>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Faça upload de planilhas ou relatórios financeiros para enriquecer a análise estratégica
            </p>
            
            {formData.name && (
              <FileUploadZone 
                companyId={initialData?.id || 'temp'}
                onUploadComplete={(url) => setUploadedFileUrl(url)}
              />
            )}
            
            {!formData.name && (
              <Card className="p-4 bg-muted/50">
                <p className="text-sm text-muted-foreground text-center">
                  Preencha o nome da empresa para habilitar o upload
                </p>
              </Card>
            )}
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={loading} size="lg">
              {loading ? "Salvando..." : "Próximo"}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";

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
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    segment: initialData?.segment || "",
    model: initialData?.model || "",
    size_team: initialData?.size_team || "",
    region: initialData?.region || "",
    main_challenge: initialData?.main_challenge || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.segment || !formData.model) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    setLoading(true);

    try {
      let companyId = initialData?.id;

      if (companyId) {
        // Atualizar empresa existente
        const { error } = await supabase
          .from('companies')
          .update({
            ...formData,
            size_team: parseInt(formData.size_team) || null,
          })
          .eq('id', companyId);

        if (error) throw error;
      } else {
        // Criar nova empresa
        const { data, error } = await supabase
          .from('companies')
          .insert({
            ...formData,
            size_team: parseInt(formData.size_team) || null,
            owner_user_id: userId,
          })
          .select()
          .single();

        if (error) throw error;
        companyId = data.id;
      }

      toast.success("Contexto salvo!");
      onNext({ ...formData, id: companyId });
    } catch (error: any) {
      console.error('Error saving company:', error);
      toast.error("Erro ao salvar dados: " + error.message);
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
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Empresa *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: LEGAL Telecom"
              required
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="segment">Segmento *</Label>
              <Select
                value={formData.segment}
                onValueChange={(value) => setFormData({ ...formData, segment: value })}
                required
              >
                <SelectTrigger>
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

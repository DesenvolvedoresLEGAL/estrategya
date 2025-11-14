import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BSC_PERSPECTIVE_LABELS } from "@/lib/constants/perspectives";

interface AddMetricModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  objectiveId: string;
  objectiveTitle: string;
  objectivePerspective?: string;
  onSuccess: () => void;
}

export const AddMetricModal = ({
  open,
  onOpenChange,
  objectiveId,
  objectiveTitle,
  objectivePerspective,
  onSuccess
}: AddMetricModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    target: "",
    period: "Mensal",
    current_value: "",
    source: "manual"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.target.trim()) {
      toast.error("Por favor, preencha o nome e a meta da métrica");
      return;
    }

    setLoading(true);

    try {
      // Insert metric
      const { error } = await supabase
        .from('metrics')
        .insert({
          objective_id: objectiveId,
          name: formData.name.trim(),
          target: formData.target.trim(),
          period: formData.period,
          current_value: formData.current_value.trim() || null,
          source: formData.source
        });

      if (error) throw error;

      toast.success("Métrica adicionada com sucesso!");
      
      // Reset form
      setFormData({
        name: "",
        target: "",
        period: "Mensal",
        current_value: "",
        source: "manual"
      });
      
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error adding metric:', error);
      toast.error("Erro ao adicionar métrica: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Adicionar Métrica</DialogTitle>
          <div className="space-y-1 mt-2">
            <p className="text-sm text-muted-foreground">
              Objetivo: <span className="font-medium">{objectiveTitle}</span>
            </p>
            {objectivePerspective && (
              <p className="text-sm text-muted-foreground">
                Perspectiva: <span className="font-medium">
                  {BSC_PERSPECTIVE_LABELS[objectivePerspective as keyof typeof BSC_PERSPECTIVE_LABELS] || objectivePerspective}
                </span>
              </p>
            )}
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Métrica *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Taxa de conversão"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="target">Meta *</Label>
            <Input
              id="target"
              value={formData.target}
              onChange={(e) => setFormData({ ...formData, target: e.target.value })}
              placeholder="Ex: 25% ou 1000 unidades"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="period">Período</Label>
            <Select
              value={formData.period}
              onValueChange={(value) => setFormData({ ...formData, period: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Mensal">Mensal</SelectItem>
                <SelectItem value="Trimestral">Trimestral</SelectItem>
                <SelectItem value="Anual">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="current_value">Valor Atual (Opcional)</Label>
            <Input
              id="current_value"
              value={formData.current_value}
              onChange={(e) => setFormData({ ...formData, current_value: e.target.value })}
              placeholder="Ex: 18% ou 750 unidades"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adicionando..." : "Adicionar Métrica"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

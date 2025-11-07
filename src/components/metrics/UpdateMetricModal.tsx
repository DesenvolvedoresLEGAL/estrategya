import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TrendingUp } from "lucide-react";

interface UpdateMetricModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metric: any;
  onUpdateComplete: () => void;
}

export const UpdateMetricModal = ({ 
  open, 
  onOpenChange, 
  metric,
  onUpdateComplete 
}: UpdateMetricModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    value: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.value.trim()) {
      toast.error("Informe o valor da métrica");
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Inserir atualização
      const { error: updateError } = await supabase
        .from('metric_updates')
        .insert({
          metric_id: metric.id,
          value: formData.value,
          notes: formData.notes || null,
          created_by: user.id,
          recorded_at: new Date().toISOString(),
        });

      if (updateError) throw updateError;

      // Atualizar current_value na métrica
      const { error: metricError } = await supabase
        .from('metrics')
        .update({
          current_value: formData.value,
        })
        .eq('id', metric.id);

      if (metricError) throw metricError;

      toast.success("Métrica atualizada com sucesso!");
      setFormData({ value: "", notes: "" });
      onUpdateComplete();
    } catch (error: any) {
      console.error('Error updating metric:', error);
      toast.error("Erro ao atualizar métrica: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Atualizar Métrica
          </DialogTitle>
          <DialogDescription>
            Registre o novo valor e acompanhe a evolução
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Info da Métrica */}
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm">{metric.name}</span>
              <Badge variant="outline">Meta: {metric.target}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Objetivo: {metric.objective?.title}
            </p>
            {metric.current_value && (
              <p className="text-xs">
                Valor atual: <span className="font-medium">{metric.current_value}</span>
              </p>
            )}
          </div>

          {/* Formulário */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="value">
                Novo Valor *
              </Label>
              <Input
                id="value"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder="Ex: 250, 85%, R$ 50.000"
                required
              />
              <p className="text-xs text-muted-foreground">
                Formato livre - use números, porcentagem ou moeda
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">
                Observações
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Contexto, insights ou observações sobre este valor..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar Atualização"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
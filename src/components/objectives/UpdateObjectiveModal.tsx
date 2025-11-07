import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UpdateObjectiveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  objective: {
    id: string;
    title: string;
    current_status?: string;
    current_progress?: number;
  };
  onSuccess: () => void;
}

export const UpdateObjectiveModal = ({ 
  open, 
  onOpenChange, 
  objective,
  onSuccess 
}: UpdateObjectiveModalProps) => {
  const { toast } = useToast();
  const [status, setStatus] = useState(objective.current_status || 'nao_iniciado');
  const [progress, setProgress] = useState(objective.current_progress || 0);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('objective_updates')
        .insert({
          objective_id: objective.id,
          status: status as any,
          progress_percentage: progress,
          notes: notes || null,
          updated_by: user.id
        });

      if (error) throw error;

      toast({
        title: "Objetivo atualizado!",
        description: "As alterações foram salvas com sucesso."
      });

      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setNotes('');
    } catch (error: any) {
      console.error('Error updating objective:', error);
      toast({
        title: "Erro ao atualizar objetivo",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Atualizar Objetivo</DialogTitle>
          <DialogDescription>
            {objective.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nao_iniciado">Não Iniciado</SelectItem>
                <SelectItem value="em_andamento">Em Andamento</SelectItem>
                <SelectItem value="em_risco">Em Risco</SelectItem>
                <SelectItem value="concluido">Concluído</SelectItem>
                <SelectItem value="pausado">Pausado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="progress">
              Progresso: {progress}%
            </Label>
            <Slider
              id="progress"
              value={[progress]}
              onValueChange={(value) => setProgress(value[0])}
              max={100}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Adicione detalhes sobre esta atualização..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Atualização'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

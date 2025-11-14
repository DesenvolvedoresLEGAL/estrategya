import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface AddInitiativeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  objectiveId: string;
  onSuccess: () => void;
  currentInitiativesCount: number;
  maxInitiatives: number;
}

export const AddInitiativeModal = ({ 
  open, 
  onOpenChange, 
  objectiveId, 
  onSuccess,
  currentInitiativesCount,
  maxInitiatives 
}: AddInitiativeModalProps) => {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error("O título é obrigatório");
      return;
    }

    if (currentInitiativesCount >= maxInitiatives) {
      toast.error(`Você atingiu o limite de ${maxInitiatives} iniciativas por objetivo`);
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('initiatives')
        .insert({
          objective_id: objectiveId,
          title: title.trim(),
          description: description.trim() || null,
          status: 'não iniciada',
        });

      if (error) throw error;

      toast.success("Iniciativa adicionada com sucesso!");
      setTitle("");
      setDescription("");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Erro ao adicionar iniciativa:', error);
      toast.error("Erro ao adicionar iniciativa");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Adicionar Nova Iniciativa</DialogTitle>
            <DialogDescription>
              Adicione uma nova iniciativa para este objetivo ({currentInitiativesCount}/{maxInitiatives} utilizadas)
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">
                Título da Iniciativa <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Ex: Implementar novo sistema de CRM"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                disabled={loading}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descreva os detalhes da iniciativa..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                rows={4}
                disabled={loading}
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
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Adicionar Iniciativa
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

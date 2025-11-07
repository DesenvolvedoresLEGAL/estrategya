import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar, CheckCircle2, AlertCircle, Target } from "lucide-react";
import { startOfWeek, differenceInWeeks, format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface WeeklyCheckinModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  executionPlanId: string;
  onSuccess: () => void;
}

export const WeeklyCheckinModal = ({ 
  open, 
  onOpenChange, 
  companyId, 
  executionPlanId,
  onSuccess 
}: WeeklyCheckinModalProps) => {
  const [loading, setLoading] = useState(false);
  const [weekNumber, setWeekNumber] = useState(1);
  const [mciProgress, setMciProgress] = useState(50);
  const [availableActions, setAvailableActions] = useState<string[]>([]);
  const [completedActions, setCompletedActions] = useState<string[]>([]);
  const [blockers, setBlockers] = useState("");
  const [nextWeekCommitments, setNextWeekCommitments] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      loadWeeklyActions();
      calculateWeekNumber();
    }
  }, [open, executionPlanId]);

  const loadWeeklyActions = async () => {
    try {
      const { data, error } = await supabase
        .from('execution_plan')
        .select('weekly_actions')
        .eq('id', executionPlanId)
        .single();

      if (error) throw error;

      if (data?.weekly_actions && Array.isArray(data.weekly_actions)) {
        const actions = data.weekly_actions.map((a: any) => a.action);
        setAvailableActions(actions);
      }
    } catch (error) {
      console.error('Erro ao carregar ações:', error);
    }
  };

  const calculateWeekNumber = async () => {
    try {
      const { data, error } = await supabase
        .from('weekly_checkins')
        .select('week_number, week_start_date')
        .eq('execution_plan_id', executionPlanId)
        .order('week_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      const weekStart = startOfWeek(new Date(), { locale: ptBR });

      if (data) {
        const lastWeekStart = new Date(data.week_start_date);
        const weeksDiff = differenceInWeeks(weekStart, lastWeekStart);
        setWeekNumber(data.week_number + Math.max(1, weeksDiff));
      } else {
        setWeekNumber(1);
      }
    } catch (error) {
      console.error('Erro ao calcular número da semana:', error);
      setWeekNumber(1);
    }
  };

  const handleActionToggle = (action: string) => {
    setCompletedActions(prev => 
      prev.includes(action)
        ? prev.filter(a => a !== action)
        : [...prev, action]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const weekStart = startOfWeek(new Date(), { locale: ptBR });

      const { error } = await supabase
        .from('weekly_checkins')
        .insert({
          execution_plan_id: executionPlanId,
          company_id: companyId,
          week_number: weekNumber,
          week_start_date: weekStart.toISOString().split('T')[0],
          mci_progress: mciProgress,
          completed_actions: completedActions,
          blockers: blockers || null,
          next_week_commitments: nextWeekCommitments || null,
          notes: notes || null,
          conducted_by: user.id,
          attendees: [user.id],
        });

      if (error) throw error;

      toast.success('Check-in semanal registrado com sucesso!');
      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setMciProgress(50);
      setCompletedActions([]);
      setBlockers("");
      setNextWeekCommitments("");
      setNotes("");
    } catch (error: any) {
      console.error('Erro ao registrar check-in:', error);
      toast.error('Erro ao registrar check-in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Check-in Semanal WBR - Semana {weekNumber}
          </DialogTitle>
          <DialogDescription>
            {format(startOfWeek(new Date(), { locale: ptBR }), "dd/MM/yyyy", { locale: ptBR })}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Progresso do MCI */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Progresso do MCI (Meta Crucialmente Importante)
            </Label>
            <div className="flex items-center gap-4">
              <Slider
                value={[mciProgress]}
                onValueChange={(value) => setMciProgress(value[0])}
                min={0}
                max={100}
                step={5}
                className="flex-1"
              />
              <span className="text-xl font-bold text-primary w-16 text-right">
                {mciProgress}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Qual o percentual de conclusão do seu MCI?
            </p>
          </div>

          {/* Ações Concluídas */}
          {availableActions.length > 0 && (
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Ações Concluídas Esta Semana
              </Label>
              <div className="space-y-2 p-4 border rounded-lg bg-muted/30">
                {availableActions.map((action, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Checkbox
                      id={`action-${index}`}
                      checked={completedActions.includes(action)}
                      onCheckedChange={() => handleActionToggle(action)}
                    />
                    <label
                      htmlFor={`action-${index}`}
                      className="text-sm cursor-pointer flex-1"
                    >
                      {action}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bloqueios */}
          <div className="space-y-2">
            <Label htmlFor="blockers" className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Bloqueios e Impedimentos
            </Label>
            <Textarea
              id="blockers"
              value={blockers}
              onChange={(e) => setBlockers(e.target.value)}
              placeholder="Descreva os principais bloqueios ou impedimentos enfrentados..."
              rows={3}
            />
          </div>

          {/* Compromissos para Próxima Semana */}
          <div className="space-y-2">
            <Label htmlFor="commitments">
              Compromissos para Próxima Semana
            </Label>
            <Textarea
              id="commitments"
              value={nextWeekCommitments}
              onChange={(e) => setNextWeekCommitments(e.target.value)}
              placeholder="Quais os principais compromissos e ações para a próxima semana?"
              rows={3}
            />
          </div>

          {/* Notas Adicionais */}
          <div className="space-y-2">
            <Label htmlFor="notes">
              Observações Gerais (opcional)
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Adicione qualquer observação relevante sobre a semana..."
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Registrar Check-in'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface WizardProgressData {
  currentStep: number;
  completedSteps: number[];
  stepData: Record<string, any>;
}

export const useWizardProgress = (userId: string | null, companyId: string | null) => {
  const [progressId, setProgressId] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load progress from database
  const loadProgress = useCallback(async () => {
    if (!userId || !companyId) {
      setIsLoading(false);
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('wizard_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('company_id', companyId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProgressId(data.id);
        setCompletedSteps(data.completed_steps || []);
        setIsLoading(false);
        return {
          currentStep: data.current_step,
          completedSteps: data.completed_steps || [],
          stepData: data.step_data || {},
        };
      }

      setIsLoading(false);
      return null;
    } catch (error) {
      console.error('Error loading progress:', error);
      setIsLoading(false);
      return null;
    }
  }, [userId, companyId]);

  // Save progress to database
  const saveProgress = useCallback(async (
    currentStep: number,
    stepData?: Record<string, any>
  ) => {
    if (!userId || !companyId) return;

    try {
      // Update completed steps
      const newCompletedSteps = Array.from(
        new Set([...completedSteps, currentStep - 1])
      ).filter(step => step > 0);

      const progressData = {
        user_id: userId,
        company_id: companyId,
        current_step: currentStep,
        completed_steps: newCompletedSteps,
        step_data: stepData || {},
        updated_at: new Date().toISOString(),
      };

      if (progressId) {
        // Update existing progress
        const { error } = await supabase
          .from('wizard_progress')
          .update(progressData)
          .eq('id', progressId);

        if (error) throw error;
      } else {
        // Create or update progress atomically (avoid unique constraint violations)
        const { data, error } = await supabase
          .from('wizard_progress')
          .upsert(progressData, { onConflict: 'company_id,user_id' })
          .select()
          .single();

        if (error) throw error;
        setProgressId(data.id);
      }

      setCompletedSteps(newCompletedSteps);
    } catch (error) {
      console.error('Error saving progress:', error);
      toast.error('Erro ao salvar progresso');
    }
  }, [userId, companyId, progressId, completedSteps]);

  // Mark step as completed
  const markStepCompleted = useCallback(async (step: number) => {
    if (!userId || !companyId) return;

    const newCompletedSteps = Array.from(new Set([...completedSteps, step]));
    setCompletedSteps(newCompletedSteps);

    try {
      if (progressId) {
        await supabase
          .from('wizard_progress')
          .update({ completed_steps: newCompletedSteps })
          .eq('id', progressId);
      }
    } catch (error) {
      console.error('Error marking step completed:', error);
    }
  }, [userId, companyId, progressId, completedSteps]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  return {
    isLoading,
    completedSteps,
    loadProgress,
    saveProgress,
    markStepCompleted,
  };
};
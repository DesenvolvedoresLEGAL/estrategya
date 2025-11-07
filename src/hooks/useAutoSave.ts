import { useEffect, useRef, useCallback } from 'react';
import { useDebounce } from './useDebounce';
import { toast } from 'sonner';

interface UseAutoSaveOptions {
  data: any;
  onSave: (data: any) => Promise<void>;
  delay?: number;
  enabled?: boolean;
}

export const useAutoSave = ({
  data,
  onSave,
  delay = 2000,
  enabled = true,
}: UseAutoSaveOptions) => {
  const debouncedData = useDebounce(data, delay);
  const isFirstRender = useRef(true);
  const isSaving = useRef(false);

  const save = useCallback(async () => {
    if (!enabled || isSaving.current) return;

    try {
      isSaving.current = true;
      await onSave(debouncedData);
      toast.success('Rascunho salvo automaticamente', {
        duration: 2000,
        position: 'bottom-right',
      });
    } catch (error) {
      console.error('Auto-save error:', error);
      // Não mostrar erro ao usuário para não ser intrusivo
    } finally {
      isSaving.current = false;
    }
  }, [debouncedData, onSave, enabled]);

  useEffect(() => {
    // Skip first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (enabled && debouncedData) {
      save();
    }
  }, [debouncedData, save, enabled]);

  return { isSaving: isSaving.current };
};

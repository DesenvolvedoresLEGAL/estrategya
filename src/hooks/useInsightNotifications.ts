import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useInsightNotifications = (companyId: string | null) => {
  const { toast } = useToast();

  useEffect(() => {
    if (!companyId) return;

    // Subscribe to new insights
    const channel = supabase
      .channel('insight-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ai_insights',
          filter: `company_id=eq.${companyId}`
        },
        (payload) => {
          const insight = payload.new as any;
          
          // Notificar sobre novos insights críticos
          if (insight.priority === 'critica') {
            toast({
              title: "⚠️ Insight Crítico",
              description: insight.title,
              variant: "destructive",
            });
          } else if (insight.priority === 'alta') {
            toast({
              title: "🔔 Novo Insight Importante",
              description: insight.title,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId, toast]);
};

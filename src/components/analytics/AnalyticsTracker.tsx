import { useEffect } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { supabase } from '@/integrations/supabase/client';

export const AnalyticsTracker = () => {
  const { trackSessionStart, trackSessionEnd } = useAnalytics();

  useEffect(() => {
    let sessionStart = Date.now();
    let userId: string | undefined;

    const initSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id;
      trackSessionStart(userId);
    };

    initSession();

    const handleBeforeUnload = () => {
      const sessionDuration = Math.floor((Date.now() - sessionStart) / 60000); // minutes
      trackSessionEnd(sessionDuration);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      handleBeforeUnload();
    };
  }, []);

  return null;
};
// Utility components for tracking specific events
import { useEffect } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';

interface WizardStepTrackerProps {
  stepNumber: number;
  stepName: string;
  onComplete?: () => void;
}

export const WizardStepTracker = ({ stepNumber, stepName, onComplete }: WizardStepTrackerProps) => {
  const { trackWizardStep } = useAnalytics();
  const startTime = Date.now();

  useEffect(() => {
    return () => {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      trackWizardStep(stepNumber, stepName, timeSpent);
      onComplete?.();
    };
  }, []);

  return null;
};

interface AIUsageTrackerProps {
  feature: string;
  isLoading: boolean;
  error?: Error | null;
}

export const AIUsageTracker = ({ feature, isLoading, error }: AIUsageTrackerProps) => {
  const { trackAIUsage, trackAIError } = useAnalytics();
  const startTime = Date.now();

  useEffect(() => {
    if (!isLoading && !error) {
      const responseTime = Date.now() - startTime;
      trackAIUsage(feature, true, responseTime);
    } else if (error) {
      trackAIError(feature, error.message);
    }
  }, [isLoading, error]);

  return null;
};
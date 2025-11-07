import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Declare gtag function for TypeScript
declare global {
  interface Window {
    gtag: (
      command: string,
      targetId: string | Date,
      config?: Record<string, any>
    ) => void;
    dataLayer: any[];
  }
}

interface EventParams {
  category?: string;
  label?: string;
  value?: number;
  [key: string]: any;
}

export const useAnalytics = () => {
  const location = useLocation();

  // Track page views on route change
  useEffect(() => {
    if (typeof window.gtag === 'function') {
      window.gtag('config', import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-XXXXXXXXXX', {
        page_path: location.pathname + location.search,
      });
    }
  }, [location]);

  const trackEvent = (eventName: string, params?: EventParams) => {
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, {
        ...params,
        timestamp: new Date().toISOString(),
      });
    } else {
      console.log('Analytics event:', eventName, params);
    }
  };

  // Wizard tracking
  const trackWizardStep = (stepNumber: number, stepName: string, timeSpent?: number) => {
    trackEvent('wizard_step_completed', {
      category: 'Wizard',
      label: stepName,
      step_number: stepNumber,
      time_spent_seconds: timeSpent,
    });
  };

  const trackWizardCompleted = (totalTime: number, stepsCompleted: number) => {
    trackEvent('wizard_completed', {
      category: 'Wizard',
      total_time_seconds: totalTime,
      steps_completed: stepsCompleted,
    });
  };

  const trackWizardAbandoned = (lastStep: number, timeSpent: number) => {
    trackEvent('wizard_abandoned', {
      category: 'Wizard',
      last_step: lastStep,
      time_spent_seconds: timeSpent,
    });
  };

  // AI usage tracking
  const trackAIUsage = (feature: string, success: boolean, responseTime?: number) => {
    trackEvent('ai_usage', {
      category: 'AI',
      feature,
      success,
      response_time_ms: responseTime,
    });
  };

  const trackAIError = (feature: string, errorType: string) => {
    trackEvent('ai_error', {
      category: 'AI',
      feature,
      error_type: errorType,
    });
  };

  // Feature usage tracking
  const trackFeatureUsed = (featureName: string, context?: string) => {
    trackEvent('feature_used', {
      category: 'Features',
      feature_name: featureName,
      context,
    });
  };

  const trackExportUsed = (exportType: 'pdf' | 'excel' | 'ppt', section: string) => {
    trackEvent('export_used', {
      category: 'Export',
      export_type: exportType,
      section,
    });
  };

  // Conversion tracking
  const trackSignup = (method: 'email' | 'google' | 'phone') => {
    trackEvent('sign_up', {
      category: 'Conversion',
      method,
    });
  };

  const trackLogin = (method: 'email' | 'google' | 'phone') => {
    trackEvent('login', {
      category: 'Conversion',
      method,
    });
  };

  const trackPlanCreated = (segment: string, model: string) => {
    trackEvent('plan_created', {
      category: 'Conversion',
      segment,
      model,
    });
  };

  const trackUpgradeInitiated = (fromPlan: string, toPlan: string) => {
    trackEvent('upgrade_initiated', {
      category: 'Conversion',
      from_plan: fromPlan,
      to_plan: toPlan,
    });
  };

  const trackUpgradeCompleted = (plan: string, price: number) => {
    trackEvent('purchase', {
      category: 'Conversion',
      value: price,
      currency: 'BRL',
      items: [
        {
          item_id: plan,
          item_name: `Plano ${plan}`,
          price: price,
        },
      ],
    });
  };

  // Engagement tracking
  const trackObjectiveCreated = (perspective: string) => {
    trackEvent('objective_created', {
      category: 'Engagement',
      perspective,
    });
  };

  const trackInitiativeCreated = (status: string, hasICE: boolean) => {
    trackEvent('initiative_created', {
      category: 'Engagement',
      status,
      has_ice_score: hasICE,
    });
  };

  const trackMetricUpdated = (metricType: string) => {
    trackEvent('metric_updated', {
      category: 'Engagement',
      metric_type: metricType,
    });
  };

  const trackCheckinCompleted = (weekNumber: number) => {
    trackEvent('checkin_completed', {
      category: 'Engagement',
      week_number: weekNumber,
    });
  };

  // Error tracking
  const trackError = (errorType: string, errorMessage: string, context?: string) => {
    trackEvent('error', {
      category: 'Errors',
      error_type: errorType,
      error_message: errorMessage,
      context,
    });
  };

  // Session tracking
  const trackSessionStart = (userId?: string) => {
    trackEvent('session_start', {
      category: 'Session',
      user_id: userId,
    });
  };

  const trackSessionEnd = (durationMinutes: number) => {
    trackEvent('session_end', {
      category: 'Session',
      duration_minutes: durationMinutes,
    });
  };

  // Subscription & Limit tracking
  const trackLimitReached = (limitType: string, currentPlan: string, context?: string) => {
    trackEvent('limit_reached', {
      category: 'Subscription',
      limit_type: limitType,
      current_plan: currentPlan,
      context,
    });
  };

  const trackUpgradeClicked = (fromPlan: string, feature: string, location: string) => {
    trackEvent('upgrade_clicked', {
      category: 'Subscription',
      from_plan: fromPlan,
      feature_locked: feature,
      click_location: location,
    });
  };

  const trackPricingViewed = (source: string) => {
    trackEvent('pricing_viewed', {
      category: 'Subscription',
      source,
    });
  };

  const trackFeatureBlocked = (featureName: string, currentPlan: string, requiredPlan: string) => {
    trackEvent('feature_blocked', {
      category: 'Subscription',
      feature_name: featureName,
      current_plan: currentPlan,
      required_plan: requiredPlan,
    });
  };

  return {
    trackEvent,
    trackWizardStep,
    trackWizardCompleted,
    trackWizardAbandoned,
    trackAIUsage,
    trackAIError,
    trackFeatureUsed,
    trackExportUsed,
    trackSignup,
    trackLogin,
    trackPlanCreated,
    trackUpgradeInitiated,
    trackUpgradeCompleted,
    trackObjectiveCreated,
    trackInitiativeCreated,
    trackMetricUpdated,
    trackCheckinCompleted,
    trackError,
    trackSessionStart,
    trackSessionEnd,
    trackLimitReached,
    trackUpgradeClicked,
    trackPricingViewed,
    trackFeatureBlocked,
  };
};

export default useAnalytics;
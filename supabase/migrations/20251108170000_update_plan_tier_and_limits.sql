-- Normalize plan tiers and align subscription limits with updated pricing matrix
BEGIN;

-- Replace legacy enum values to keep only the supported tiers
ALTER TYPE plan_tier RENAME TO plan_tier_old;
CREATE TYPE plan_tier AS ENUM ('free', 'pro', 'enterprise');

ALTER TABLE subscription_plans
  ALTER COLUMN tier TYPE plan_tier
  USING (
    CASE tier::text
      WHEN 'business' THEN 'enterprise'
      ELSE tier::text
    END
  )::plan_tier;

DROP TYPE plan_tier_old;

-- Ensure each plan has the correct limits and PDF export mode configuration
UPDATE subscription_plans
SET
  limits = jsonb_build_object(
    'max_companies', 1,
    'max_plans', 1,
    'max_objectives', 3,
    'max_initiatives_per_objective', 3,
    'max_team_members', 1,
    'ai_insights_per_month', 5,
    'pdf_export_mode', 'watermark',
    'ice_score', false,
    '5w2h', false,
    '4dx_execution', false,
    'templates', false,
    'custom_templates', false,
    'integrations', false,
    'collaboration', false,
    'custom_branding', false,
    'audit_log', false,
    'advanced_permissions', false
  )
WHERE tier = 'free';

UPDATE subscription_plans
SET
  limits = jsonb_build_object(
    'max_companies', 1,
    'max_plans', 3,
    'max_objectives', -1,
    'max_initiatives_per_objective', -1,
    'max_team_members', 3,
    'ai_insights_per_month', -1,
    'pdf_export_mode', 'standard',
    'ice_score', true,
    '5w2h', true,
    '4dx_execution', true,
    'templates', true,
    'custom_templates', false,
    'integrations', false,
    'collaboration', true,
    'custom_branding', false,
    'audit_log', false,
    'advanced_permissions', false
  )
WHERE tier = 'pro';

UPDATE subscription_plans
SET
  limits = jsonb_build_object(
    'max_companies', -1,
    'max_plans', -1,
    'max_objectives', -1,
    'max_initiatives_per_objective', -1,
    'max_team_members', -1,
    'ai_insights_per_month', -1,
    'pdf_export_mode', 'premium',
    'ice_score', true,
    '5w2h', true,
    '4dx_execution', true,
    'templates', true,
    'custom_templates', true,
    'integrations', true,
    'collaboration', true,
    'custom_branding', true,
    'audit_log', true,
    'advanced_permissions', true
  )
WHERE tier = 'enterprise';

COMMIT;

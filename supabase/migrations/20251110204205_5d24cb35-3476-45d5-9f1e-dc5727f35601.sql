-- Fase 1: Corrigir campos de limites dos planos de assinatura

-- Atualizar plano FREE com todos os campos corretos
UPDATE subscription_plans
SET limits = jsonb_build_object(
  'max_companies', 1,
  'max_plans', 1,
  'max_objectives', 3,
  'max_initiatives_per_objective', 5,
  'max_team_members', 1,
  'ice_score', false,
  'five_w2h', false,
  'four_dx_wbr', false,
  'pdf_export_mode', 'watermark',
  'custom_templates', false,
  'basic_templates', false,
  'integrations', false,
  'collaboration', false,
  'branding', false,
  'audit_log', false,
  'advanced_permissions', false
)
WHERE tier = 'free';

-- Atualizar plano PRO com todos os campos corretos
UPDATE subscription_plans
SET limits = jsonb_build_object(
  'max_companies', 1,
  'max_plans', 3,
  'max_objectives', 999999,
  'max_initiatives_per_objective', 999999,
  'max_team_members', 3,
  'ice_score', true,
  'five_w2h', true,
  'four_dx_wbr', true,
  'pdf_export_mode', 'standard',
  'custom_templates', false,
  'basic_templates', true,
  'integrations', false,
  'collaboration', true,
  'branding', false,
  'audit_log', false,
  'advanced_permissions', false
)
WHERE tier = 'pro';

-- Atualizar plano ENTERPRISE com todos os campos corretos
UPDATE subscription_plans
SET limits = jsonb_build_object(
  'max_companies', 999999,
  'max_plans', 999999,
  'max_objectives', 999999,
  'max_initiatives_per_objective', 999999,
  'max_team_members', 999999,
  'ice_score', true,
  'five_w2h', true,
  'four_dx_wbr', true,
  'pdf_export_mode', 'premium',
  'custom_templates', true,
  'basic_templates', true,
  'integrations', true,
  'collaboration', true,
  'branding', true,
  'audit_log', true,
  'advanced_permissions', true
)
WHERE tier = 'enterprise';
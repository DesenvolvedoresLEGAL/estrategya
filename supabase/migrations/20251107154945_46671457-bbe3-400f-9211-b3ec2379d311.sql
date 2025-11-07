-- Atualizar planos de assinatura com novos limites e features

-- Atualizar plano FREE
UPDATE subscription_plans 
SET 
  features = jsonb_build_array(
    'Wizard completo (contexto + diagnóstico)',
    'SWOT + PESTEL',
    '1 plano estratégico salvo',
    'Dashboard básico',
    'IA básica (análise e objetivos)',
    'Sem exportar PDF',
    'Sem integrações'
  ),
  limits = jsonb_build_object(
    'max_companies', 1,
    'max_plans', 1,
    'max_objectives', 3,
    'max_initiatives_per_objective', 3,
    'max_team_members', 1,
    'ai_insights_per_month', 5,
    'export_pdf', false,
    'ice_score', false,
    '5w2h', false,
    '4dx_execution', false,
    'templates', false,
    'integrations', false,
    'collaboration', false,
    'custom_branding', false
  )
WHERE tier = 'free';

-- Atualizar plano PRO (1 empresa, 3 cenários de planejamento)
UPDATE subscription_plans 
SET 
  features = jsonb_build_array(
    '1 empresa',
    'Até 3 planos estratégicos ativos',
    'IA avançada (insights, 5W2H, sugestões)',
    'Templates prontos por área',
    'Dashboard completo',
    'Exportação em PDF',
    'ICE Score e priorização',
    'Métricas por perspectiva BSC',
    '4DX/WBR para execução'
  ),
  limits = jsonb_build_object(
    'max_companies', 1,
    'max_plans', 3,
    'max_objectives', -1,
    'max_initiatives_per_objective', -1,
    'max_team_members', 5,
    'ai_insights_per_month', -1,
    'export_pdf', true,
    'ice_score', true,
    '5w2h', true,
    '4dx_execution', true,
    'templates', true,
    'integrations', false,
    'collaboration', true,
    'custom_branding', false
  )
WHERE tier = 'pro';

-- Renomear tier business para enterprise no enum seria complexo, 
-- vamos apenas atualizar o registro
UPDATE subscription_plans 
SET 
  name = 'Enterprise',
  price_monthly = NULL,
  price_annual = NULL,
  features = jsonb_build_array(
    'Múltiplas empresas/workspaces',
    'Planos ilimitados',
    'Múltiplos usuários e permissões',
    'Integrações externas',
    'Histórico e log de mudanças',
    'Templates próprios do cliente',
    'Branding personalizado',
    'Relatórios customizados',
    'Suporte dedicado + SLA',
    'Insights de IA recorrentes'
  ),
  limits = jsonb_build_object(
    'max_companies', -1,
    'max_plans', -1,
    'max_objectives', -1,
    'max_initiatives_per_objective', -1,
    'max_team_members', -1,
    'ai_insights_per_month', -1,
    'export_pdf', true,
    'ice_score', true,
    '5w2h', true,
    '4dx_execution', true,
    'templates', true,
    'integrations', true,
    'collaboration', true,
    'custom_branding', true
  )
WHERE tier = 'business';
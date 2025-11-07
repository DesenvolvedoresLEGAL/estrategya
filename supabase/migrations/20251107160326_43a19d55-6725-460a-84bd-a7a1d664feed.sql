-- Fase 1: Configurar Subscription Enterprise
-- Corrigir o tier do plano Enterprise
UPDATE subscription_plans 
SET tier = 'enterprise'::plan_tier
WHERE id = '86e397e8-619e-46c6-ac61-63d9d74c4626';

-- Criar subscription Enterprise para Humanoid Platforms LTDA
INSERT INTO company_subscriptions (
  company_id,
  plan_id,
  status,
  current_period_start,
  current_period_end
) VALUES (
  '1c5817ae-bfe7-41c3-9995-46623301850f',  -- Humanoid Platforms LTDA
  '86e397e8-619e-46c6-ac61-63d9d74c4626',  -- Plano Enterprise
  'active',
  now(),
  now() + interval '1 year'
);
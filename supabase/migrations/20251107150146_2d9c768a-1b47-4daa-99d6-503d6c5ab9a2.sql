-- Create plan tier enum
CREATE TYPE plan_tier AS ENUM ('free', 'pro', 'business', 'enterprise');

-- Create subscription plans table
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  tier plan_tier NOT NULL,
  price_monthly NUMERIC(10,2),
  price_annual NUMERIC(10,2),
  features JSONB NOT NULL,
  limits JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on subscription_plans
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view active plans
CREATE POLICY "Anyone can view active subscription plans"
  ON subscription_plans FOR SELECT
  USING (is_active = TRUE);

-- Create company subscriptions table
CREATE TABLE company_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'active',
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id)
);

-- Enable RLS on company_subscriptions
ALTER TABLE company_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own company subscription
CREATE POLICY "Users can view own company subscription"
  ON company_subscriptions FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM team_members WHERE user_id = auth.uid()
    )
  );

-- Admins and owners can update company subscription
CREATE POLICY "Admins can update company subscription"
  ON company_subscriptions FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM team_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_company_subscriptions_updated_at
  BEFORE UPDATE ON company_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Seed initial plans
INSERT INTO subscription_plans (name, tier, price_monthly, price_annual, features, limits) VALUES
('Free', 'free', 0, 0, 
  '["Wizard básico", "1 plano ativo", "SWOT e OGSM simplificado", "Dashboard básico", "3 objetivos", "Exportar PDF com marca dágua", "Suporte comunitário"]'::jsonb,
  '{"max_plans": 1, "max_objectives": 3, "max_initiatives_per_objective": 3, "max_team_members": 1, "ai_insights_per_month": 5, "ice_score": false, "5w2h": false, "4dx_execution": false, "templates": false, "integrations": false, "collaboration": false, "custom_branding": false}'::jsonb
),
('Pro', 'pro', 49.90, 499.00,
  '["Planos ilimitados", "Templates avançados", "ICE Score e ranqueamento", "5W2H completo", "Execução 4DX/WBR", "Até 5 membros", "Insights IA ilimitados", "Exportação sem marca", "Suporte prioritário"]'::jsonb,
  '{"max_plans": -1, "max_objectives": -1, "max_initiatives_per_objective": -1, "max_team_members": 5, "ai_insights_per_month": -1, "ice_score": true, "5w2h": true, "4dx_execution": true, "templates": true, "integrations": false, "collaboration": true, "custom_branding": false}'::jsonb
),
('Business', 'business', 149.90, 1499.00,
  '["Tudo do Pro", "Membros ilimitados", "Integrações CRM/ERP", "API access", "Colaboração avançada", "Branding personalizado", "Relatórios customizados", "Suporte dedicado"]'::jsonb,
  '{"max_plans": -1, "max_objectives": -1, "max_initiatives_per_objective": -1, "max_team_members": -1, "ai_insights_per_month": -1, "ice_score": true, "5w2h": true, "4dx_execution": true, "templates": true, "integrations": true, "collaboration": true, "custom_branding": true}'::jsonb
);
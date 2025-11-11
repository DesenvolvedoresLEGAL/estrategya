-- 1. Adicionar política RLS para owners visualizarem suas subscriptions
CREATE POLICY "Owners can view own company subscription"
ON company_subscriptions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM companies c 
    WHERE c.id = company_subscriptions.company_id 
      AND c.owner_user_id = auth.uid()
  )
);

-- 2. Backfill team_members com owners que estão faltando
INSERT INTO team_members (company_id, user_id, role, invited_by, accepted_at)
SELECT 
  c.id,
  c.owner_user_id,
  'owner'::app_role,
  c.owner_user_id,
  NOW()
FROM companies c
LEFT JOIN team_members tm 
  ON tm.company_id = c.id 
  AND tm.user_id = c.owner_user_id
WHERE tm.id IS NULL;

-- 3. Criar tabela para checklist de validação persistente
CREATE TABLE plan_validation_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_email TEXT NOT NULL,
  expected_tier TEXT NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  test_id TEXT NOT NULL,
  checked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, account_email, test_id)
);

-- Enable RLS
ALTER TABLE plan_validation_checks ENABLE ROW LEVEL SECURITY;

-- RLS policies para plan_validation_checks
CREATE POLICY "Users can view own validation checks"
ON plan_validation_checks
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own validation checks"
ON plan_validation_checks
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own validation checks"
ON plan_validation_checks
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own validation checks"
ON plan_validation_checks
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Trigger para atualizar updated_at
CREATE TRIGGER update_plan_validation_checks_updated_at
BEFORE UPDATE ON plan_validation_checks
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();
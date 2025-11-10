-- Criar função que atribui plano FREE automaticamente quando uma empresa é criada
CREATE OR REPLACE FUNCTION assign_free_plan_to_new_company()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  free_plan_id uuid;
BEGIN
  -- Buscar o ID do plano FREE
  SELECT id INTO free_plan_id
  FROM subscription_plans
  WHERE tier = 'free'
  LIMIT 1;

  -- Se encontrou o plano FREE, criar a subscription
  IF free_plan_id IS NOT NULL THEN
    INSERT INTO company_subscriptions (
      company_id,
      plan_id,
      status,
      current_period_start,
      current_period_end
    ) VALUES (
      NEW.id,
      free_plan_id,
      'active',
      NOW(),
      NOW() + INTERVAL '1 year'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Criar trigger para executar a função após inserir uma nova empresa
DROP TRIGGER IF EXISTS on_company_created ON companies;
CREATE TRIGGER on_company_created
  AFTER INSERT ON companies
  FOR EACH ROW
  EXECUTE FUNCTION assign_free_plan_to_new_company();
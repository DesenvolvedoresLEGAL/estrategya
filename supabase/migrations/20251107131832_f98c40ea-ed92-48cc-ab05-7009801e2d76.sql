-- Correção de warnings de segurança: adicionar SET search_path nas funções existentes
-- Versão corrigida sem referências a tabelas inexistentes

-- Recriar função calculate_ice_score com search_path correto
DROP FUNCTION IF EXISTS public.calculate_ice_score() CASCADE;

CREATE OR REPLACE FUNCTION public.calculate_ice_score()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.impact_score IS NOT NULL AND NEW.confidence_score IS NOT NULL AND NEW.ease_score IS NOT NULL THEN
    NEW.ice_score := NEW.impact_score * NEW.confidence_score * NEW.ease_score;
  ELSE
    NEW.ice_score := NULL;
  END IF;
  RETURN NEW;
END;
$$;

-- Recriar trigger para calculate_ice_score
DROP TRIGGER IF EXISTS calculate_ice_score_trigger ON initiatives;

CREATE TRIGGER calculate_ice_score_trigger
  BEFORE INSERT OR UPDATE ON initiatives
  FOR EACH ROW
  EXECUTE FUNCTION calculate_ice_score();

-- Recriar função handle_updated_at com search_path correto
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recriar triggers para handle_updated_at apenas nas tabelas que existem
DROP TRIGGER IF EXISTS handle_updated_at_trigger ON companies;
DROP TRIGGER IF EXISTS handle_updated_at_trigger ON strategic_objectives;
DROP TRIGGER IF EXISTS handle_updated_at_trigger ON initiatives;
DROP TRIGGER IF EXISTS handle_updated_at_trigger ON metrics;
DROP TRIGGER IF EXISTS handle_updated_at_trigger ON strategic_context;
DROP TRIGGER IF EXISTS handle_updated_at_trigger ON execution_plan;
DROP TRIGGER IF EXISTS handle_updated_at_trigger ON ai_insights;
DROP TRIGGER IF EXISTS handle_updated_at_trigger ON ogsm;
DROP TRIGGER IF EXISTS handle_updated_at_trigger ON ogsm_goals;
DROP TRIGGER IF EXISTS handle_updated_at_trigger ON ogsm_strategies;
DROP TRIGGER IF EXISTS handle_updated_at_trigger ON ogsm_measures;
DROP TRIGGER IF EXISTS handle_updated_at_trigger ON pestel_analysis;

CREATE TRIGGER handle_updated_at_trigger
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_updated_at_trigger
  BEFORE UPDATE ON strategic_objectives
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_updated_at_trigger
  BEFORE UPDATE ON initiatives
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_updated_at_trigger
  BEFORE UPDATE ON metrics
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_updated_at_trigger
  BEFORE UPDATE ON strategic_context
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_updated_at_trigger
  BEFORE UPDATE ON execution_plan
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_updated_at_trigger
  BEFORE UPDATE ON ai_insights
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_updated_at_trigger
  BEFORE UPDATE ON ogsm
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_updated_at_trigger
  BEFORE UPDATE ON ogsm_goals
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_updated_at_trigger
  BEFORE UPDATE ON ogsm_strategies
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_updated_at_trigger
  BEFORE UPDATE ON ogsm_measures
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_updated_at_trigger
  BEFORE UPDATE ON pestel_analysis
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Adicionar comentários de documentação
COMMENT ON FUNCTION public.calculate_ice_score() IS 'Calcula automaticamente o ICE Score (Impact × Confidence × Ease) para iniciativas';
COMMENT ON FUNCTION public.handle_updated_at() IS 'Atualiza automaticamente o campo updated_at com o timestamp atual';
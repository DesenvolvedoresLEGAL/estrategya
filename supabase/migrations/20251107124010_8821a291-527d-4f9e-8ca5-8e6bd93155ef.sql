-- Corrigir search_path para as funções criadas
DROP FUNCTION IF EXISTS calculate_ice_score() CASCADE;

CREATE OR REPLACE FUNCTION calculate_ice_score()
RETURNS TRIGGER 
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

-- Recriar trigger
DROP TRIGGER IF EXISTS trigger_calculate_ice_score ON initiatives;
CREATE TRIGGER trigger_calculate_ice_score
  BEFORE INSERT OR UPDATE ON initiatives
  FOR EACH ROW
  EXECUTE FUNCTION calculate_ice_score();
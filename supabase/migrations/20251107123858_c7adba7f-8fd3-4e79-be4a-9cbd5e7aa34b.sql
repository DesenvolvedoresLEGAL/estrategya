-- Adicionar campos ICE Score
ALTER TABLE initiatives 
ADD COLUMN IF NOT EXISTS impact_score INTEGER CHECK (impact_score >= 1 AND impact_score <= 10),
ADD COLUMN IF NOT EXISTS confidence_score INTEGER CHECK (confidence_score >= 1 AND confidence_score <= 10),
ADD COLUMN IF NOT EXISTS ease_score INTEGER CHECK (ease_score >= 1 AND ease_score <= 10),
ADD COLUMN IF NOT EXISTS ice_score DECIMAL;

-- Adicionar campos 5W2H
ALTER TABLE initiatives
ADD COLUMN IF NOT EXISTS what TEXT,
ADD COLUMN IF NOT EXISTS why TEXT,
ADD COLUMN IF NOT EXISTS who TEXT,
ADD COLUMN IF NOT EXISTS when_deadline DATE,
ADD COLUMN IF NOT EXISTS where_location TEXT,
ADD COLUMN IF NOT EXISTS how TEXT,
ADD COLUMN IF NOT EXISTS how_much DECIMAL;

-- Criar função para calcular ICE Score automaticamente
CREATE OR REPLACE FUNCTION calculate_ice_score()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.impact_score IS NOT NULL AND NEW.confidence_score IS NOT NULL AND NEW.ease_score IS NOT NULL THEN
    NEW.ice_score := NEW.impact_score * NEW.confidence_score * NEW.ease_score;
  ELSE
    NEW.ice_score := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para calcular ICE Score automaticamente em INSERT e UPDATE
DROP TRIGGER IF EXISTS trigger_calculate_ice_score ON initiatives;
CREATE TRIGGER trigger_calculate_ice_score
  BEFORE INSERT OR UPDATE ON initiatives
  FOR EACH ROW
  EXECUTE FUNCTION calculate_ice_score();

-- Adicionar índice para ordenação por ICE Score
CREATE INDEX IF NOT EXISTS idx_initiatives_ice_score ON initiatives(ice_score DESC NULLS LAST);

-- Adicionar comentários para documentação
COMMENT ON COLUMN initiatives.impact_score IS 'Impact score (1-10): How much impact this initiative has on the objective';
COMMENT ON COLUMN initiatives.confidence_score IS 'Confidence score (1-10): How confident we are about the estimates';
COMMENT ON COLUMN initiatives.ease_score IS 'Ease score (1-10): How easy/quick is to implement (inverse of effort)';
COMMENT ON COLUMN initiatives.ice_score IS 'ICE Score: Calculated as Impact × Confidence × Ease (max 1000)';
COMMENT ON COLUMN initiatives.what IS '5W2H: What will be done';
COMMENT ON COLUMN initiatives.why IS '5W2H: Why this is important (strategic link)';
COMMENT ON COLUMN initiatives.who IS '5W2H: Who is responsible';
COMMENT ON COLUMN initiatives.when_deadline IS '5W2H: When is the deadline';
COMMENT ON COLUMN initiatives.where_location IS '5W2H: Where it will happen';
COMMENT ON COLUMN initiatives.how IS '5W2H: How it will be executed (steps)';
COMMENT ON COLUMN initiatives.how_much IS '5W2H: How much it will cost (estimated budget)';
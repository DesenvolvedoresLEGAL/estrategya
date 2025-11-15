-- Add missing PESTEL summary fields
ALTER TABLE public.pestel_analysis
  ADD COLUMN IF NOT EXISTS key_impacts TEXT[],
  ADD COLUMN IF NOT EXISTS opportunities TEXT[],
  ADD COLUMN IF NOT EXISTS threats TEXT[];

COMMENT ON COLUMN public.pestel_analysis.key_impacts IS 'Principais impactos identificados na análise PESTEL';
COMMENT ON COLUMN public.pestel_analysis.opportunities IS 'Oportunidades identificadas baseadas nos fatores externos';
COMMENT ON COLUMN public.pestel_analysis.threats IS 'Ameaças identificadas baseadas nos fatores externos';
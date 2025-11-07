-- Adicionar índices de performance para segment_templates
-- Melhora consultas que filtram por segment (usado em loadSegmentExamples)
CREATE INDEX IF NOT EXISTS idx_segment_templates_segment ON public.segment_templates(segment);

-- Melhora consultas que filtram por template_type (usado para buscar SWOT, PESTEL, etc)
CREATE INDEX IF NOT EXISTS idx_segment_templates_type ON public.segment_templates(template_type);

-- Índice composto para queries que filtram por ambos (mais comum)
CREATE INDEX IF NOT EXISTS idx_segment_templates_segment_type ON public.segment_templates(segment, template_type);
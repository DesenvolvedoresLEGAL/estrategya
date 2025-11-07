-- Create porter_analysis table
CREATE TABLE IF NOT EXISTS public.porter_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  rivalry_score INTEGER CHECK (rivalry_score >= 1 AND rivalry_score <= 5),
  rivalry_analysis TEXT,
  new_entrants_score INTEGER CHECK (new_entrants_score >= 1 AND new_entrants_score <= 5),
  new_entrants_analysis TEXT,
  supplier_power_score INTEGER CHECK (supplier_power_score >= 1 AND supplier_power_score <= 5),
  supplier_power_analysis TEXT,
  buyer_power_score INTEGER CHECK (buyer_power_score >= 1 AND buyer_power_score <= 5),
  buyer_power_analysis TEXT,
  substitutes_score INTEGER CHECK (substitutes_score >= 1 AND substitutes_score <= 5),
  substitutes_analysis TEXT,
  overall_competitiveness TEXT,
  recommendations TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create maturity_assessment table
CREATE TABLE IF NOT EXISTS public.maturity_assessment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  people_score INTEGER CHECK (people_score >= 1 AND people_score <= 5),
  people_analysis TEXT,
  processes_score INTEGER CHECK (processes_score >= 1 AND processes_score <= 5),
  processes_analysis TEXT,
  technology_score INTEGER CHECK (technology_score >= 1 AND technology_score <= 5),
  technology_analysis TEXT,
  strategy_score INTEGER CHECK (strategy_score >= 1 AND strategy_score <= 5),
  strategy_analysis TEXT,
  overall_maturity_level TEXT,
  evolution_roadmap JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.porter_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maturity_assessment ENABLE ROW LEVEL SECURITY;

-- RLS Policies for porter_analysis
CREATE POLICY "Users can view porter analysis of their companies"
  ON public.porter_analysis FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = porter_analysis.company_id
      AND companies.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert porter analysis for their companies"
  ON public.porter_analysis FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = porter_analysis.company_id
      AND companies.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update porter analysis of their companies"
  ON public.porter_analysis FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = porter_analysis.company_id
      AND companies.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete porter analysis of their companies"
  ON public.porter_analysis FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = porter_analysis.company_id
      AND companies.owner_user_id = auth.uid()
    )
  );

-- RLS Policies for maturity_assessment
CREATE POLICY "Users can view maturity assessment of their companies"
  ON public.maturity_assessment FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = maturity_assessment.company_id
      AND companies.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert maturity assessment for their companies"
  ON public.maturity_assessment FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = maturity_assessment.company_id
      AND companies.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update maturity assessment of their companies"
  ON public.maturity_assessment FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = maturity_assessment.company_id
      AND companies.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete maturity assessment of their companies"
  ON public.maturity_assessment FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = maturity_assessment.company_id
      AND companies.owner_user_id = auth.uid()
    )
  );

-- Add triggers for updated_at
CREATE TRIGGER update_porter_analysis_updated_at
  BEFORE UPDATE ON public.porter_analysis
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_maturity_assessment_updated_at
  BEFORE UPDATE ON public.maturity_assessment
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
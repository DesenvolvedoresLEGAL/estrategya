-- Create companies table
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  segment TEXT NOT NULL,
  model TEXT NOT NULL,
  size_team INTEGER,
  region TEXT,
  main_challenge TEXT,
  owner_user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create strategic_context table
CREATE TABLE public.strategic_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  strengths TEXT[] DEFAULT '{}',
  weaknesses TEXT[] DEFAULT '{}',
  opportunities TEXT[] DEFAULT '{}',
  threats TEXT[] DEFAULT '{}',
  ia_analysis TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create strategic_objectives table
CREATE TABLE public.strategic_objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  horizon TEXT CHECK (horizon IN ('H1', 'H2', 'H3')),
  perspective TEXT CHECK (perspective IN ('financeira', 'clientes', 'processos', 'aprendizado')),
  priority INTEGER CHECK (priority BETWEEN 1 AND 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create initiatives table
CREATE TABLE public.initiatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  objective_id UUID NOT NULL REFERENCES public.strategic_objectives(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  impact INTEGER CHECK (impact BETWEEN 1 AND 5),
  effort INTEGER CHECK (effort BETWEEN 1 AND 5),
  owner TEXT,
  due_date DATE,
  status TEXT DEFAULT 'não iniciada' CHECK (status IN ('não iniciada', 'em execução', 'concluída')),
  suggested_by_ai BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create metrics table
CREATE TABLE public.metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  objective_id UUID NOT NULL REFERENCES public.strategic_objectives(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target TEXT,
  period TEXT CHECK (period IN ('mensal', 'trimestral', 'anual')),
  source TEXT,
  current_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategic_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategic_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.initiatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for companies
CREATE POLICY "Users can view their own companies"
  ON public.companies FOR SELECT
  USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can insert their own companies"
  ON public.companies FOR INSERT
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Users can update their own companies"
  ON public.companies FOR UPDATE
  USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can delete their own companies"
  ON public.companies FOR DELETE
  USING (auth.uid() = owner_user_id);

-- RLS Policies for strategic_context
CREATE POLICY "Users can view context of their companies"
  ON public.strategic_context FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.companies
      WHERE companies.id = strategic_context.company_id
      AND companies.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert context for their companies"
  ON public.strategic_context FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.companies
      WHERE companies.id = company_id
      AND companies.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update context of their companies"
  ON public.strategic_context FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.companies
      WHERE companies.id = strategic_context.company_id
      AND companies.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete context of their companies"
  ON public.strategic_context FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.companies
      WHERE companies.id = strategic_context.company_id
      AND companies.owner_user_id = auth.uid()
    )
  );

-- RLS Policies for strategic_objectives
CREATE POLICY "Users can view objectives of their companies"
  ON public.strategic_objectives FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.companies
      WHERE companies.id = strategic_objectives.company_id
      AND companies.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert objectives for their companies"
  ON public.strategic_objectives FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.companies
      WHERE companies.id = company_id
      AND companies.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update objectives of their companies"
  ON public.strategic_objectives FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.companies
      WHERE companies.id = strategic_objectives.company_id
      AND companies.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete objectives of their companies"
  ON public.strategic_objectives FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.companies
      WHERE companies.id = strategic_objectives.company_id
      AND companies.owner_user_id = auth.uid()
    )
  );

-- RLS Policies for initiatives
CREATE POLICY "Users can view initiatives of their objectives"
  ON public.initiatives FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.strategic_objectives
      JOIN public.companies ON companies.id = strategic_objectives.company_id
      WHERE strategic_objectives.id = initiatives.objective_id
      AND companies.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert initiatives for their objectives"
  ON public.initiatives FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.strategic_objectives
      JOIN public.companies ON companies.id = strategic_objectives.company_id
      WHERE strategic_objectives.id = objective_id
      AND companies.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update initiatives of their objectives"
  ON public.initiatives FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.strategic_objectives
      JOIN public.companies ON companies.id = strategic_objectives.company_id
      WHERE strategic_objectives.id = initiatives.objective_id
      AND companies.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete initiatives of their objectives"
  ON public.initiatives FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.strategic_objectives
      JOIN public.companies ON companies.id = strategic_objectives.company_id
      WHERE strategic_objectives.id = initiatives.objective_id
      AND companies.owner_user_id = auth.uid()
    )
  );

-- RLS Policies for metrics
CREATE POLICY "Users can view metrics of their objectives"
  ON public.metrics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.strategic_objectives
      JOIN public.companies ON companies.id = strategic_objectives.company_id
      WHERE strategic_objectives.id = metrics.objective_id
      AND companies.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert metrics for their objectives"
  ON public.metrics FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.strategic_objectives
      JOIN public.companies ON companies.id = strategic_objectives.company_id
      WHERE strategic_objectives.id = objective_id
      AND companies.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update metrics of their objectives"
  ON public.metrics FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.strategic_objectives
      JOIN public.companies ON companies.id = strategic_objectives.company_id
      WHERE strategic_objectives.id = metrics.objective_id
      AND companies.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete metrics of their objectives"
  ON public.metrics FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.strategic_objectives
      JOIN public.companies ON companies.id = strategic_objectives.company_id
      WHERE strategic_objectives.id = metrics.objective_id
      AND companies.owner_user_id = auth.uid()
    )
  );

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER strategic_context_updated_at
  BEFORE UPDATE ON public.strategic_context
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER strategic_objectives_updated_at
  BEFORE UPDATE ON public.strategic_objectives
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER initiatives_updated_at
  BEFORE UPDATE ON public.initiatives
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER metrics_updated_at
  BEFORE UPDATE ON public.metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
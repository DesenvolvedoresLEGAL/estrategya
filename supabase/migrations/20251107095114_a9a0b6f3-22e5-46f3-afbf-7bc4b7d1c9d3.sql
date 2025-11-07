-- Create enum types for new tables
CREATE TYPE public.objective_status AS ENUM (
  'nao_iniciado',
  'em_andamento',
  'em_risco',
  'concluido',
  'pausado'
);

CREATE TYPE public.insight_type AS ENUM (
  'progresso',
  'risco',
  'oportunidade',
  'recomendacao'
);

CREATE TYPE public.insight_priority AS ENUM (
  'baixa',
  'media',
  'alta',
  'critica'
);

CREATE TYPE public.insight_status AS ENUM (
  'novo',
  'visualizado',
  'resolvido',
  'ignorado'
);

-- Table: metric_updates - Historical tracking of metric values
CREATE TABLE public.metric_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_id UUID NOT NULL REFERENCES public.metrics(id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: objective_updates - Status and progress tracking for objectives
CREATE TABLE public.objective_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  objective_id UUID NOT NULL REFERENCES public.strategic_objectives(id) ON DELETE CASCADE,
  status public.objective_status NOT NULL DEFAULT 'nao_iniciado',
  progress_percentage INTEGER NOT NULL DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  notes TEXT,
  updated_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: ai_insights - AI-generated insights and recommendations
CREATE TABLE public.ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  insight_type public.insight_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority public.insight_priority NOT NULL DEFAULT 'media',
  status public.insight_status NOT NULL DEFAULT 'novo',
  related_objective_id UUID REFERENCES public.strategic_objectives(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.metric_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.objective_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies for metric_updates
CREATE POLICY "Users can view metric updates of their objectives"
ON public.metric_updates
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM metrics
    JOIN strategic_objectives ON strategic_objectives.id = metrics.objective_id
    JOIN companies ON companies.id = strategic_objectives.company_id
    WHERE metrics.id = metric_updates.metric_id
    AND companies.owner_user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert metric updates for their objectives"
ON public.metric_updates
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM metrics
    JOIN strategic_objectives ON strategic_objectives.id = metrics.objective_id
    JOIN companies ON companies.id = strategic_objectives.company_id
    WHERE metrics.id = metric_updates.metric_id
    AND companies.owner_user_id = auth.uid()
  )
  AND created_by = auth.uid()
);

CREATE POLICY "Users can update their own metric updates"
ON public.metric_updates
FOR UPDATE
USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own metric updates"
ON public.metric_updates
FOR DELETE
USING (created_by = auth.uid());

-- RLS Policies for objective_updates
CREATE POLICY "Users can view objective updates of their companies"
ON public.objective_updates
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM strategic_objectives
    JOIN companies ON companies.id = strategic_objectives.company_id
    WHERE strategic_objectives.id = objective_updates.objective_id
    AND companies.owner_user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert objective updates for their companies"
ON public.objective_updates
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM strategic_objectives
    JOIN companies ON companies.id = strategic_objectives.company_id
    WHERE strategic_objectives.id = objective_updates.objective_id
    AND companies.owner_user_id = auth.uid()
  )
  AND updated_by = auth.uid()
);

CREATE POLICY "Users can update their own objective updates"
ON public.objective_updates
FOR UPDATE
USING (updated_by = auth.uid());

CREATE POLICY "Users can delete their own objective updates"
ON public.objective_updates
FOR DELETE
USING (updated_by = auth.uid());

-- RLS Policies for ai_insights
CREATE POLICY "Users can view insights of their companies"
ON public.ai_insights
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM companies
    WHERE companies.id = ai_insights.company_id
    AND companies.owner_user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert insights for their companies"
ON public.ai_insights
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM companies
    WHERE companies.id = ai_insights.company_id
    AND companies.owner_user_id = auth.uid()
  )
);

CREATE POLICY "Users can update insights of their companies"
ON public.ai_insights
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM companies
    WHERE companies.id = ai_insights.company_id
    AND companies.owner_user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete insights of their companies"
ON public.ai_insights
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM companies
    WHERE companies.id = ai_insights.company_id
    AND companies.owner_user_id = auth.uid()
  )
);

-- Create indexes for better query performance
CREATE INDEX idx_metric_updates_metric_id ON public.metric_updates(metric_id);
CREATE INDEX idx_metric_updates_recorded_at ON public.metric_updates(recorded_at DESC);
CREATE INDEX idx_objective_updates_objective_id ON public.objective_updates(objective_id);
CREATE INDEX idx_objective_updates_created_at ON public.objective_updates(created_at DESC);
CREATE INDEX idx_ai_insights_company_id ON public.ai_insights(company_id);
CREATE INDEX idx_ai_insights_status ON public.ai_insights(status);
CREATE INDEX idx_ai_insights_created_at ON public.ai_insights(created_at DESC);

-- Trigger for updating ai_insights.updated_at
CREATE TRIGGER update_ai_insights_updated_at
BEFORE UPDATE ON public.ai_insights
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
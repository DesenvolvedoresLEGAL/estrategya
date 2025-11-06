-- Adicionar campo pestel_factors na tabela strategic_context
ALTER TABLE public.strategic_context 
ADD COLUMN IF NOT EXISTS pestel_factors jsonb DEFAULT '{}'::jsonb;

-- Adicionar campo priority_quadrant na tabela initiatives
ALTER TABLE public.initiatives 
ADD COLUMN IF NOT EXISTS priority_quadrant text CHECK (priority_quadrant IN ('fazer_agora', 'planejar', 'oportunidades_rapidas', 'evitar'));

-- Criar tabela ogsm
CREATE TABLE IF NOT EXISTS public.ogsm (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL,
  objective text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Criar tabela ogsm_goals
CREATE TABLE IF NOT EXISTS public.ogsm_goals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ogsm_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  mensuravel text,
  order_position integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Criar tabela ogsm_strategies
CREATE TABLE IF NOT EXISTS public.ogsm_strategies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ogsm_id uuid NOT NULL,
  goal_id uuid,
  title text NOT NULL,
  description text,
  order_position integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Criar tabela ogsm_measures
CREATE TABLE IF NOT EXISTS public.ogsm_measures (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  strategy_id uuid NOT NULL,
  name text NOT NULL,
  target text,
  o_que_medir text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Criar tabela pestel_analysis
CREATE TABLE IF NOT EXISTS public.pestel_analysis (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL,
  political text,
  economic text,
  social text,
  technological text,
  environmental text,
  legal text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Criar tabela execution_plan
CREATE TABLE IF NOT EXISTS public.execution_plan (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL,
  mci text NOT NULL,
  weekly_actions jsonb DEFAULT '[]'::jsonb,
  scoreboard jsonb DEFAULT '{}'::jsonb,
  review_cadence jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ogsm ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ogsm_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ogsm_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ogsm_measures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pestel_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.execution_plan ENABLE ROW LEVEL SECURITY;

-- RLS Policies para ogsm
CREATE POLICY "Users can view ogsm of their companies" 
ON public.ogsm FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM companies 
  WHERE companies.id = ogsm.company_id 
  AND companies.owner_user_id = auth.uid()
));

CREATE POLICY "Users can insert ogsm for their companies" 
ON public.ogsm FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM companies 
  WHERE companies.id = ogsm.company_id 
  AND companies.owner_user_id = auth.uid()
));

CREATE POLICY "Users can update ogsm of their companies" 
ON public.ogsm FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM companies 
  WHERE companies.id = ogsm.company_id 
  AND companies.owner_user_id = auth.uid()
));

CREATE POLICY "Users can delete ogsm of their companies" 
ON public.ogsm FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM companies 
  WHERE companies.id = ogsm.company_id 
  AND companies.owner_user_id = auth.uid()
));

-- RLS Policies para ogsm_goals
CREATE POLICY "Users can view goals of their ogsm" 
ON public.ogsm_goals FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM ogsm 
  JOIN companies ON companies.id = ogsm.company_id 
  WHERE ogsm.id = ogsm_goals.ogsm_id 
  AND companies.owner_user_id = auth.uid()
));

CREATE POLICY "Users can insert goals for their ogsm" 
ON public.ogsm_goals FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM ogsm 
  JOIN companies ON companies.id = ogsm.company_id 
  WHERE ogsm.id = ogsm_goals.ogsm_id 
  AND companies.owner_user_id = auth.uid()
));

CREATE POLICY "Users can update goals of their ogsm" 
ON public.ogsm_goals FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM ogsm 
  JOIN companies ON companies.id = ogsm.company_id 
  WHERE ogsm.id = ogsm_goals.ogsm_id 
  AND companies.owner_user_id = auth.uid()
));

CREATE POLICY "Users can delete goals of their ogsm" 
ON public.ogsm_goals FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM ogsm 
  JOIN companies ON companies.id = ogsm.company_id 
  WHERE ogsm.id = ogsm_goals.ogsm_id 
  AND companies.owner_user_id = auth.uid()
));

-- RLS Policies para ogsm_strategies
CREATE POLICY "Users can view strategies of their ogsm" 
ON public.ogsm_strategies FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM ogsm 
  JOIN companies ON companies.id = ogsm.company_id 
  WHERE ogsm.id = ogsm_strategies.ogsm_id 
  AND companies.owner_user_id = auth.uid()
));

CREATE POLICY "Users can insert strategies for their ogsm" 
ON public.ogsm_strategies FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM ogsm 
  JOIN companies ON companies.id = ogsm.company_id 
  WHERE ogsm.id = ogsm_strategies.ogsm_id 
  AND companies.owner_user_id = auth.uid()
));

CREATE POLICY "Users can update strategies of their ogsm" 
ON public.ogsm_strategies FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM ogsm 
  JOIN companies ON companies.id = ogsm.company_id 
  WHERE ogsm.id = ogsm_strategies.ogsm_id 
  AND companies.owner_user_id = auth.uid()
));

CREATE POLICY "Users can delete strategies of their ogsm" 
ON public.ogsm_strategies FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM ogsm 
  JOIN companies ON companies.id = ogsm.company_id 
  WHERE ogsm.id = ogsm_strategies.ogsm_id 
  AND companies.owner_user_id = auth.uid()
));

-- RLS Policies para ogsm_measures
CREATE POLICY "Users can view measures of their strategies" 
ON public.ogsm_measures FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM ogsm_strategies 
  JOIN ogsm ON ogsm.id = ogsm_strategies.ogsm_id 
  JOIN companies ON companies.id = ogsm.company_id 
  WHERE ogsm_strategies.id = ogsm_measures.strategy_id 
  AND companies.owner_user_id = auth.uid()
));

CREATE POLICY "Users can insert measures for their strategies" 
ON public.ogsm_measures FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM ogsm_strategies 
  JOIN ogsm ON ogsm.id = ogsm_strategies.ogsm_id 
  JOIN companies ON companies.id = ogsm.company_id 
  WHERE ogsm_strategies.id = ogsm_measures.strategy_id 
  AND companies.owner_user_id = auth.uid()
));

CREATE POLICY "Users can update measures of their strategies" 
ON public.ogsm_measures FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM ogsm_strategies 
  JOIN ogsm ON ogsm.id = ogsm_strategies.ogsm_id 
  JOIN companies ON companies.id = ogsm.company_id 
  WHERE ogsm_strategies.id = ogsm_measures.strategy_id 
  AND companies.owner_user_id = auth.uid()
));

CREATE POLICY "Users can delete measures of their strategies" 
ON public.ogsm_measures FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM ogsm_strategies 
  JOIN ogsm ON ogsm.id = ogsm_strategies.ogsm_id 
  JOIN companies ON companies.id = ogsm.company_id 
  WHERE ogsm_strategies.id = ogsm_measures.strategy_id 
  AND companies.owner_user_id = auth.uid()
));

-- RLS Policies para pestel_analysis
CREATE POLICY "Users can view pestel of their companies" 
ON public.pestel_analysis FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM companies 
  WHERE companies.id = pestel_analysis.company_id 
  AND companies.owner_user_id = auth.uid()
));

CREATE POLICY "Users can insert pestel for their companies" 
ON public.pestel_analysis FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM companies 
  WHERE companies.id = pestel_analysis.company_id 
  AND companies.owner_user_id = auth.uid()
));

CREATE POLICY "Users can update pestel of their companies" 
ON public.pestel_analysis FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM companies 
  WHERE companies.id = pestel_analysis.company_id 
  AND companies.owner_user_id = auth.uid()
));

CREATE POLICY "Users can delete pestel of their companies" 
ON public.pestel_analysis FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM companies 
  WHERE companies.id = pestel_analysis.company_id 
  AND companies.owner_user_id = auth.uid()
));

-- RLS Policies para execution_plan
CREATE POLICY "Users can view execution plan of their companies" 
ON public.execution_plan FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM companies 
  WHERE companies.id = execution_plan.company_id 
  AND companies.owner_user_id = auth.uid()
));

CREATE POLICY "Users can insert execution plan for their companies" 
ON public.execution_plan FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM companies 
  WHERE companies.id = execution_plan.company_id 
  AND companies.owner_user_id = auth.uid()
));

CREATE POLICY "Users can update execution plan of their companies" 
ON public.execution_plan FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM companies 
  WHERE companies.id = execution_plan.company_id 
  AND companies.owner_user_id = auth.uid()
));

CREATE POLICY "Users can delete execution plan of their companies" 
ON public.execution_plan FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM companies 
  WHERE companies.id = execution_plan.company_id 
  AND companies.owner_user_id = auth.uid()
));

-- Triggers para updated_at
CREATE TRIGGER update_ogsm_updated_at
BEFORE UPDATE ON public.ogsm
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_ogsm_goals_updated_at
BEFORE UPDATE ON public.ogsm_goals
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_ogsm_strategies_updated_at
BEFORE UPDATE ON public.ogsm_strategies
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_ogsm_measures_updated_at
BEFORE UPDATE ON public.ogsm_measures
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_pestel_analysis_updated_at
BEFORE UPDATE ON public.pestel_analysis
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_execution_plan_updated_at
BEFORE UPDATE ON public.execution_plan
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
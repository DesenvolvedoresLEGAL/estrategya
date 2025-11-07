-- Create wizard_progress table to track user progress through the wizard
CREATE TABLE IF NOT EXISTS public.wizard_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  current_step INTEGER NOT NULL DEFAULT 1,
  completed_steps INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  step_data JSONB DEFAULT '{}'::JSONB,
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT wizard_progress_user_company_unique UNIQUE(user_id, company_id)
);

-- Enable RLS
ALTER TABLE public.wizard_progress ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own wizard progress"
  ON public.wizard_progress
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wizard progress"
  ON public.wizard_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wizard progress"
  ON public.wizard_progress
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wizard progress"
  ON public.wizard_progress
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS handle_wizard_progress_updated_at ON public.wizard_progress;
CREATE TRIGGER handle_wizard_progress_updated_at
  BEFORE UPDATE ON public.wizard_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_wizard_progress_user_id ON public.wizard_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_wizard_progress_company_id ON public.wizard_progress(company_id);
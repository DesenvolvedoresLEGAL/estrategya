-- Criar tabela de check-ins semanais
CREATE TABLE IF NOT EXISTS weekly_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_plan_id UUID NOT NULL REFERENCES execution_plan(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  week_start_date DATE NOT NULL,
  mci_progress INTEGER CHECK (mci_progress >= 0 AND mci_progress <= 100),
  completed_actions TEXT[],
  blockers TEXT,
  next_week_commitments TEXT,
  attendees UUID[],
  notes TEXT,
  conducted_by UUID REFERENCES auth.users(id),
  conducted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE weekly_checkins ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para weekly_checkins
CREATE POLICY "Users can view checkins of their companies"
  ON weekly_checkins FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = weekly_checkins.company_id
      AND companies.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert checkins for their companies"
  ON weekly_checkins FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = weekly_checkins.company_id
      AND companies.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update checkins of their companies"
  ON weekly_checkins FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = weekly_checkins.company_id
      AND companies.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete checkins of their companies"
  ON weekly_checkins FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = weekly_checkins.company_id
      AND companies.owner_user_id = auth.uid()
    )
  );

-- Criar tabela de lembretes de execução
CREATE TABLE IF NOT EXISTS execution_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP WITH TIME ZONE,
  recipient_ids UUID[],
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE execution_reminders ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para execution_reminders
CREATE POLICY "Users can view reminders of their companies"
  ON execution_reminders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = execution_reminders.company_id
      AND companies.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert reminders for their companies"
  ON execution_reminders FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = execution_reminders.company_id
      AND companies.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update reminders of their companies"
  ON execution_reminders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = execution_reminders.company_id
      AND companies.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete reminders of their companies"
  ON execution_reminders FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = execution_reminders.company_id
      AND companies.owner_user_id = auth.uid()
    )
  );

-- Índices para melhor performance
CREATE INDEX idx_weekly_checkins_company_id ON weekly_checkins(company_id);
CREATE INDEX idx_weekly_checkins_execution_plan_id ON weekly_checkins(execution_plan_id);
CREATE INDEX idx_weekly_checkins_week_start_date ON weekly_checkins(week_start_date);
CREATE INDEX idx_execution_reminders_company_id ON execution_reminders(company_id);
CREATE INDEX idx_execution_reminders_scheduled_for ON execution_reminders(scheduled_for);
CREATE INDEX idx_execution_reminders_sent ON execution_reminders(sent);

-- Habilitar realtime para weekly_checkins
ALTER PUBLICATION supabase_realtime ADD TABLE weekly_checkins;
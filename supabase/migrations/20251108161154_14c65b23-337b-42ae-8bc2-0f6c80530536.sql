-- Fix critical RLS policy vulnerabilities

-- 1. Fix team_invites RLS policy to prevent token hijacking
DROP POLICY IF EXISTS "Team members can view invites" ON team_invites;

CREATE POLICY "Users view own invites or admins view all"
ON team_invites FOR SELECT
USING (
  -- Users can see invites sent to their email
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
  OR
  -- Admins/owners can see all invites for their company
  company_id IN (
    SELECT company_id FROM team_members 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);

-- 2. Fix comments RLS policy to prevent cross-company data leakage
DROP POLICY IF EXISTS "Team members can view comments" ON comments;

CREATE POLICY "Team members view own company comments"
ON comments FOR SELECT
USING (
  -- For objective comments - verify through company ownership
  (entity_type = 'objective' AND entity_id IN (
    SELECT so.id FROM strategic_objectives so
    JOIN companies c ON c.id = so.company_id
    JOIN team_members tm ON tm.company_id = c.id
    WHERE tm.user_id = auth.uid()
  ))
  OR
  -- For initiative comments - verify through objective->company chain
  (entity_type = 'initiative' AND entity_id IN (
    SELECT i.id FROM initiatives i
    JOIN strategic_objectives so ON so.id = i.objective_id
    JOIN companies c ON c.id = so.company_id
    JOIN team_members tm ON tm.company_id = c.id
    WHERE tm.user_id = auth.uid()
  ))
);

-- Add indexes to improve RLS policy performance
CREATE INDEX IF NOT EXISTS idx_comments_entity_type_id ON comments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_company ON team_members(user_id, company_id);
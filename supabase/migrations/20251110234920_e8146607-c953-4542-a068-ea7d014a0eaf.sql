-- Drop existing problematic policies on team_members
DROP POLICY IF EXISTS "Admins can insert team members" ON public.team_members;
DROP POLICY IF EXISTS "Admins can update team members" ON public.team_members;
DROP POLICY IF EXISTS "Admins can delete team members" ON public.team_members;
DROP POLICY IF EXISTS "Team members can view own team" ON public.team_members;

-- Create a function to check if user is admin or owner for a company
CREATE OR REPLACE FUNCTION public.is_company_admin(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM team_members
    WHERE user_id = _user_id
      AND company_id = _company_id
      AND role IN ('owner', 'admin')
  )
$$;

-- Create new policies using the security definer function
CREATE POLICY "Admins can insert team members"
ON public.team_members
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_company_admin(auth.uid(), company_id)
);

CREATE POLICY "Admins can update team members"
ON public.team_members
FOR UPDATE
TO authenticated
USING (
  public.is_company_admin(auth.uid(), company_id)
);

CREATE POLICY "Admins can delete team members"
ON public.team_members
FOR DELETE
TO authenticated
USING (
  public.is_company_admin(auth.uid(), company_id)
);

CREATE POLICY "Team members can view own team"
ON public.team_members
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR public.is_company_admin(auth.uid(), company_id)
);
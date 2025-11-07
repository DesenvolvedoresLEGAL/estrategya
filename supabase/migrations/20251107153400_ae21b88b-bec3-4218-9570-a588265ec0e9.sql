-- Create platform_role enum for global platform administrators
CREATE TYPE public.platform_role AS ENUM ('platform_admin', 'platform_moderator');

-- Create user_roles table for global platform roles (separate from team_members)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role platform_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check platform roles
CREATE OR REPLACE FUNCTION public.has_platform_role(_user_id UUID, _role platform_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create security definer function to check if current user is platform admin
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'platform_admin'
  )
$$;

-- RLS Policies for user_roles table
CREATE POLICY "Platform admins can view all roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (public.has_platform_role(auth.uid(), 'platform_admin'));

CREATE POLICY "Platform admins can insert roles"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_platform_role(auth.uid(), 'platform_admin'));

CREATE POLICY "Platform admins can update roles"
  ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING (public.has_platform_role(auth.uid(), 'platform_admin'));

CREATE POLICY "Platform admins can delete roles"
  ON public.user_roles
  FOR DELETE
  TO authenticated
  USING (public.has_platform_role(auth.uid(), 'platform_admin'));

-- Insert platform admin role for wagsansevero@gmail.com
-- First we need to get the user_id from auth.users
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Try to get the user ID for wagsansevero@gmail.com
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'wagsansevero@gmail.com'
  LIMIT 1;
  
  -- If user exists, insert the platform_admin role
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'platform_admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;
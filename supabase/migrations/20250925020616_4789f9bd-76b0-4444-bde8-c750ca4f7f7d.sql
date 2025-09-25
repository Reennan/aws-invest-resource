-- Adicionar role 'editor' ao enum existente
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'editor';

-- Atualizar a função is_admin para incluir is_editor
CREATE OR REPLACE FUNCTION public.is_editor()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users_profile
    WHERE auth_user_id = auth.uid()
      AND role IN ('admin', 'editor')
      AND is_active = true
  )
$$;
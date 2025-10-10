-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Criar schema auth (para autenticação)
CREATE SCHEMA IF NOT EXISTS auth;

-- Criar tabela de usuários (auth.users)
CREATE TABLE IF NOT EXISTS auth.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  encrypted_password TEXT NOT NULL,
  email_confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  raw_user_meta_data JSONB DEFAULT '{}'::jsonb
);

-- Criar enum para roles
CREATE TYPE user_role AS ENUM ('admin', 'editor', 'viewer');

-- Tabela: users_profile
CREATE TABLE IF NOT EXISTS public.users_profile (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'viewer',
  is_active BOOLEAN DEFAULT true,
  can_view_dashboard BOOLEAN DEFAULT true,
  can_view_clusters BOOLEAN DEFAULT false,
  can_view_reports BOOLEAN DEFAULT false,
  can_manage_users BOOLEAN DEFAULT false,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela: clusters
CREATE TABLE IF NOT EXISTS public.clusters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela: runs
CREATE TABLE IF NOT EXISTS public.runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cluster_id UUID REFERENCES public.clusters(id) ON DELETE CASCADE,
  run_ts TIMESTAMPTZ NOT NULL,
  region TEXT NOT NULL,
  resource_created_days INTEGER NOT NULL,
  resource_unused_days INTEGER NOT NULL,
  created_count INTEGER NOT NULL,
  unused_count INTEGER NOT NULL,
  succeeded BOOLEAN DEFAULT true,
  error JSONB
);

-- Tabela: resources_created
CREATE TABLE IF NOT EXISTS public.resources_created (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cluster_id UUID REFERENCES public.clusters(id) ON DELETE CASCADE,
  run_id UUID REFERENCES public.runs(id) ON DELETE CASCADE,
  name TEXT,
  type TEXT,
  account_name TEXT,
  created_at TIMESTAMPTZ,
  console_link TEXT,
  manage_status TEXT,
  raw JSONB
);

-- Tabela: resources_unused
CREATE TABLE IF NOT EXISTS public.resources_unused (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cluster_id UUID REFERENCES public.clusters(id) ON DELETE CASCADE,
  run_id UUID REFERENCES public.runs(id) ON DELETE CASCADE,
  resource_id TEXT,
  name TEXT,
  type TEXT,
  account_name TEXT,
  route TEXT,
  method TEXT,
  status TEXT,
  console_link TEXT,
  days_without_use INTEGER,
  total_requests INTEGER,
  messages_sent INTEGER,
  messages_received INTEGER,
  messages_not_visible INTEGER,
  empty_receives INTEGER,
  invocations INTEGER,
  metrics JSONB,
  raw JSONB
);

-- Tabela: user_cluster_permissions
CREATE TABLE IF NOT EXISTS public.user_cluster_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users_profile(id) ON DELETE CASCADE,
  cluster_id UUID REFERENCES public.clusters(id) ON DELETE CASCADE,
  can_view BOOLEAN DEFAULT true,
  UNIQUE(user_id, cluster_id)
);

-- Tabela: password_reset_tokens
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Views
CREATE OR REPLACE VIEW public.v_dashboard_totals AS
SELECT
  (SELECT COUNT(*) FROM public.clusters WHERE is_active = true) AS clusters_disponiveis,
  (SELECT COUNT(*) FROM public.resources_created WHERE created_at >= now() - interval '30 days') AS recursos_criados_periodo,
  (SELECT COUNT(*) FROM public.resources_unused) AS recursos_sem_uso_periodo,
  now() AS generated_at;

CREATE OR REPLACE VIEW public.v_unused_by_type AS
SELECT
  type,
  COUNT(*) AS total
FROM public.resources_unused
GROUP BY type
ORDER BY total DESC;

-- Functions
CREATE OR REPLACE FUNCTION public.get_user_profile_id()
RETURNS UUID
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id
  FROM public.users_profile
  WHERE auth_user_id = current_setting('app.current_user_id')::uuid
    AND is_active = true
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users_profile
    WHERE auth_user_id = current_setting('app.current_user_id')::uuid
      AND role = 'admin'
      AND is_active = true
  )
$$;

CREATE OR REPLACE FUNCTION public.is_editor()
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users_profile
    WHERE auth_user_id = current_setting('app.current_user_id')::uuid
      AND role IN ('admin', 'editor')
      AND is_active = true
  )
$$;

-- Trigger function para definir permissões baseadas no role
CREATE OR REPLACE FUNCTION public.set_user_permissions_by_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  CASE NEW.role
    WHEN 'admin' THEN
      NEW.can_view_dashboard := true;
      NEW.can_view_clusters := true;
      NEW.can_view_reports := true;
      NEW.can_manage_users := true;
    WHEN 'editor' THEN
      NEW.can_view_dashboard := true;
      NEW.can_view_clusters := true;
      NEW.can_view_reports := true;
      NEW.can_manage_users := false;
    WHEN 'viewer' THEN
      NEW.can_view_dashboard := true;
      NEW.can_view_clusters := false;
      NEW.can_view_reports := false;
      NEW.can_manage_users := false;
  END CASE;
  
  RETURN NEW;
END;
$$;

-- Trigger para auto-atualizar permissões
CREATE TRIGGER trigger_set_user_permissions
BEFORE INSERT OR UPDATE ON public.users_profile
FOR EACH ROW
EXECUTE FUNCTION public.set_user_permissions_by_role();

-- Trigger function para criar perfil quando usuário é criado
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users_profile (auth_user_id, name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'name',
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Criar usuário admin padrão (senha: admin123)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@awsresource.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  '{"name": "Admin User"}'::jsonb
) ON CONFLICT (email) DO NOTHING;

INSERT INTO public.users_profile (auth_user_id, name, email, role)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Admin User',
  'admin@awsresource.com',
  'admin'
) ON CONFLICT DO NOTHING;

-- Criar alguns clusters de exemplo
INSERT INTO public.clusters (name, is_active) VALUES
  ('Cluster Produção', true),
  ('Cluster Desenvolvimento', true),
  ('Cluster Teste', false)
ON CONFLICT DO NOTHING;

-- Pré-requisitos
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum de papéis
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('viewer','admin');
  END IF;
END $$;

-- Tabelas principais
CREATE TABLE IF NOT EXISTS public.clusters(
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.runs(
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  cluster_id uuid REFERENCES public.clusters(id) ON DELETE CASCADE,
  run_ts timestamptz NOT NULL,
  region text NOT NULL,
  resource_created_days int NOT NULL,
  resource_unused_days int NOT NULL,
  created_count int NOT NULL,
  unused_count int NOT NULL,
  succeeded boolean DEFAULT true,
  error jsonb
);

CREATE TABLE IF NOT EXISTS public.resources_created(
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id uuid REFERENCES public.runs(id) ON DELETE CASCADE,
  cluster_id uuid REFERENCES public.clusters(id) ON DELETE CASCADE,
  account_name text,
  name text,
  type text,
  manage_status text,
  created_at timestamptz,
  console_link text,
  raw jsonb
);
CREATE INDEX IF NOT EXISTS idx_rc_cluster_created_at ON public.resources_created(cluster_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.resources_unused(
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id uuid REFERENCES public.runs(id) ON DELETE CASCADE,
  cluster_id uuid REFERENCES public.clusters(id) ON DELETE CASCADE,
  account_name text,
  name text,
  resource_id text,
  type text,
  days_without_use int,
  console_link text,
  route text,
  method text,
  total_requests int,
  status text,
  messages_sent int,
  messages_received int,
  messages_not_visible int,
  empty_receives int,
  invocations int,
  metrics jsonb,
  raw jsonb
);
CREATE INDEX IF NOT EXISTS idx_ru_cluster_days ON public.resources_unused(cluster_id, days_without_use);
CREATE INDEX IF NOT EXISTS idx_ru_type ON public.resources_unused(type);

-- Perfis & permissões (para o front)
CREATE TABLE IF NOT EXISTS public.users_profile(
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id uuid UNIQUE,
  name text,
  email text UNIQUE NOT NULL,
  phone text,
  role user_role NOT NULL DEFAULT 'viewer',
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  can_view_dashboard boolean DEFAULT true,
  can_view_clusters boolean DEFAULT false,
  can_view_reports boolean DEFAULT false,
  can_manage_users boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.user_cluster_permissions(
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.users_profile(id) ON DELETE CASCADE,
  cluster_id uuid REFERENCES public.clusters(id) ON DELETE CASCADE,
  can_view boolean DEFAULT true,
  UNIQUE(user_id, cluster_id)
);

-- Views de apoio ao Dashboard
CREATE OR REPLACE VIEW public.v_dashboard_totals AS
SELECT
  now()::timestamptz AS generated_at,
  count(DISTINCT c.id) AS clusters_disponiveis,
  coalesce(sum(r.created_count),0) AS recursos_criados_periodo,
  coalesce(sum(r.unused_count),0) AS recursos_sem_uso_periodo
FROM public.clusters c
LEFT JOIN public.runs r
  ON r.cluster_id = c.id
 AND r.run_ts >= now() - interval '30 days';

CREATE OR REPLACE VIEW public.v_unused_by_type AS
SELECT ru.type, count(*) AS total
FROM public.resources_unused ru
WHERE ru.run_id IN (SELECT id FROM public.runs WHERE run_ts >= now() - interval '30 days')
GROUP BY ru.type;

-- ========== REALTIME BROADCAST (sem replication) ==========
-- Função de notificação via Broadcast
CREATE OR REPLACE FUNCTION public.notify_resource_changes()
RETURNS trigger
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  -- O tópico pode ser único ou por cluster: 'topic:resources' ou 'topic:' || coalesce(NEW.cluster_id, OLD.cluster_id)::text
  PERFORM realtime.broadcast_changes(
    'topic:resources',      -- topic
    TG_OP,                  -- event (INSERT/UPDATE/DELETE)
    TG_OP,                  -- operation (mantém igual ao exemplo)
    TG_TABLE_NAME,          -- table
    TG_TABLE_SCHEMA,        -- schema
    NEW,                    -- new record
    OLD                     -- old record
  );
  RETURN null;
END;
$$;

-- Triggers para runs/resources
DROP TRIGGER IF EXISTS t_brd_runs ON public.runs;
CREATE TRIGGER t_brd_runs
AFTER INSERT OR UPDATE OR DELETE ON public.runs
FOR EACH ROW EXECUTE FUNCTION public.notify_resource_changes();

DROP TRIGGER IF EXISTS t_brd_resources_created ON public.resources_created;
CREATE TRIGGER t_brd_resources_created
AFTER INSERT OR UPDATE OR DELETE ON public.resources_created
FOR EACH ROW EXECUTE FUNCTION public.notify_resource_changes();

DROP TRIGGER IF EXISTS t_brd_resources_unused ON public.resources_unused;
CREATE TRIGGER t_brd_resources_unused
AFTER INSERT OR UPDATE OR DELETE ON public.resources_unused
FOR EACH ROW EXECUTE FUNCTION public.notify_resource_changes();

-- ========== RLS POLICIES ==========
-- Enable RLS on all tables
ALTER TABLE public.users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_cluster_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources_created ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources_unused ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users_profile
    WHERE auth_user_id = auth.uid()
      AND role = 'admin'
      AND is_active = true
  )
$$;

-- Helper function to get user profile id
CREATE OR REPLACE FUNCTION public.get_user_profile_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id
  FROM public.users_profile
  WHERE auth_user_id = auth.uid()
    AND is_active = true
$$;

-- users_profile policies
CREATE POLICY "Users can view their own profile"
ON public.users_profile
FOR SELECT
TO authenticated
USING (auth_user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can update their own profile"
ON public.users_profile
FOR UPDATE
TO authenticated
USING (auth_user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Admins can insert profiles"
ON public.users_profile
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- user_cluster_permissions policies
CREATE POLICY "Users can view their own permissions"
ON public.user_cluster_permissions
FOR SELECT
TO authenticated
USING (user_id = public.get_user_profile_id() OR public.is_admin());

CREATE POLICY "Admins can manage all permissions"
ON public.user_cluster_permissions
FOR ALL
TO authenticated
USING (public.is_admin());

-- runs policies
CREATE POLICY "Users can view runs for permitted clusters"
ON public.runs
FOR SELECT
TO authenticated
USING (
  public.is_admin() OR
  EXISTS (
    SELECT 1
    FROM public.user_cluster_permissions ucp
    WHERE ucp.user_id = public.get_user_profile_id()
      AND ucp.cluster_id = runs.cluster_id
      AND ucp.can_view = true
  )
);

-- resources_created policies
CREATE POLICY "Users can view resources for permitted clusters"
ON public.resources_created
FOR SELECT
TO authenticated
USING (
  public.is_admin() OR
  EXISTS (
    SELECT 1
    FROM public.user_cluster_permissions ucp
    WHERE ucp.user_id = public.get_user_profile_id()
      AND ucp.cluster_id = resources_created.cluster_id
      AND ucp.can_view = true
  )
);

-- resources_unused policies
CREATE POLICY "Users can view unused resources for permitted clusters"
ON public.resources_unused
FOR SELECT
TO authenticated
USING (
  public.is_admin() OR
  EXISTS (
    SELECT 1
    FROM public.user_cluster_permissions ucp
    WHERE ucp.user_id = public.get_user_profile_id()
      AND ucp.cluster_id = resources_unused.cluster_id
      AND ucp.can_view = true
  )
);

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
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

-- Trigger to create profile on user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert some sample data for testing
INSERT INTO public.clusters (name, is_active) VALUES 
('production-cluster', true),
('staging-cluster', true),
('development-cluster', false)
ON CONFLICT (name) DO NOTHING;
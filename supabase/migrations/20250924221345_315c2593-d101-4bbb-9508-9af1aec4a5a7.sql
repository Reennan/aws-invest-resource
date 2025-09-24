-- Fix security issues from linter

-- 1. Enable RLS on clusters table (this was missing)
ALTER TABLE public.clusters ENABLE ROW LEVEL SECURITY;

-- Create policies for clusters table
CREATE POLICY "Authenticated users can view clusters"
ON public.clusters
FOR SELECT
TO authenticated
USING (true);

-- Only admins can manage clusters
CREATE POLICY "Admins can manage clusters"
ON public.clusters
FOR ALL
TO authenticated
USING (public.is_admin());

-- 2. Fix function search paths by ensuring all functions have stable search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
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

CREATE OR REPLACE FUNCTION public.notify_resource_changes()
RETURNS trigger
SECURITY DEFINER
LANGUAGE plpgsql
STABLE
SET search_path = public
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

-- 3. Recreate views without SECURITY DEFINER to fix the security definer view warnings
-- These views should use SECURITY INVOKER (default) so they respect the calling user's permissions

DROP VIEW IF EXISTS public.v_dashboard_totals;
CREATE VIEW public.v_dashboard_totals AS
SELECT
  now()::timestamptz AS generated_at,
  count(DISTINCT c.id) AS clusters_disponiveis,
  coalesce(sum(r.created_count),0) AS recursos_criados_periodo,
  coalesce(sum(r.unused_count),0) AS recursos_sem_uso_periodo
FROM public.clusters c
LEFT JOIN public.runs r
  ON r.cluster_id = c.id
 AND r.run_ts >= now() - interval '30 days';

DROP VIEW IF EXISTS public.v_unused_by_type;
CREATE VIEW public.v_unused_by_type AS
SELECT ru.type, count(*) AS total
FROM public.resources_unused ru
WHERE ru.run_id IN (SELECT id FROM public.runs WHERE run_ts >= now() - interval '30 days')
GROUP BY ru.type;
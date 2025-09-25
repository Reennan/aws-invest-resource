-- Criar função para upsert de recursos criados (inserir ou atualizar se já existe)
CREATE OR REPLACE FUNCTION public.upsert_resource_created(
  p_cluster_id uuid,
  p_run_id uuid,
  p_name text,
  p_type text,
  p_account_name text,
  p_console_link text DEFAULT NULL,
  p_manage_status text DEFAULT NULL,
  p_raw jsonb DEFAULT NULL,
  p_created_at timestamp with time zone DEFAULT now()
)
RETURNS uuid AS $$
DECLARE
  resource_id uuid;
BEGIN
  INSERT INTO public.resources_created (
    cluster_id, run_id, name, type, account_name, console_link, manage_status, raw, created_at
  )
  VALUES (
    p_cluster_id, p_run_id, p_name, p_type, p_account_name, p_console_link, p_manage_status, p_raw, p_created_at
  )
  ON CONFLICT (cluster_id, name, type) 
  DO UPDATE SET
    run_id = EXCLUDED.run_id,
    account_name = EXCLUDED.account_name,
    console_link = EXCLUDED.console_link,
    manage_status = EXCLUDED.manage_status,
    raw = EXCLUDED.raw,
    created_at = EXCLUDED.created_at
  RETURNING id INTO resource_id;
  
  RETURN resource_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar função para upsert de recursos não utilizados
CREATE OR REPLACE FUNCTION public.upsert_resource_unused(
  p_cluster_id uuid,
  p_run_id uuid,
  p_name text,
  p_type text,
  p_resource_id text,
  p_account_name text,
  p_console_link text DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_days_without_use integer DEFAULT NULL,
  p_raw jsonb DEFAULT NULL,
  p_metrics jsonb DEFAULT NULL,
  p_total_requests integer DEFAULT NULL,
  p_messages_sent integer DEFAULT NULL,
  p_messages_received integer DEFAULT NULL,
  p_messages_not_visible integer DEFAULT NULL,
  p_empty_receives integer DEFAULT NULL,
  p_invocations integer DEFAULT NULL,
  p_route text DEFAULT NULL,
  p_method text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  resource_uuid uuid;
BEGIN
  INSERT INTO public.resources_unused (
    cluster_id, run_id, name, type, resource_id, account_name, console_link, 
    status, days_without_use, raw, metrics, total_requests, messages_sent, 
    messages_received, messages_not_visible, empty_receives, invocations, route, method
  )
  VALUES (
    p_cluster_id, p_run_id, p_name, p_type, p_resource_id, p_account_name, p_console_link,
    p_status, p_days_without_use, p_raw, p_metrics, p_total_requests, p_messages_sent,
    p_messages_received, p_messages_not_visible, p_empty_receives, p_invocations, p_route, p_method
  )
  ON CONFLICT (cluster_id, name, type)
  DO UPDATE SET
    run_id = EXCLUDED.run_id,
    resource_id = EXCLUDED.resource_id,
    account_name = EXCLUDED.account_name,
    console_link = EXCLUDED.console_link,
    status = EXCLUDED.status,
    days_without_use = EXCLUDED.days_without_use,
    raw = EXCLUDED.raw,
    metrics = EXCLUDED.metrics,
    total_requests = EXCLUDED.total_requests,
    messages_sent = EXCLUDED.messages_sent,
    messages_received = EXCLUDED.messages_received,
    messages_not_visible = EXCLUDED.messages_not_visible,
    empty_receives = EXCLUDED.empty_receives,
    invocations = EXCLUDED.invocations,
    route = EXCLUDED.route,
    method = EXCLUDED.method
  RETURNING id INTO resource_uuid;
  
  RETURN resource_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
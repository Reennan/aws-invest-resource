-- CORREÇÃO FINAL: Recriar views com security_invoker para respeitar RLS

-- Remover views existentes
DROP VIEW IF EXISTS public.v_dashboard_totals;
DROP VIEW IF EXISTS public.v_unused_by_type;

-- Recriar v_dashboard_totals com security_invoker
CREATE VIEW public.v_dashboard_totals
WITH (security_invoker = true) AS
SELECT 
    now() AS generated_at,
    count(DISTINCT c.id) AS clusters_disponiveis,
    COALESCE(sum(r.created_count), 0::bigint) AS recursos_criados_periodo,
    COALESCE(sum(r.unused_count), 0::bigint) AS recursos_sem_uso_periodo
FROM clusters c
LEFT JOIN runs r ON (
    r.cluster_id = c.id 
    AND r.run_ts >= (now() - interval '30 days')
);

-- Recriar v_unused_by_type com security_invoker
CREATE VIEW public.v_unused_by_type
WITH (security_invoker = true) AS
SELECT 
    type,
    count(*) AS total
FROM resources_unused ru
WHERE run_id IN (
    SELECT runs.id
    FROM runs
    WHERE runs.run_ts >= (now() - interval '30 days')
)
GROUP BY type;

-- Conceder permissões apenas para usuários autenticados
GRANT SELECT ON public.v_dashboard_totals TO authenticated;
GRANT SELECT ON public.v_unused_by_type TO authenticated;

COMMENT ON VIEW public.v_dashboard_totals IS 'Dashboard data with security_invoker - respects user RLS policies';
COMMENT ON VIEW public.v_unused_by_type IS 'Unused resources by type with security_invoker - respects user RLS policies';
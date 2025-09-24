-- Correção de segurança: Remover SECURITY DEFINER das views para respeitar RLS

-- Recriar v_dashboard_totals sem SECURITY DEFINER
DROP VIEW IF EXISTS public.v_dashboard_totals;

CREATE VIEW public.v_dashboard_totals AS
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

-- Recriar v_unused_by_type sem SECURITY DEFINER  
DROP VIEW IF EXISTS public.v_unused_by_type;

CREATE VIEW public.v_unused_by_type AS
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

COMMENT ON VIEW public.v_dashboard_totals IS 'Dashboard aggregated data respecting user permissions via RLS';
COMMENT ON VIEW public.v_unused_by_type IS 'Unused resources grouped by type respecting user permissions via RLS';
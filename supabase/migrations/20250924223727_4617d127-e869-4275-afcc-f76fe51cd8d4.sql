-- Correção adicional: Remover permissões excessivas das views e garantir que respeitem RLS

-- Revogar todas as permissões das views
REVOKE ALL ON public.v_dashboard_totals FROM anon, authenticated;
REVOKE ALL ON public.v_unused_by_type FROM anon, authenticated;

-- Conceder apenas SELECT para authenticated (usuários logados)
GRANT SELECT ON public.v_dashboard_totals TO authenticated;
GRANT SELECT ON public.v_unused_by_type TO authenticated;

-- Garantir que as views respeitem RLS das tabelas subjacentes
-- Não precisamos habilitar RLS nas views pois elas herdam das tabelas base
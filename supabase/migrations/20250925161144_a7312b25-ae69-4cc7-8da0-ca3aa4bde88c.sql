-- Limpar todos os dados dos clusters e recursos
DELETE FROM public.resources_unused;
DELETE FROM public.resources_created;
DELETE FROM public.runs;
DELETE FROM public.user_cluster_permissions;
DELETE FROM public.clusters;
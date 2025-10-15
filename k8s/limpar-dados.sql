-- Script para limpar dados de todas as tabelas (exceto auth)
-- Execute este script conectado ao PostgreSQL no Kubernetes

-- Verificar dados existentes antes de limpar
SELECT 'Verificando dados existentes...' as status;

SELECT 'clusters' as tabela, COUNT(*) as registros FROM public.clusters;
SELECT 'resources_created' as tabela, COUNT(*) as registros FROM public.resources_created;
SELECT 'resources_unused' as tabela, COUNT(*) as registros FROM public.resources_unused;
SELECT 'runs' as tabela, COUNT(*) as registros FROM public.runs;
SELECT 'user_cluster_permissions' as tabela, COUNT(*) as registros FROM public.user_cluster_permissions;
SELECT 'password_reset_tokens' as tabela, COUNT(*) as registros FROM public.password_reset_tokens;

-- Limpar dados de todas as tabelas (em ordem para respeitar foreign keys)
SELECT 'Limpando dados...' as status;

-- 1. Limpar recursos (dependem de clusters e runs)
DELETE FROM public.resources_created;
DELETE FROM public.resources_unused;

-- 2. Limpar permissões de usuários em clusters
DELETE FROM public.user_cluster_permissions;

-- 3. Limpar runs
DELETE FROM public.runs;

-- 4. Limpar clusters
DELETE FROM public.clusters;

-- 5. Limpar tokens de reset de senha
DELETE FROM public.password_reset_tokens;

-- Verificar se as tabelas foram limpas
SELECT 'Verificando após limpeza...' as status;

SELECT 'clusters' as tabela, COUNT(*) as registros FROM public.clusters;
SELECT 'resources_created' as tabela, COUNT(*) as registros FROM public.resources_created;
SELECT 'resources_unused' as tabela, COUNT(*) as registros FROM public.resources_unused;
SELECT 'runs' as tabela, COUNT(*) as registros FROM public.runs;
SELECT 'user_cluster_permissions' as tabela, COUNT(*) as registros FROM public.user_cluster_permissions;
SELECT 'password_reset_tokens' as tabela, COUNT(*) as registros FROM public.password_reset_tokens;

SELECT '✅ Limpeza concluída com sucesso!' as status;

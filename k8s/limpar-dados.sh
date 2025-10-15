#!/bin/bash

# Script para limpar dados do PostgreSQL no Kubernetes
# Execute este script na máquina que tem acesso ao cluster Kubernetes

echo "🗑️  Iniciando limpeza de dados do PostgreSQL..."
echo ""

# Conectar ao pod do PostgreSQL e executar o script de limpeza
kubectl exec -n ms-frontend-picpay-monitor postgres-0 -- \
  psql -U postgres -d aws_resource_db -c "
    -- Verificar dados existentes
    SELECT 'clusters: ' || COUNT(*) as info FROM public.clusters UNION ALL
    SELECT 'resources_created: ' || COUNT(*) FROM public.resources_created UNION ALL
    SELECT 'resources_unused: ' || COUNT(*) FROM public.resources_unused UNION ALL
    SELECT 'runs: ' || COUNT(*) FROM public.runs UNION ALL
    SELECT 'user_cluster_permissions: ' || COUNT(*) FROM public.user_cluster_permissions;
    
    -- Limpar dados
    DELETE FROM public.resources_created;
    DELETE FROM public.resources_unused;
    DELETE FROM public.user_cluster_permissions;
    DELETE FROM public.runs;
    DELETE FROM public.clusters;
    DELETE FROM public.password_reset_tokens;
    
    -- Verificar após limpeza
    SELECT '✅ Limpeza concluída!' as status;
    SELECT 'clusters: ' || COUNT(*) as info FROM public.clusters UNION ALL
    SELECT 'resources_created: ' || COUNT(*) FROM public.resources_created UNION ALL
    SELECT 'resources_unused: ' || COUNT(*) FROM public.resources_unused UNION ALL
    SELECT 'runs: ' || COUNT(*) FROM public.runs UNION ALL
    SELECT 'user_cluster_permissions: ' || COUNT(*) FROM public.user_cluster_permissions;
  "

echo ""
echo "✅ Script de limpeza executado!"

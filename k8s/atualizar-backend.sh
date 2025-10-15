#!/bin/bash

# Script para atualizar o backend no Kubernetes
# Execute este script após fazer alterações no código do backend

echo "🔨 Construindo nova versão do backend..."
cd backend
docker build -t aws-resource-backend:latest .

echo ""
echo "🔄 Reiniciando pods do backend..."
kubectl rollout restart deployment/backend -n ms-frontend-picpay-monitor

echo ""
echo "⏳ Aguardando pods ficarem prontos..."
kubectl rollout status deployment/backend -n ms-frontend-picpay-monitor

echo ""
echo "✅ Backend atualizado com sucesso!"
echo ""
echo "📋 Para ver os logs do backend, execute:"
echo "   kubectl logs -f deployment/backend -n ms-frontend-picpay-monitor"

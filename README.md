# AWS Resource Monitor - Kubernetes Internal

Sistema de monitoramento de recursos AWS totalmente internalizado no cluster Kubernetes.

## 🏗️ Arquitetura

- **Frontend**: React + Vite + Nginx (porta 8080)
- **Backend**: Node.js + Express (porta 3000)
- **Database**: PostgreSQL StatefulSet (porta 5432)
- **Ingress**: Kong
- **Namespace**: `ms-frontend-picpay-monitor`

## 🚀 Deploy Rápido

```bash
# 1. Login no ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  289208114389.dkr.ecr.us-east-1.amazonaws.com

# 2. Build Frontend (IMPORTANTE: usar --build-arg!)
docker build \
  --build-arg VITE_API_URL=/api \
  --no-cache \
  -t 289208114389.dkr.ecr.us-east-1.amazonaws.com/picpay-dev/ms-resource-frontend:v1.0.6 \
  -f Dockerfile .

# 3. Push
docker push 289208114389.dkr.ecr.us-east-1.amazonaws.com/picpay-dev/ms-resource-frontend:v1.0.6

# 4. Atualizar no Kubernetes
kubectl set image deployment/frontend \
  frontend=289208114389.dkr.ecr.us-east-1.amazonaws.com/picpay-dev/ms-resource-frontend:v1.0.6 \
  -n ms-frontend-picpay-monitor

kubectl rollout restart deployment/frontend -n ms-frontend-picpay-monitor
kubectl rollout status deployment/frontend -n ms-frontend-picpay-monitor
```

## 📚 Documentação Completa

Consulte [`ARQUITETURA_INTERNA_KUBERNETES.md`](./ARQUITETURA_INTERNA_KUBERNETES.md) para:
- Arquitetura detalhada
- Fluxo de autenticação
- Deploy completo (passo a passo)
- Verificação e troubleshooting
- Estrutura de arquivos
- Endpoints da API

## ⚠️ IMPORTANTE

- **NÃO use** o Supabase Cloud - tudo roda internamente no cluster
- **SEMPRE** use `--build-arg VITE_API_URL=/api` ao fazer build do frontend
- **SEMPRE** use `--no-cache` para evitar cache com variáveis antigas
- O arquivo `.env` deve ter APENAS: `VITE_API_URL=/api`

## 🔐 Credenciais do Banco de Dados

```
Host: postgres.ms-frontend-picpay-monitor.svc.cluster.local
Port: 5432
Database: aws_resource_db
User: postgres
Password: Primeiroacesso_2022
```

## 🌐 Acesso

**URL**: https://ms-frontend-picpay-monitor.hom-lionx.com.br

## ✅ Verificação Rápida

```bash
# Ver pods
kubectl get pods -n ms-frontend-picpay-monitor

# Ver logs
kubectl logs -f deployment/frontend -n ms-frontend-picpay-monitor
kubectl logs -f deployment/backend -n ms-frontend-picpay-monitor

# Testar banco
kubectl exec -it postgres-0 -n ms-frontend-picpay-monitor -- \
  psql -U postgres -d aws_resource_db -c "SELECT COUNT(*) FROM public.users_profile;"
```

## 🛠️ Desenvolvimento Local

```bash
# Frontend
npm install
npm run dev

# Backend
cd backend
npm install
npm run dev
```

**Nota**: Para desenvolvimento local, ajuste `VITE_API_URL` no `.env` para apontar ao backend local.

## 📦 Estrutura

```
.
├── backend/              # Backend Node.js/Express
├── k8s/                  # Manifestos Kubernetes
├── src/                  # Frontend React
│   ├── hooks/           # React hooks (useAuth, useClusters, etc.)
│   ├── lib/             # apiClient
│   └── pages/           # Páginas
├── .env                 # VITE_API_URL=/api
└── Dockerfile           # Frontend build
```

## 📝 Licença

Proprietary - PicPay

# 🏗️ Arquitetura Interna Kubernetes - AWS Resource Monitor

## 📋 Visão Geral

Este projeto está **100% internalizado no cluster Kubernetes**, sem dependências externas ao Supabase Cloud. Toda a autenticação, banco de dados e lógica de negócio rodam dentro do cluster.

```
┌─────────────────────────────────────────────────────────────┐
│                    CLUSTER KUBERNETES                        │
│  Namespace: ms-frontend-picpay-monitor                      │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │   Frontend   │───▶│   Backend    │───▶│  PostgreSQL  │ │
│  │   (Nginx)    │    │  (Node.js)   │    │ (StatefulSet)│ │
│  │   Porta 8080 │    │  Porta 3000  │    │  Porta 5432  │ │
│  └──────────────┘    └──────────────┘    └──────────────┘ │
│         ▲                                                    │
│         │                                                    │
│  ┌──────────────┐                                          │
│  │   Ingress    │                                          │
│  │    (Kong)    │                                          │
│  └──────────────┘                                          │
│         ▲                                                    │
└─────────│────────────────────────────────────────────────────┘
          │
          │ DNS Público
          ▼
https://ms-frontend-picpay-monitor.hom-lionx.com.br
```

## 🗄️ Banco de Dados PostgreSQL

### Configuração de Conexão
```yaml
Host: postgres.ms-frontend-picpay-monitor.svc.cluster.local
Port: 5432
Database: aws_resource_db
User: postgres
Password: Primeiroacesso_2022
```

### Schemas
- **auth**: Gerenciamento de usuários e autenticação (compatível com Supabase Auth)
- **public**: Tabelas de negócio (profiles, clusters, resources, etc.)

### Tabelas Principais
```sql
-- Schema auth
auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)

-- Schema public
public.users_profile (id, auth_user_id, name, email, phone, role, permissions)
public.clusters (id, name, is_active)
public.resources_created (id, cluster_id, run_id, name, type, account_name)
public.resources_unused (id, cluster_id, run_id, name, type, status, days_without_use)
public.runs (id, cluster_id, run_ts, region, created_count, unused_count)
public.user_cluster_permissions (id, user_id, cluster_id, can_view)
```

## 🔐 Fluxo de Autenticação

### 1. Sign Up
```
Browser → POST /api/auth/signup
         { email, password, name }
         ↓
Backend → Valida dados
         → Cria hash bcrypt da senha
         → INSERT INTO auth.users
         → Trigger cria users_profile automaticamente
         → Gera JWT token
         ↓
Browser ← { user, profile, token }
         → localStorage.setItem('auth_token', token)
```

### 2. Sign In
```
Browser → POST /api/auth/signin
         { email, password }
         ↓
Backend → SELECT FROM auth.users WHERE email = ?
         → bcrypt.compare(password, encrypted_password)
         → UPDATE users_profile SET last_login = now()
         → Gera JWT token
         ↓
Browser ← { user, profile, token }
         → localStorage.setItem('auth_token', token)
```

### 3. Requisições Autenticadas
```
Browser → GET /api/clusters
         Authorization: Bearer <token>
         ↓
Backend → jwt.verify(token)
         → SELECT FROM users WHERE id = decoded.userId
         → Executa query com permissões do usuário
         ↓
Browser ← { data }
```

## 🚀 Deploy Completo (Passo a Passo)

### Pré-requisitos
```bash
# 1. AWS CLI configurado
aws configure

# 2. kubectl configurado
kubectl get nodes

# 3. Acesso ao ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  289208114389.dkr.ecr.us-east-1.amazonaws.com
```

### Passo 1: Build do Frontend
```bash
# IMPORTANTE: Sempre usar --build-arg e --no-cache!
docker build \
  --build-arg VITE_API_URL=/api \
  --no-cache \
  -t 289208114389.dkr.ecr.us-east-1.amazonaws.com/picpay-dev/ms-resource-frontend:v1.0.6 \
  -f Dockerfile .
```

**⚠️ CRÍTICO**: O `--build-arg VITE_API_URL=/api` sobrescreve qualquer variável do `.env` durante o build do Vite!

### Passo 2: Push para ECR
```bash
docker push 289208114389.dkr.ecr.us-east-1.amazonaws.com/picpay-dev/ms-resource-frontend:v1.0.6
```

### Passo 3: Build do Backend
```bash
cd backend
docker build \
  -t 289208114389.dkr.ecr.us-east-1.amazonaws.com/picpay-dev/ms-resource-backend:v1.0.1 \
  -f Dockerfile .
docker push 289208114389.dkr.ecr.us-east-1.amazonaws.com/picpay-dev/ms-resource-backend:v1.0.1
```

### Passo 4: Deploy no Kubernetes
```bash
# Aplicar todos os manifestos
kubectl apply -f k8s/01-namespace.yaml
kubectl apply -f k8s/02-postgres-secret.yaml
kubectl apply -f k8s/03-postgres-pvc.yaml
kubectl apply -f k8s/04-postgres-statefulset.yaml
kubectl apply -f k8s/05-postgres-service.yaml
kubectl apply -f k8s/06-init-db.sql
kubectl apply -f k8s/07-backend-secret.yaml
kubectl apply -f k8s/08-backend-deployment.yaml
kubectl apply -f k8s/09-frontend-configmap.yaml
kubectl apply -f k8s/10-frontend-deployment.yaml
kubectl apply -f k8s/11-ingress.yaml

# Verificar status
kubectl get pods -n ms-frontend-picpay-monitor
kubectl get svc -n ms-frontend-picpay-monitor
kubectl get ingress -n ms-frontend-picpay-monitor
```

### Passo 5: Atualizar Imagens (após novas versões)
```bash
# Frontend
kubectl set image deployment/frontend \
  frontend=289208114389.dkr.ecr.us-east-1.amazonaws.com/picpay-dev/ms-resource-frontend:v1.0.6 \
  -n ms-frontend-picpay-monitor

# Backend
kubectl set image deployment/backend \
  backend=289208114389.dkr.ecr.us-east-1.amazonaws.com/picpay-dev/ms-resource-backend:v1.0.1 \
  -n ms-frontend-picpay-monitor

# Forçar restart dos pods
kubectl rollout restart deployment/frontend -n ms-frontend-picpay-monitor
kubectl rollout restart deployment/backend -n ms-frontend-picpay-monitor

# Aguardar rollout completo
kubectl rollout status deployment/frontend -n ms-frontend-picpay-monitor
kubectl rollout status deployment/backend -n ms-frontend-picpay-monitor
```

## ✅ Verificação Completa

### 1. Verificar Pods
```bash
kubectl get pods -n ms-frontend-picpay-monitor

# Resultado esperado:
# NAME                        READY   STATUS    RESTARTS   AGE
# postgres-0                  1/1     Running   0          10m
# backend-xxxxx-xxxxx         1/1     Running   0          5m
# frontend-xxxxx-xxxxx        1/1     Running   0          5m
# frontend-xxxxx-yyyyy        1/1     Running   0          5m
```

### 2. Verificar Logs
```bash
# Frontend
kubectl logs -f deployment/frontend -n ms-frontend-picpay-monitor

# Backend
kubectl logs -f deployment/backend -n ms-frontend-picpay-monitor

# PostgreSQL
kubectl logs -f statefulset/postgres -n ms-frontend-picpay-monitor
```

### 3. Verificar Variáveis de Ambiente no Frontend
```bash
kubectl exec -it deployment/frontend -n ms-frontend-picpay-monitor -- env | grep VITE

# Resultado esperado:
# VITE_API_URL=http://backend.ms-frontend-picpay-monitor.svc.cluster.local:3000
```

**⚠️ NÃO DEVE APARECER**:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

### 4. Testar Criação de Conta
```bash
# 1. Acessar o DNS
https://ms-frontend-picpay-monitor.hom-lionx.com.br

# 2. Criar uma conta de teste
Email: teste@exemplo.com
Senha: Teste123!
Nome: Usuario Teste

# 3. Verificar no PostgreSQL que o usuário FOI CRIADO
kubectl exec -it statefulset/postgres -n ms-frontend-picpay-monitor -- \
  psql -U postgres -d aws_resource_db -c \
  "SELECT id, email, name, created_at FROM public.users_profile ORDER BY created_at DESC LIMIT 5;"

# Resultado esperado: O usuário deve aparecer aqui!

# 4. Verificar no Supabase que o usuário NÃO FOI CRIADO
# Acesse: https://supabase.com/dashboard/project/kwbskfecgpvywxjjytai/auth/users
# O usuário NÃO deve aparecer lá!
```

### 5. Verificar Requisições de Rede (Browser DevTools)
```javascript
// Abra DevTools → Network → Criar conta

// ✅ DEVE APARECER:
POST http://backend.ms-frontend-picpay-monitor.svc.cluster.local:3000/auth/signup
Status: 200

// ❌ NÃO DEVE APARECER:
POST https://kwbskfecgpvywxjjytai.supabase.co/auth/v1/signup
```

### 6. Verificar localStorage
```javascript
// No console do browser
localStorage.getItem('auth_token')
// Deve retornar um JWT token (string longa começando com "eyJ...")
```

## 🔧 Troubleshooting

### Problema: Ainda cria usuários no Supabase

**Causa**: Build foi feito sem `--build-arg VITE_API_URL=/api`

**Solução**:
```bash
# 1. Deletar imagem local
docker rmi 289208114389.dkr.ecr.us-east-1.amazonaws.com/picpay-dev/ms-resource-frontend:v1.0.6

# 2. Build CORRETO (com --build-arg e --no-cache)
docker build \
  --build-arg VITE_API_URL=/api \
  --no-cache \
  -t 289208114389.dkr.ecr.us-east-1.amazonaws.com/picpay-dev/ms-resource-frontend:v1.0.6 \
  -f Dockerfile .

# 3. Push
docker push 289208114389.dkr.ecr.us-east-1.amazonaws.com/picpay-dev/ms-resource-frontend:v1.0.6

# 4. Atualizar e forçar restart
kubectl set image deployment/frontend \
  frontend=289208114389.dkr.ecr.us-east-1.amazonaws.com/picpay-dev/ms-resource-frontend:v1.0.6 \
  -n ms-frontend-picpay-monitor

kubectl delete pod -l app=frontend -n ms-frontend-picpay-monitor
```

### Problema: Erro ao criar conta

**Verificar logs do backend**:
```bash
kubectl logs -f deployment/backend -n ms-frontend-picpay-monitor --tail=50
```

**Verificar logs do frontend**:
```bash
kubectl logs -f deployment/frontend -n ms-frontend-picpay-monitor --tail=50
```

### Problema: PostgreSQL não conecta

```bash
# Verificar se PostgreSQL está rodando
kubectl get pods -n ms-frontend-picpay-monitor | grep postgres

# Testar conexão
kubectl exec -it postgres-0 -n ms-frontend-picpay-monitor -- pg_isready

# Testar login
kubectl exec -it postgres-0 -n ms-frontend-picpay-monitor -- \
  psql -U postgres -d aws_resource_db -c "SELECT version();"
```

### Problema: CORS Error

**Verificar ConfigMap**:
```bash
kubectl get configmap frontend-config -n ms-frontend-picpay-monitor -o yaml

# Deve ter:
# data:
#   VITE_API_URL: "http://backend.ms-frontend-picpay-monitor.svc.cluster.local:3000"
```

## 📊 Estrutura de Arquivos do Projeto

```
.
├── backend/
│   ├── src/
│   │   └── index.ts           # Backend Node.js/Express com PostgreSQL
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── k8s/
│   ├── 01-namespace.yaml      # Namespace ms-frontend-picpay-monitor
│   ├── 02-postgres-secret.yaml
│   ├── 03-postgres-pvc.yaml
│   ├── 04-postgres-statefulset.yaml
│   ├── 05-postgres-service.yaml
│   ├── 06-init-db.sql         # Script de inicialização do banco
│   ├── 07-backend-secret.yaml
│   ├── 08-backend-deployment.yaml
│   ├── 09-frontend-configmap.yaml
│   ├── 10-frontend-deployment.yaml
│   └── 11-ingress.yaml        # Kong Ingress
│
├── src/
│   ├── hooks/
│   │   ├── useAuth.tsx        # Hook de autenticação (usa apiClient)
│   │   ├── useClusters.tsx    # Hook de clusters (usa apiClient)
│   │   ├── useResources.tsx   # Hook de resources (usa apiClient)
│   │   ├── useUsers.tsx       # Hook de users (usa apiClient)
│   │   └── useUserClusterPermissions.tsx
│   ├── lib/
│   │   └── apiClient.ts       # Cliente HTTP para backend
│   ├── pages/
│   │   ├── Auth.tsx           # Página de login/signup
│   │   ├── Index.tsx          # Dashboard
│   │   ├── Clusters.tsx
│   │   ├── Reports.tsx
│   │   └── AdminUsers.tsx
│   └── integrations/
│       └── supabase/
│           ├── client.ts      # DEPRECATED - joga erro se usado
│           └── types.ts       # Apenas tipos (mantido para compatibilidade)
│
├── .env                       # APENAS: VITE_API_URL=/api
├── Dockerfile                 # Frontend Nginx
└── nginx.conf
```

## 🎯 Endpoints da API

### Autenticação
- `POST /auth/signup` - Criar conta
- `POST /auth/signin` - Login
- `GET /auth/user` - Obter usuário atual
- `POST /auth/signout` - Logout
- `PATCH /auth/profile` - Atualizar perfil

### Clusters
- `GET /clusters` - Listar clusters
- `POST /clusters` - Criar cluster (admin)
- `PATCH /clusters/:id` - Atualizar cluster (admin)

### Resources
- `GET /resources-created` - Recursos criados
- `GET /resources-unused` - Recursos sem uso

### Dashboard
- `GET /dashboard/stats` - Estatísticas do dashboard
- `GET /dashboard/unused-by-type` - Recursos sem uso por tipo

### Runs
- `GET /runs` - Listagem de execuções

### Admin
- `GET /admin/users` - Listar usuários (admin)
- `PATCH /admin/users/:id` - Atualizar usuário (admin)

### Permissões
- `GET /user-cluster-permissions` - Listar permissões (admin)
- `POST /user-cluster-permissions` - Criar/atualizar permissão (admin)
- `DELETE /user-cluster-permissions/:user_id/:cluster_id` - Remover permissão (admin)

## 🔐 Sistema de Permissões

### Roles (Papéis)
- **admin**: Acesso total ao sistema
- **editor**: Pode visualizar dashboard, clusters e relatórios
- **viewer**: Pode visualizar apenas dashboard

### Permissões por Cluster
Admins podem conceder acesso específico a clusters individuais para usuários viewer/editor através da tabela `user_cluster_permissions`.

## 📝 Checklist de Verificação Final

- [ ] Arquivo `.env` contém APENAS `VITE_API_URL=/api`
- [ ] Build feito com `--build-arg VITE_API_URL=/api --no-cache`
- [ ] Imagem enviada para ECR
- [ ] Deployment atualizado no Kubernetes
- [ ] Pods reiniciados e rodando (2/2 frontend, 1/1 backend, 1/1 postgres)
- [ ] Conta de teste criada via DNS
- [ ] Usuário aparece no PostgreSQL interno
- [ ] Usuário NÃO aparece no Supabase Cloud
- [ ] DevTools mostra requisições para `/api/*` (não para supabase.co)
- [ ] localStorage contém `auth_token` válido

## 🆘 Suporte

Se após seguir todos os passos o sistema ainda estiver conectando ao Supabase:

1. Verificar se o `.env` está limpo (sem variáveis SUPABASE)
2. Deletar a imagem Docker local e fazer novo build
3. Incrementar a tag da imagem (v1.0.7, v1.0.8, etc.)
4. Deletar todos os pods para forçar pull da nova imagem
5. Verificar logs do frontend e backend
6. Inspecionar bundle JavaScript no DevTools > Sources

**Tempo estimado para deploy completo**: 20-30 minutos

**Versão atual**: v1.0.6
**Última atualização**: 2025-10-14

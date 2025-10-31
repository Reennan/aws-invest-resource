# AWS Resource Monitor - Documentação Completa

Sistema completo de monitoramento de recursos AWS rodando internamente no Kubernetes.

## 📋 Índice

1. [Arquitetura](#arquitetura)
2. [Componentes](#componentes)
3. [Deploy](#deploy)
4. [Verificação](#verificação)
5. [Troubleshooting](#troubleshooting)
6. [Administração](#administração)

---

## 🏗️ Arquitetura

### Stack Tecnológica

- **Frontend**: React + Vite + TypeScript + Tailwind CSS
  - Server: Nginx (porta 8080)
  - Build: Docker multi-stage
  
- **Backend**: Node.js + Express + TypeScript
  - API REST com JWT
  - Porta 3000
  
- **Database**: PostgreSQL 16
  - StatefulSet no Kubernetes
  - Porta 5432
  - PVC para persistência
  
- **Ingress**: Nginx Ingress Controller
  - TLS gerenciado por cert-manager
  - Host: ms-invest-portal.hom-lionx.com.br

### Namespaces

```yaml
ms-invest-portal      # Frontend
ms-invest-portal-api  # Backend + PostgreSQL
```

### Fluxo de Comunicação

```
Internet
  ↓
Ingress (nginx)
  ↓
Frontend Service (ClusterIP:80)
  ↓
Frontend Pods (Nginx:8080)
  ↓
[Nginx proxy_pass /api/]
  ↓
Backend Service (ClusterIP:3000)
  ↓
Backend Pods (Node.js:3000)
  ↓
PostgreSQL Service (ClusterIP:5432)
  ↓
PostgreSQL StatefulSet (postgres:16-alpine)
```

---

## 🔧 Componentes

### 1. PostgreSQL Database

**Arquivo**: `k8s/04-postgres-statefulset.yaml`

```yaml
StatefulSet: postgres
Replicas: 1
Image: postgres:16-alpine
Port: 5432
Storage: 10Gi (PVC)
```

**Credentials** (em `k8s/02-postgres-secret.yaml`):
```
Host: postgres.ms-invest-portal-api.svc.cluster.local
Database: aws_resource_db
User: postgres
Password: Primeiroacesso_2022
```

**Schema Inicial**: `k8s/06-init-db.sql`
- Schema `auth`: Tabela `users` para autenticação
- Schema `public`: Tabelas de negócio (`users_profile`, `clusters`, `resources_*`, etc.)
- Views para dashboard
- Usuário admin padrão

### 2. Backend API

**Arquivo**: `k8s/08-backend-deployment.yaml`

```yaml
Deployment: invest-portal-api
Replicas: 2
Image: 289208114389.dkr.ecr.us-east-1.amazonaws.com/picpay-dev/ms-resource-backend:v1.0.X
Port: 3000
```

**Environment** (em `k8s/07-backend-secret.yaml`):
- JWT_SECRET
- DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
- DB_SSL, DB_SSL_REJECT_UNAUTHORIZED

**Endpoints**:
```
POST   /auth/signup       # Criar conta
POST   /auth/signin       # Login
GET    /auth/user         # Usuário atual
POST   /auth/signout      # Logout
PATCH  /auth/profile      # Atualizar perfil

GET    /clusters          # Listar clusters
POST   /clusters          # Criar cluster (admin)
PATCH  /clusters/:id      # Atualizar cluster (admin)

GET    /resources-created # Recursos criados
GET    /resources-unused  # Recursos não utilizados

GET    /dashboard/stats           # Estatísticas dashboard
GET    /dashboard/unused-by-type  # Recursos por tipo

GET    /runs              # Execuções do monitor

GET    /admin/users                   # Listar usuários (admin)
PATCH  /admin/users/:id               # Atualizar usuário (admin)
PATCH  /admin/users/:id/password      # Alterar senha (admin)
DELETE /admin/users/:id               # Deletar usuário (admin)

GET    /user-cluster-permissions      # Permissões (admin)
POST   /user-cluster-permissions      # Criar/atualizar (admin)
DELETE /user-cluster-permissions/:user_id/:cluster_id  # Remover (admin)

GET    /health            # Health check
```

### 3. Frontend

**Arquivo**: `k8s/10-frontend-deployment.yaml`

```yaml
Deployment: ms-invest-portal
Replicas: 2
Image: 289208114389.dkr.ecr.us-east-1.amazonaws.com/picpay-dev/ms-resource-frontend:v1.0.X
Port: 8080 (Nginx)
```

**Environment** (em `k8s/09-frontend-configmap.yaml`):
- VITE_API_URL: URL do backend interno

**Build-time**:
```bash
# .env (somente build-time)
VITE_API_URL=/api
```

**Nginx** (`nginx.conf.template`):
- Serve arquivos estáticos em `/`
- Proxy `/api/` → Backend interno
- Logs limpos (sem health checks)
- Gzip habilitado

### 4. Ingress

**Arquivo**: `k8s/11-ingress.yaml`

```yaml
Host: ms-invest-portal.hom-lionx.com.br
IngressClass: nginx
Path / → Frontend Service
```

> **Nota**: O Nginx do frontend faz proxy interno para o backend. O Ingress só expõe o frontend.

---

## 🚀 Deploy

### Pré-requisitos

1. Cluster Kubernetes funcionando
2. `kubectl` configurado
3. Nginx Ingress Controller instalado
4. AWS ECR configurado
5. DNS apontando para o Ingress

### Passo a Passo Completo

#### 1. Login no ECR

```bash
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  289208114389.dkr.ecr.us-east-1.amazonaws.com
```

#### 2. Build Backend

```bash
cd backend
docker build -t 289208114389.dkr.ecr.us-east-1.amazonaws.com/picpay-dev/ms-resource-backend:v1.0.6 .
docker push 289208114389.dkr.ecr.us-east-1.amazonaws.com/picpay-dev/ms-resource-backend:v1.0.6
```

#### 3. Build Frontend

```bash
# IMPORTANTE: Usar --build-arg e --no-cache!
docker build \
  --build-arg VITE_API_URL=/api \
  --no-cache \
  -t 289208114389.dkr.ecr.us-east-1.amazonaws.com/picpay-dev/ms-resource-frontend:v1.0.6 \
  -f Dockerfile .

docker push 289208114389.dkr.ecr.us-east-1.amazonaws.com/picpay-dev/ms-resource-frontend:v1.0.6
```

#### 4. Aplicar Manifestos Kubernetes

```bash
# 1. Namespaces
kubectl apply -f k8s/01-namespace.yaml

# 2. Secrets
kubectl apply -f k8s/02-postgres-secret.yaml
kubectl apply -f k8s/07-backend-secret.yaml

# 3. PostgreSQL
kubectl apply -f k8s/03-postgres-pvc.yaml
kubectl apply -f k8s/04-postgres-statefulset.yaml
kubectl apply -f k8s/05-postgres-service.yaml

# Aguardar PostgreSQL estar pronto
kubectl wait --for=condition=ready pod/postgres-0 -n ms-invest-portal-api --timeout=120s

# 4. Inicializar Database (uma vez)
kubectl exec -it postgres-0 -n ms-invest-portal-api -- \
  psql -U postgres -d aws_resource_db -f /docker-entrypoint-initdb.d/init-db.sql

# 5. Backend
kubectl apply -f k8s/08-backend-deployment.yaml

# Aguardar Backend estar pronto
kubectl wait --for=condition=available deployment/invest-portal-api -n ms-invest-portal-api --timeout=120s

# 6. Frontend
kubectl apply -f k8s/09-frontend-configmap.yaml
kubectl apply -f k8s/10-frontend-deployment.yaml

# Aguardar Frontend estar pronto
kubectl wait --for=condition=available deployment/ms-invest-portal -n ms-invest-portal --timeout=120s

# 7. Ingress
kubectl apply -f k8s/11-ingress.yaml
```

#### 5. Verificar Deploy

```bash
# Verificar todos os pods
kubectl get pods -n ms-invest-portal
kubectl get pods -n ms-invest-portal-api

# Verificar services
kubectl get svc -n ms-invest-portal
kubectl get svc -n ms-invest-portal-api

# Verificar ingress
kubectl get ingress -n ms-invest-portal
```

---

## ✅ Verificação

### Health Checks

```bash
# Backend
kubectl exec -n ms-invest-portal deploy/ms-invest-portal -- \
  curl -s http://invest-portal-api.ms-invest-portal-api.svc.cluster.local:3000/health

# Database
kubectl exec -it postgres-0 -n ms-invest-portal-api -- \
  psql -U postgres -d aws_resource_db -c "SELECT COUNT(*) FROM public.users_profile;"
```

### Logs

```bash
# Frontend
kubectl logs -f deployment/ms-invest-portal -n ms-invest-portal

# Backend
kubectl logs -f deployment/invest-portal-api -n ms-invest-portal-api

# PostgreSQL
kubectl logs -f statefulset/postgres -n ms-invest-portal-api
```

### Acessar Aplicação

1. Abrir: https://ms-invest-portal.hom-lionx.com.br
2. Criar conta ou usar credenciais admin:
   ```
   Email: admin@awsresource.com
   Senha: AdminPassword123!
   ```

---

## 🔍 Troubleshooting

### Frontend não carrega

**Sintomas**: Página em branco, erro 502

**Verificar**:
```bash
kubectl get pods -n ms-invest-portal
kubectl logs deployment/ms-invest-portal -n ms-invest-portal
kubectl describe pod <pod-name> -n ms-invest-portal
```

**Possíveis causas**:
- Pod não está rodando
- ConfigMap não foi aplicado
- Imagem incorreta

### Erro 404 em /api/*

**Sintomas**: Frontend carrega mas API retorna 404

**Verificar**:
```bash
# Backend está rodando?
kubectl get pods -n ms-invest-portal-api

# Service está correto?
kubectl get svc invest-portal-api -n ms-invest-portal-api

# Testar diretamente do frontend pod
kubectl exec -n ms-invest-portal deploy/ms-invest-portal -- \
  curl -v http://invest-portal-api.ms-invest-portal-api.svc.cluster.local:3000/health
```

**Possíveis causas**:
- Backend não está rodando
- Service com nome errado
- Nginx proxy_pass incorreto

### Erro de autenticação

**Sintomas**: "Email ou senha incorretos" com credenciais corretas

**Verificar**:
```bash
# Logs do backend
kubectl logs deployment/invest-portal-api -n ms-invest-portal-api | grep SIGNIN

# Verificar usuário no banco
kubectl exec -it postgres-0 -n ms-invest-portal-api -- \
  psql -U postgres -d aws_resource_db -c \
  "SELECT id, email FROM auth.users WHERE email = 'admin@awsresource.com';"
```

**Possíveis causas**:
- Usuário não foi criado
- Senha incorreta
- JWT_SECRET incorreto

### PostgreSQL não inicia

**Sintomas**: Pod em CrashLoopBackOff

**Verificar**:
```bash
kubectl logs postgres-0 -n ms-invest-portal-api
kubectl describe pod postgres-0 -n ms-invest-portal-api
```

**Possíveis causas**:
- PVC não foi criado
- Senha incorreta no secret
- Recurso insuficiente

### Problemas de permissão no banco

**Sintomas**: Erro "permission denied for schema auth"

**Solução**:
```bash
kubectl exec -it postgres-0 -n ms-invest-portal-api -- \
  psql -U postgres -d aws_resource_db

# Executar:
GRANT USAGE ON SCHEMA auth TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA auth TO postgres;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA auth TO postgres;
```

---

## 👨‍💼 Administração

### Usuário Admin Padrão

```
Email: admin@awsresource.com
Senha: AdminPassword123!
Role: admin
Permissões: Todas
```

### Criar Novo Usuário Admin

```bash
kubectl exec -it postgres-0 -n ms-invest-portal-api -- \
  psql -U postgres -d aws_resource_db

# SQL:
-- 1. Criar usuário em auth.users
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
VALUES (
  gen_random_uuid(),
  'novo.admin@empresa.com',
  '$2a$10$hashed_password_here',  -- Use bcrypt
  now(),
  '{"name": "Novo Admin"}'::jsonb
);

-- 2. Perfil será criado automaticamente pelo trigger
-- 3. Atualizar role para admin
UPDATE public.users_profile 
SET role = 'admin', 
    can_view_dashboard = true,
    can_view_clusters = true,
    can_view_reports = true,
    can_manage_users = true
WHERE email = 'novo.admin@empresa.com';
```

### Backup do Banco

```bash
# Dump completo
kubectl exec postgres-0 -n ms-invest-portal-api -- \
  pg_dump -U postgres aws_resource_db > backup-$(date +%Y%m%d).sql

# Dump apenas schema
kubectl exec postgres-0 -n ms-invest-portal-api -- \
  pg_dump -U postgres --schema-only aws_resource_db > schema-backup.sql
```

### Restore do Banco

```bash
# Restaurar dump
kubectl exec -i postgres-0 -n ms-invest-portal-api -- \
  psql -U postgres aws_resource_db < backup.sql
```

### Atualizar Backend

```bash
# 1. Build nova imagem
cd backend
docker build -t 289208114389.dkr.ecr.us-east-1.amazonaws.com/picpay-dev/ms-resource-backend:v1.0.7 .
docker push 289208114389.dkr.ecr.us-east-1.amazonaws.com/picpay-dev/ms-resource-backend:v1.0.7

# 2. Atualizar deployment
kubectl set image deployment/invest-portal-api \
  invest-portal-api=289208114389.dkr.ecr.us-east-1.amazonaws.com/picpay-dev/ms-resource-backend:v1.0.7 \
  -n ms-invest-portal-api

# 3. Verificar rollout
kubectl rollout status deployment/invest-portal-api -n ms-invest-portal-api
```

### Atualizar Frontend

```bash
# 1. Build nova imagem
docker build \
  --build-arg VITE_API_URL=/api \
  --no-cache \
  -t 289208114389.dkr.ecr.us-east-1.amazonaws.com/picpay-dev/ms-resource-frontend:v1.0.7 \
  -f Dockerfile .

docker push 289208114389.dkr.ecr.us-east-1.amazonaws.com/picpay-dev/ms-resource-frontend:v1.0.7

# 2. Atualizar deployment
kubectl set image deployment/ms-invest-portal \
  ms-invest-portal=289208114389.dkr.ecr.us-east-1.amazonaws.com/picpay-dev/ms-resource-frontend:v1.0.7 \
  -n ms-invest-portal

# 3. Verificar rollout
kubectl rollout status deployment/ms-invest-portal -n ms-invest-portal
```

### Escalar Aplicação

```bash
# Escalar frontend
kubectl scale deployment ms-invest-portal --replicas=3 -n ms-invest-portal

# Escalar backend
kubectl scale deployment invest-portal-api --replicas=3 -n ms-invest-portal-api
```

### Limpar Dados de Teste

```sql
-- Executar no PostgreSQL
DELETE FROM public.resources_unused;
DELETE FROM public.resources_created;
DELETE FROM public.runs;
-- Não deletar clusters se quiser manter a estrutura
```

### Monitoramento

```bash
# Recursos consumidos
kubectl top pods -n ms-invest-portal
kubectl top pods -n ms-invest-portal-api

# Eventos
kubectl get events -n ms-invest-portal --sort-by='.lastTimestamp'
kubectl get events -n ms-invest-portal-api --sort-by='.lastTimestamp'

# Describe completo
kubectl describe deployment ms-invest-portal -n ms-invest-portal
kubectl describe deployment invest-portal-api -n ms-invest-portal-api
kubectl describe statefulset postgres -n ms-invest-portal-api
```

---

## 🔐 Segurança

### Práticas Implementadas

1. **Autenticação JWT**: Tokens com expiração de 7 dias
2. **Senhas**: Bcrypt com salt rounds = 10
3. **RBAC**: Roles (viewer, editor, admin) com permissões granulares
4. **Secrets**: Credenciais em Kubernetes Secrets (não em código)
5. **TLS**: Certificados gerenciados por cert-manager
6. **Network**: Services ClusterIP (não expostos externamente)

### Recomendações

1. **Trocar senha do PostgreSQL** em produção
2. **Rotacionar JWT_SECRET** periodicamente
3. **Habilitar HTTPS** obrigatório (ssl-redirect: true)
4. **Configurar Network Policies** para isolar namespaces
5. **Ativar audit logs** do Kubernetes
6. **Backup automático** do banco de dados
7. **Monitoramento** com Prometheus/Grafana

---

## 📊 Estrutura do Banco de Dados

### Schema: `auth`

```sql
auth.users
  - id (UUID, PK)
  - email (TEXT, UNIQUE)
  - encrypted_password (TEXT)
  - email_confirmed_at (TIMESTAMP)
  - raw_user_meta_data (JSONB)
```

### Schema: `public`

```sql
public.users_profile
  - id (UUID, PK)
  - auth_user_id (UUID, FK → auth.users.id)
  - name (TEXT)
  - email (TEXT, UNIQUE)
  - phone (TEXT)
  - role (TEXT: viewer/editor/admin)
  - last_login (TIMESTAMP)
  - is_active (BOOLEAN)
  - can_view_dashboard (BOOLEAN)
  - can_view_clusters (BOOLEAN)
  - can_view_reports (BOOLEAN)
  - can_manage_users (BOOLEAN)

public.clusters
  - id (UUID, PK)
  - name (TEXT, UNIQUE)
  - is_active (BOOLEAN)
  - created_at (TIMESTAMP)

public.runs
  - id (UUID, PK)
  - cluster_id (UUID, FK → clusters.id)
  - run_ts (TIMESTAMP)
  - total_resources_created (INTEGER)
  - total_resources_unused (INTEGER)

public.resources_created
  - id (UUID, PK)
  - cluster_id (UUID, FK)
  - run_id (UUID, FK)
  - name, type, account_name, console_link, manage_status
  - raw (JSONB)
  - created_at (TIMESTAMP)

public.resources_unused
  - id (UUID, PK)
  - cluster_id (UUID, FK)
  - run_id (UUID, FK)
  - name, type, resource_id, account_name, console_link, status
  - days_without_use (INTEGER)
  - raw (JSONB)
  - metrics (JSONB)

public.user_cluster_permissions
  - id (UUID, PK)
  - user_id (UUID, FK → users_profile.id)
  - cluster_id (UUID, FK → clusters.id)
  - can_view (BOOLEAN)
  - UNIQUE(user_id, cluster_id)
```

### Views

```sql
v_dashboard_totals        # Totais globais
v_unused_by_type          # Recursos não utilizados por tipo
```

---

## 📝 Variáveis de Ambiente

### Frontend (Build-time)

```bash
VITE_API_URL=/api   # Path relativo para API
```

### Backend (Runtime)

```bash
PORT=3000
JWT_SECRET=<secret-aleatório>
DB_HOST=postgres.ms-invest-portal-api.svc.cluster.local
DB_PORT=5432
DB_NAME=aws_resource_db
DB_USER=postgres
DB_PASSWORD=<senha>
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false
```

---

## 🎯 Próximos Passos

1. ✅ Migração para Kubernetes interno - COMPLETO
2. ✅ Remoção do Supabase Cloud - COMPLETO
3. ✅ Autenticação JWT no backend - COMPLETO
4. ✅ Logs limpos (sem health checks) - COMPLETO
5. ⬜ Implementar refresh token
6. ⬜ Adicionar paginação em todas as listagens
7. ⬜ Implementar filtros avançados
8. ⬜ Dashboard com gráficos em tempo real
9. ⬜ Exportação de relatórios (CSV/PDF)
10. ⬜ Notificações por email
11. ⬜ Integração com Slack/Teams
12. ⬜ Audit log de todas as ações
13. ⬜ Multi-tenancy

---

## 📞 Suporte

Para problemas ou dúvidas:

1. Verificar logs: `kubectl logs`
2. Verificar events: `kubectl get events`
3. Verificar recursos: `kubectl describe`
4. Consultar esta documentação

---

**Última atualização**: 2025-10-31  
**Versão**: 1.0.6  
**Mantenedor**: PicPay DevOps Team

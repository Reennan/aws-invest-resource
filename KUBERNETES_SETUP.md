# AWS Resource Monitor - Configuração Kubernetes

## Visão Geral

Este projeto foi configurado para rodar 100% dentro do Kubernetes, usando PostgreSQL local ao invés do Supabase Cloud.

## Arquitetura

```
┌─────────────────────────────────────────┐
│            Ingress (Kong)               │
│  ms-frontend-picpay-monitor.hom...     │
└─────────────────┬───────────────────────┘
                  │
        ┌─────────┴──────────┐
        │                    │
┌───────▼──────┐    ┌───────▼────────┐
│   Frontend   │    │    Backend     │
│  (Port 8080) │    │   (Port 3000)  │
│   Nginx      │    │   Node.js      │
└──────────────┘    └────────┬────────┘
                             │
                    ┌────────▼─────────┐
                    │    PostgreSQL    │
                    │   (Port 5432)    │
                    │  postgres:16     │
                    └──────────────────┘
```

## Componentes

### 1. PostgreSQL StatefulSet
- **Imagem**: `postgres:16-alpine`
- **Namespace**: `ms-frontend-picpay-monitor`
- **Service**: `postgres.ms-frontend-picpay-monitor.svc.cluster.local`
- **Credenciais**:
  - User: `postgres`
  - Password: `Primeiroacesso_2022`
  - Database: `aws_resource_db`
- **Storage**: PVC de 10Gi

### 2. Backend Deployment
- **Imagem**: ECR privado
- **Réplicas**: 2
- **Porta**: 3000
- **Variáveis de Ambiente**:
  ```yaml
  JWT_SECRET: <secret-256-chars>
  DB_HOST: postgres.ms-frontend-picpay-monitor.svc.cluster.local
  DB_PORT: 5432
  DB_NAME: aws_resource_db
  DB_USER: postgres
  DB_PASSWORD: Primeiroacesso_2022
  ```

### 3. Frontend Deployment
- **Imagem**: ECR privado  
- **Réplicas**: 2
- **Porta**: 8080 (Nginx)
- **ConfigMap**:
  ```yaml
  VITE_API_URL: "/api"
  ```

### 4. Ingress
- **IngressClass**: `kong`
- **Host**: `ms-frontend-picpay-monitor.hom-lionx.com.br`
- **Rotas**:
  - `/` → Frontend (porta 80)
  - `/api` → Backend (porta 3000)
- **TLS**: Certificado gerenciado por cert-manager

## Fluxo de Autenticação

### Criação de Conta (Signup)
1. Usuário preenche: Nome Completo, Email, Senha, Confirmação de Senha
2. Frontend valida os dados com Zod
3. Frontend envia para `POST /api/auth/signup`
4. Backend:
   - Valida dados
   - Hash da senha com bcrypt
   - Insere em `auth.users`
   - Trigger cria perfil em `public.users_profile`
   - Retorna JWT token
5. Frontend salva token e redireciona para dashboard

**Importante**: Não há verificação de email! A conta é criada e já pode ser usada imediatamente.

### Login (Signin)
1. Usuário preenche: Email e Senha
2. Frontend valida com Zod
3. Frontend envia para `POST /api/auth/signin`
4. Backend:
   - Busca usuário em `auth.users`
   - Verifica senha com bcrypt
   - Retorna JWT token + dados do perfil
5. Frontend salva token e redireciona para dashboard

### Verificação de Sessão
- Token JWT armazenado em `localStorage`
- Header `Authorization: Bearer <token>` em todas as requisições
- Backend valida token e retorna dados do usuário

## Tabelas do Banco de Dados

### auth.users
Tabela de autenticação (gerenciada pela aplicação)
```sql
id UUID
email TEXT UNIQUE
encrypted_password TEXT (bcrypt)
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
raw_user_meta_data JSONB
```

### public.users_profile
Perfis de usuários com permissões
```sql
id UUID
auth_user_id UUID → auth.users(id)
name TEXT
email TEXT
phone TEXT
role ENUM('admin', 'editor', 'viewer')
is_active BOOLEAN
can_view_dashboard BOOLEAN
can_view_clusters BOOLEAN
can_view_reports BOOLEAN
can_manage_users BOOLEAN
last_login TIMESTAMPTZ
created_at TIMESTAMPTZ
```

### public.clusters
Clusters AWS disponíveis
```sql
id UUID
name TEXT
is_active BOOLEAN
created_at TIMESTAMPTZ
```

### public.runs
Execuções de coleta de dados
```sql
id UUID
cluster_id UUID → clusters(id)
run_ts TIMESTAMPTZ
region TEXT
resource_created_days INTEGER
resource_unused_days INTEGER
created_count INTEGER
unused_count INTEGER
succeeded BOOLEAN
error JSONB
```

### public.resources_created
Recursos AWS criados recentemente
```sql
id UUID
cluster_id UUID → clusters(id)
run_id UUID → runs(id)
name TEXT
type TEXT
account_name TEXT
created_at TIMESTAMPTZ
console_link TEXT
manage_status TEXT
raw JSONB
```

### public.resources_unused
Recursos AWS sem uso
```sql
id UUID
cluster_id UUID → clusters(id)
run_id UUID → runs(id)
resource_id TEXT
name TEXT
type TEXT
account_name TEXT
route TEXT
method TEXT
status TEXT
console_link TEXT
days_without_use INTEGER
total_requests INTEGER
messages_sent INTEGER
messages_received INTEGER
messages_not_visible INTEGER
empty_receives INTEGER
invocations INTEGER
metrics JSONB
raw JSONB
```

### public.user_cluster_permissions
Permissões de acesso a clusters por usuário
```sql
id UUID
user_id UUID → users_profile(id)
cluster_id UUID → clusters(id)
can_view BOOLEAN
UNIQUE(user_id, cluster_id)
```

## Usuário Admin Padrão

```
Email: admin@awsresource.com
Senha: admin123
Role: admin
```

## Endpoints da API

### Autenticação
- `POST /auth/signup` - Criar conta
- `POST /auth/signin` - Login
- `POST /auth/signout` - Logout
- `GET /auth/user` - Dados do usuário logado
- `PATCH /auth/profile` - Atualizar perfil

### Clusters
- `GET /clusters` - Listar clusters
- `POST /clusters` - Criar cluster (admin)
- `PATCH /clusters/:id` - Atualizar cluster (admin)

### Recursos
- `GET /resources-created` - Recursos criados
- `GET /resources-unused` - Recursos sem uso

### Dashboard
- `GET /dashboard/stats` - Estatísticas gerais
- `GET /dashboard/unused-by-type` - Recursos sem uso por tipo

### Execuções
- `GET /runs` - Histórico de execuções

### Administração
- `GET /admin/users` - Listar usuários (admin)
- `PATCH /admin/users/:id` - Atualizar usuário (admin)

### Permissões
- `GET /user-cluster-permissions` - Listar permissões
- `POST /user-cluster-permissions` - Criar/atualizar permissão
- `DELETE /user-cluster-permissions/:userId/:clusterId` - Remover permissão

## Deploy

### 1. Criar Namespace
```bash
kubectl apply -f k8s/01-namespace.yaml
```

### 2. Subir PostgreSQL
```bash
# Secrets
kubectl apply -f k8s/02-postgres-secret.yaml

# PVC
kubectl apply -f k8s/03-postgres-pvc.yaml

# StatefulSet e Service
kubectl apply -f k8s/04-postgres-statefulset.yaml
kubectl apply -f k8s/05-postgres-service.yaml
```

### 3. Inicializar Banco de Dados
```bash
# Copiar init-db.sql para o pod
kubectl cp k8s/06-init-db.sql ms-frontend-picpay-monitor/postgres-0:/tmp/

# Executar script
kubectl exec -n ms-frontend-picpay-monitor postgres-0 -- psql -U postgres -d aws_resource_db -f /tmp/init-db.sql
```

### 4. Subir Backend
```bash
# Secret
kubectl apply -f k8s/07-backend-secret.yaml

# Deployment e Service
kubectl apply -f k8s/08-backend-deployment.yaml
```

### 5. Subir Frontend
```bash
# ConfigMap
kubectl apply -f k8s/09-frontend-configmap.yaml

# Deployment e Service
kubectl apply -f k8s/10-frontend-deployment.yaml
```

### 6. Configurar Ingress
```bash
kubectl apply -f k8s/11-ingress.yaml
```

## Variáveis de Ambiente

### Frontend (Build time)
- `VITE_API_URL`: URL da API (padrão: `/api`)

### Backend (Runtime)
- `PORT`: Porta do servidor (padrão: 3000)
- `JWT_SECRET`: Secret para geração de tokens
- `DB_HOST`: Host do PostgreSQL
- `DB_PORT`: Porta do PostgreSQL
- `DB_NAME`: Nome do banco de dados
- `DB_USER`: Usuário do banco
- `DB_PASSWORD`: Senha do banco

## Build e Push de Imagens

### Frontend
```bash
# Build
docker build -t ms-resource-frontend:v1.0.1 -f Dockerfile .

# Tag
docker tag ms-resource-frontend:v1.0.1 289208114389.dkr.ecr.us-east-1.amazonaws.com/picpay-dev/ms-resource-frontend:v1.0.1

# Push
docker push 289208114389.dkr.ecr.us-east-1.amazonaws.com/picpay-dev/ms-resource-frontend:v1.0.1
```

### Backend
```bash
# Build
docker build -t ms-frontend-picpay-monitor:v1.0.0 -f backend/Dockerfile .

# Tag
docker tag ms-frontend-picpay-monitor:v1.0.0 289208114389.dkr.ecr.us-east-1.amazonaws.com/picpay-dev/ms-frontend-picpay-monitor:v1.0.0

# Push
docker push 289208114389.dkr.ecr.us-east-1.amazonaws.com/picpay-dev/ms-frontend-picpay-monitor:v1.0.0
```

## Troubleshooting

### Frontend não consegue acessar a API
1. Verifique se `VITE_API_URL` está definido corretamente
2. Confirme que o Ingress está direcionando `/api` para o backend
3. Verifique logs do backend: `kubectl logs -n ms-frontend-picpay-monitor deployment/backend`

### Erro de autenticação
1. Confirme que o JWT_SECRET está igual nos dois deployments
2. Verifique se o token está sendo salvo no localStorage
3. Confirme que o PostgreSQL está acessível pelo backend

### Dados não aparecem
1. Verifique se o usuário foi criado corretamente
2. Confirme as permissões do usuário (`role` em `users_profile`)
3. Para não-admins, verifique `user_cluster_permissions`

### PostgreSQL não inicia
1. Verifique se o PVC foi criado: `kubectl get pvc -n ms-frontend-picpay-monitor`
2. Veja logs: `kubectl logs -n ms-frontend-picpay-monitor statefulset/postgres`
3. Confirme que há espaço suficiente no cluster

## Monitoramento

### Logs
```bash
# Frontend
kubectl logs -n ms-frontend-picpay-monitor deployment/frontend -f

# Backend
kubectl logs -n ms-frontend-picpay-monitor deployment/backend -f

# PostgreSQL
kubectl logs -n ms-frontend-picpay-monitor statefulset/postgres -f
```

### Status dos Pods
```bash
kubectl get pods -n ms-frontend-picpay-monitor
```

### Status dos Services
```bash
kubectl get svc -n ms-frontend-picpay-monitor
```

### Detalhes do Ingress
```bash
kubectl describe ingress -n ms-frontend-picpay-monitor
```

## Segurança

### Boas Práticas
1. **Altere as senhas padrão** em produção
2. **Use Secrets do Kubernetes** para dados sensíveis
3. **Implemente RBAC** no cluster
4. **Configure Network Policies** para isolar os pods
5. **Use HTTPS** sempre (TLS no Ingress)
6. **Monitore logs** em busca de acessos não autorizados
7. **Faça backup** regular do PostgreSQL

### Rotação de Secrets
```bash
# Gerar novo JWT_SECRET
openssl rand -base64 256

# Atualizar secret
kubectl edit secret -n ms-frontend-picpay-monitor backend-secret

# Restart dos pods (força nova leitura do secret)
kubectl rollout restart deployment/backend -n ms-frontend-picpay-monitor
```

## Backup e Restore

### Backup do PostgreSQL
```bash
kubectl exec -n ms-frontend-picpay-monitor postgres-0 -- \
  pg_dump -U postgres aws_resource_db > backup_$(date +%Y%m%d).sql
```

### Restore do PostgreSQL
```bash
kubectl exec -i -n ms-frontend-picpay-monitor postgres-0 -- \
  psql -U postgres aws_resource_db < backup_20250114.sql
```

## Próximos Passos

1. ✅ Autenticação local sem Supabase
2. ✅ Signup sem verificação de email
3. ⏳ Implementar WebSocket para updates em tempo real
4. ⏳ Adicionar rate limiting no backend
5. ⏳ Implementar auditoria de ações
6. ⏳ Adicionar testes automatizados
7. ⏳ Configurar CI/CD com GitOps (ArgoCD)
8. ⏳ Implementar backup automático do PostgreSQL
9. ⏳ Adicionar observabilidade (Prometheus/Grafana)
10. ⏳ Implementar cache com Redis

## Suporte

Para problemas ou dúvidas, verifique:
1. Logs dos pods
2. Eventos do Kubernetes: `kubectl get events -n ms-frontend-picpay-monitor`
3. Status dos recursos: `kubectl get all -n ms-frontend-picpay-monitor`

# 🔍 Guia: Como Verificar Usuários no PostgreSQL

## 1️⃣ Conectar ao Pod do PostgreSQL

```bash
# Listar pods do namespace
kubectl get pods -n ms-frontend-picpay-monitor

# Conectar ao pod do PostgreSQL
kubectl exec -it postgres-0 -n ms-frontend-picpay-monitor -- psql -U postgres -d aws_resource_db
```

## 2️⃣ Consultas SQL para Verificação

### Verificar Usuários Criados na Tabela `auth.users`

```sql
-- Ver todos os usuários
SELECT id, email, created_at, email_confirmed_at 
FROM auth.users 
ORDER BY created_at DESC;

-- Ver usuário específico por email
SELECT id, email, created_at, email_confirmed_at 
FROM auth.users 
WHERE email = 'seu.email@exemplo.com';
```

### Verificar Perfis na Tabela `public.users_profile`

```sql
-- Ver todos os perfis
SELECT 
  id,
  auth_user_id,
  name,
  email,
  role,
  is_active,
  created_at,
  last_login
FROM public.users_profile 
ORDER BY created_at DESC;

-- Ver perfil específico por email
SELECT 
  id,
  auth_user_id,
  name,
  email,
  role,
  is_active,
  created_at,
  last_login
FROM public.users_profile 
WHERE email = 'seu.email@exemplo.com';
```

### Verificar Relação entre Usuário e Perfil

```sql
-- Ver usuário + perfil juntos
SELECT 
  u.id as user_id,
  u.email,
  u.created_at as user_created_at,
  p.id as profile_id,
  p.name,
  p.role,
  p.is_active,
  p.created_at as profile_created_at
FROM auth.users u
LEFT JOIN public.users_profile p ON u.id = p.auth_user_id
ORDER BY u.created_at DESC;
```

## 3️⃣ Verificar Logs do Backend

```bash
# Ver logs do backend em tempo real
kubectl logs -f deployment/backend -n ms-frontend-picpay-monitor

# Ver últimas 100 linhas
kubectl logs deployment/backend -n ms-frontend-picpay-monitor --tail=100
```

## 4️⃣ Troubleshooting: Problema de Loading Infinito

### Cenário: Usuário fica preso na tela de loading após criar conta

**Possíveis causas:**

1. **Backend não retorna dados no formato esperado**
   - O frontend espera: `{ user: {...}, profile: {...}, session: {...} }`
   - Verifique os logs do backend durante o signup/signin

2. **Trigger não criou o perfil**
   - Execute a query acima para verificar se o perfil foi criado
   - Se não foi criado, verifique se o trigger `on_auth_user_created` existe:

```sql
-- Verificar se o trigger existe
SELECT 
  tgname as trigger_name,
  tgtype,
  tgenabled
FROM pg_trigger 
WHERE tgrelid = 'auth.users'::regclass;

-- Verificar se a função do trigger existe
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'handle_new_user';
```

3. **JWT_SECRET não está correto**
   - Verifique o secret do Kubernetes:

```bash
kubectl get secret backend-secret -n ms-frontend-picpay-monitor -o yaml
```

4. **Versão antiga do backend ainda está rodando**
   - Force um novo deploy:

```bash
kubectl rollout restart deployment/backend -n ms-frontend-picpay-monitor
kubectl rollout status deployment/backend -n ms-frontend-picpay-monitor
```

## 5️⃣ Comandos de Deploy Atualizados

### Backend (v1.0.4 com logs detalhados)

```bash
cd backend

# Build
docker build --no-cache \
  -t 289208114389.dkr.ecr.us-east-1.amazonaws.com/picpay-dev/ms-resource-backend:v1.0.4 \
  -f Dockerfile .

# Push
docker push 289208114389.dkr.ecr.us-east-1.amazonaws.com/picpay-dev/ms-resource-backend:v1.0.4

# Update & Restart
kubectl set image deployment/backend \
  backend=289208114389.dkr.ecr.us-east-1.amazonaws.com/picpay-dev/ms-resource-backend:v1.0.4 \
  -n ms-frontend-picpay-monitor

kubectl rollout restart deployment/backend -n ms-frontend-picpay-monitor
kubectl rollout status deployment/backend -n ms-frontend-picpay-monitor
```

### Frontend (v1.0.7 ou superior)

```bash
# Build
docker build \
  --build-arg VITE_API_URL=/api \
  --no-cache \
  -t 289208114389.dkr.ecr.us-east-1.amazonaws.com/picpay-dev/ms-resource-frontend:v1.0.8 \
  -f Dockerfile .

# Push
docker push 289208114389.dkr.ecr.us-east-1.amazonaws.com/picpay-dev/ms-resource-frontend:v1.0.8

# Update & Restart
kubectl set image deployment/frontend \
  frontend=289208114389.dkr.ecr.us-east-1.amazonaws.com/picpay-dev/ms-resource-frontend:v1.0.8 \
  -n ms-frontend-picpay-monitor

kubectl rollout restart deployment/frontend -n ms-frontend-picpay-monitor
kubectl rollout status deployment/frontend -n ms-frontend-picpay-monitor
```

## 6️⃣ Testar a Aplicação

1. **Limpar cache do navegador** ou usar **modo anônimo**
2. Acessar: `https://ms-frontend-picpay-monitor.hom-lionx.com.br`
3. Criar uma nova conta
4. Verificar se o login acontece automaticamente

## 7️⃣ Debug Avançado

### Verificar Network no Browser DevTools

1. Abra DevTools (F12)
2. Vá na aba **Network**
3. Tente fazer signup/signin
4. Verifique as requisições para `/api/auth/signup` ou `/api/auth/signin`
5. Veja a resposta JSON retornada

### Verificar se o Backend está respondendo

```bash
# Port-forward para testar localmente
kubectl port-forward deployment/backend 3000:3000 -n ms-frontend-picpay-monitor

# Em outro terminal, teste a API
curl http://localhost:3000/health
```

## 8️⃣ Sair do psql

```sql
-- Sair do PostgreSQL
\q
```

## 9️⃣ Visualizar Logs Detalhados (v1.0.4+)

A versão v1.0.4 do backend inclui logs extensivos para debug:

```bash
# Ver logs em tempo real com emojis e informações detalhadas
kubectl logs -f deployment/backend -n ms-frontend-picpay-monitor

# Filtrar apenas logs de SIGNUP
kubectl logs deployment/backend -n ms-frontend-picpay-monitor | grep SIGNUP

# Filtrar apenas logs de SIGNIN
kubectl logs deployment/backend -n ms-frontend-picpay-monitor | grep SIGNIN

# Filtrar apenas erros
kubectl logs deployment/backend -n ms-frontend-picpay-monitor | grep "❌"
```

### Logs esperados durante signup:
```
📥 [SIGNUP] Requisição recebida: { email: 'user@example.com', name: 'User Name' }
🔍 [SIGNUP] Verificando se email já existe...
🔐 [SIGNUP] Gerando hash da senha...
👤 [SIGNUP] Criando usuário em auth.users...
✅ [SIGNUP] Usuário criado: <uuid>
🎫 [SIGNUP] Gerando JWT token...
👔 [SIGNUP] Buscando perfil criado pelo trigger...
✅ [SIGNUP] Perfil encontrado: <uuid>
📤 [SIGNUP] Enviando resposta com sucesso
```

### Logs esperados durante signin:
```
📥 [SIGNIN] Requisição recebida: { email: 'user@example.com' }
🔍 [SIGNIN] Buscando usuário...
✅ [SIGNIN] Usuário encontrado: <uuid>
🔐 [SIGNIN] Verificando senha...
✅ [SIGNIN] Senha válida
📅 [SIGNIN] Atualizando último login...
🎫 [SIGNIN] Gerando JWT token...
👔 [SIGNIN] Buscando perfil...
✅ [SIGNIN] Perfil encontrado: <uuid>
📤 [SIGNIN] Enviando resposta com sucesso
```

## 📋 Checklist Rápido

- [ ] Backend v1.0.4 ou superior está rodando
- [ ] Frontend v1.0.8 ou superior está rodando
- [ ] JWT_SECRET está configurado no backend-secret
- [ ] Usuário foi criado em `auth.users`
- [ ] Perfil foi criado em `public.users_profile`
- [ ] Trigger `on_auth_user_created` existe e está ativo
- [ ] Backend retorna JSON no formato `{ user, profile, session }`
- [ ] Logs do backend mostram todos os passos (📥 → ✅ → 📤)
- [ ] Sem erros ❌ nos logs
- [ ] Testei em modo anônimo do navegador

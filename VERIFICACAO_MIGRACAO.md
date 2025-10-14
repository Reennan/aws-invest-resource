# ✅ Checklist de Verificação da Migração

## 1. Verificar Arquivo .env

Abra o arquivo `.env` na raiz do projeto e confirme:

```bash
# ✅ CORRETO - Deve conter APENAS isto:
VITE_API_URL=/api

# ❌ ERRADO - NÃO deve conter estas linhas:
# VITE_SUPABASE_PROJECT_ID="..."
# VITE_SUPABASE_PUBLISHABLE_KEY="..."
# VITE_SUPABASE_URL="..."
```

**Se ainda tiver variáveis VITE_SUPABASE_*, DELETE-AS!**

## 2. Verificar Que Supabase Está Desabilitado

Execute no terminal:

```bash
# Deve lançar erro se tentar usar Supabase
grep -r "from '@/integrations/supabase/client'" src/
```

**Resultado esperado:** Nenhum arquivo deve importar o cliente Supabase.

## 3. Rebuild do Frontend

**CRÍTICO:** Após alterar o `.env`, você DEVE recompilar a imagem Docker:

```bash
# 1. Limpar build anterior
rm -rf dist/

# 2. Build nova imagem com .env atualizado
docker build -t 289208114389.dkr.ecr.us-east-1.amazonaws.com/picpay-dev/ms-resource-frontend:v1.0.4 \
  --build-arg VITE_API_URL=/api \
  -f Dockerfile .

# 3. Push para ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 289208114389.dkr.ecr.us-east-1.amazonaws.com
docker push 289208114389.dkr.ecr.us-east-1.amazonaws.com/picpay-dev/ms-resource-frontend:v1.0.4

# 4. Atualizar deployment no Kubernetes
kubectl set image deployment/frontend \
  frontend=289208114389.dkr.ecr.us-east-1.amazonaws.com/picpay-dev/ms-resource-frontend:v1.0.4 \
  -n ms-frontend-picpay-monitor

# 5. Forçar restart dos pods
kubectl rollout restart deployment/frontend -n ms-frontend-picpay-monitor

# 6. Verificar rollout
kubectl rollout status deployment/frontend -n ms-frontend-picpay-monitor
```

## 4. Testar Criação de Conta

1. Acesse: `https://ms-frontend-picpay-monitor.hom-lionx.com.br`
2. Clique em "Criar Conta"
3. Preencha:
   - Nome: Teste Migração
   - Email: teste.migracao@example.com
   - Senha: senha123456
   - Confirmar Senha: senha123456
4. Clique em "Criar Conta"

## 5. Verificar no PostgreSQL

Conecte ao PostgreSQL no Kubernetes:

```bash
kubectl exec -it postgres-0 -n ms-frontend-picpay-monitor -- psql -U postgres -d aws_resource_db
```

Execute:

```sql
-- Verificar usuário no schema auth
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'teste.migracao@example.com';

-- Verificar perfil no schema public
SELECT id, name, email, role, is_active 
FROM users_profile 
WHERE email = 'teste.migracao@example.com';

-- Sair
\q
```

**Resultado esperado:**
- ✅ Ambas as queries devem retornar 1 linha
- ✅ O usuário deve ter `is_active = t` (true)
- ✅ O role deve ser `viewer` por padrão

## 6. Verificar Logs

```bash
# Frontend logs
kubectl logs -l app=frontend -n ms-frontend-picpay-monitor --tail=100

# Backend logs
kubectl logs -l app=backend -n ms-frontend-picpay-monitor --tail=100

# PostgreSQL logs
kubectl logs postgres-0 -n ms-frontend-picpay-monitor --tail=50
```

**Procure por:**
- ✅ `POST /api/auth/signup 201` (criação com sucesso)
- ❌ Erros de conexão ao Supabase
- ❌ `VITE_SUPABASE_URL is not defined`

## 7. Verificar Network no Browser

1. Abra DevTools (F12)
2. Vá para aba "Network"
3. Crie uma conta
4. Verifique as requisições:

**Esperado:**
- ✅ `POST https://ms-frontend-picpay-monitor.hom-lionx.com.br/api/auth/signup`
- ✅ Status: 200 ou 201

**NÃO esperado:**
- ❌ Requisições para `https://kwbskfecgpvywxjjytai.supabase.co`
- ❌ Erros 401, 403 ou 500

## 8. Verificar localStorage

No browser DevTools:
1. Console tab
2. Digite: `localStorage.getItem('auth_token')`

**Esperado:**
- ✅ Deve retornar um JWT token (string longa começando com "eyJ...")

## 🔥 Troubleshooting

### Problema: Ainda cria usuário no Supabase

**Solução:**
1. Verifique se `.env` está correto (sem VITE_SUPABASE_*)
2. Delete a pasta `dist/` 
3. Rebuild a imagem Docker com nova tag (v1.0.4, v1.0.5, etc)
4. Force restart: `kubectl delete pod -l app=frontend -n ms-frontend-picpay-monitor`

### Problema: Erro "VITE_SUPABASE_URL is not defined"

**Solução:**
1. O `.env` ainda tem variáveis Supabase OU
2. A imagem Docker foi buildada com o `.env` antigo
3. Siga os passos da seção "3. Rebuild do Frontend"

### Problema: Usuário criado não aparece no PostgreSQL

**Solução:**
1. Verifique logs do backend: `kubectl logs -l app=backend -n ms-frontend-picpay-monitor`
2. Verifique conexão do backend com PostgreSQL
3. Verifique se as secrets do backend estão corretas

### Problema: Erro 500 ao criar conta

**Solução:**
1. Verifique logs do backend
2. Confirme que o PostgreSQL está rodando: `kubectl get pods -n ms-frontend-picpay-monitor`
3. Teste conexão: `kubectl exec -it postgres-0 -n ms-frontend-picpay-monitor -- pg_isready`

## ✅ Migração Bem-Sucedida Quando:

- [ ] `.env` não tem variáveis VITE_SUPABASE_*
- [ ] Nenhuma requisição vai para supabase.co
- [ ] Usuários são criados em `auth.users` e `users_profile` do PostgreSQL
- [ ] Token JWT é salvo no localStorage
- [ ] Login funciona corretamente
- [ ] Dashboard carrega dados do PostgreSQL

## 📊 Fluxo Correto de Autenticação

```
1. Usuário preenche formulário de cadastro
   ↓
2. Frontend chama: POST /api/auth/signup
   ↓
3. Ingress roteia para backend service
   ↓
4. Backend insere em auth.users (PostgreSQL)
   ↓
5. Trigger cria registro em users_profile
   ↓
6. Backend retorna JWT token
   ↓
7. Frontend salva token no localStorage
   ↓
8. Frontend redireciona para dashboard
   ↓
9. Dashboard usa token para fazer requests autenticados
```

## 🎯 Comandos Rápidos de Verificação

```bash
# Ver pods
kubectl get pods -n ms-frontend-picpay-monitor

# Ver logs em tempo real
kubectl logs -f deployment/frontend -n ms-frontend-picpay-monitor

# Testar backend health
kubectl exec -it deployment/frontend -n ms-frontend-picpay-monitor -- curl http://backend:3000/health

# Contar usuários no PostgreSQL
kubectl exec -it postgres-0 -n ms-frontend-picpay-monitor -- \
  psql -U postgres -d aws_resource_db -c "SELECT COUNT(*) FROM auth.users;"
```

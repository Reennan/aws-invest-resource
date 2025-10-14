# 🔍 Diagnóstico: Por Que Ainda Conecta ao Supabase?

## 📊 Análise do Log do Supabase

```json
{
  "path": "/user",
  "referer": "http://localhost:3000",
  "remote_addr": "45.172.70.83",
  "status": "200",
  "method": "GET"
}
```

### 🎯 Causa Raiz Identificada

O log mostra `"referer": "http://localhost:3000"` - isso significa que:

1. **Você está testando LOCALMENTE** (não no cluster Kubernetes)
2. O ambiente local ainda tem variáveis do Supabase compiladas no bundle

## ✅ Solução Definitiva

### Passo 1: Verificar Onde Você Está Testando

**❌ SE VOCÊ ESTÁ EM**: `http://localhost:3000` ou `http://localhost:5173`
- Isso é desenvolvimento local
- O bundle ainda pode ter código do Supabase compilado

**✅ VOCÊ DEVE TESTAR EM**: `https://ms-frontend-picpay-monitor.hom-lionx.com.br`
- Este é o DNS do Kubernetes
- Este usa a imagem Docker que você fez push

### Passo 2: Limpar Cache Local (Se Testando Localmente)

```bash
# Deletar node_modules e dist
rm -rf node_modules dist

# Limpar cache do npm
npm cache clean --force

# Reinstalar dependências
npm install

# Rebuild local
npm run dev
```

### Passo 3: Build e Deploy CORRETO no Kubernetes

```bash
# 1. Deletar imagem local antiga
docker rmi 289208114389.dkr.ecr.us-east-1.amazonaws.com/picpay-dev/ms-resource-frontend:v1.0.6

# 2. Build com --no-cache (CRÍTICO!)
docker build \
  --build-arg VITE_API_URL=/api \
  --no-cache \
  -t 289208114389.dkr.ecr.us-east-1.amazonaws.com/picpay-dev/ms-resource-frontend:v1.0.7 \
  -f Dockerfile .

# 3. Push
docker push 289208114389.dkr.ecr.us-east-1.amazonaws.com/picpay-dev/ms-resource-frontend:v1.0.7

# 4. Atualizar Kubernetes
kubectl apply -f k8s/07-backend-secret.yaml  # JWT_SECRET atualizado!

kubectl set image deployment/frontend \
  frontend=289208114389.dkr.ecr.us-east-1.amazonaws.com/picpay-dev/ms-resource-frontend:v1.0.7 \
  -n ms-frontend-picpay-monitor

kubectl rollout restart deployment/frontend -n ms-frontend-picpay-monitor
kubectl rollout restart deployment/backend -n ms-frontend-picpay-monitor

# 5. Aguardar
kubectl rollout status deployment/frontend -n ms-frontend-picpay-monitor
kubectl rollout status deployment/backend -n ms-frontend-picpay-monitor
```

### Passo 4: Testar NO DNS CORRETO

```bash
# 1. Abrir o navegador em MODO ANÔNIMO (para limpar cache do browser)
# URL: https://ms-frontend-picpay-monitor.hom-lionx.com.br

# 2. Abrir DevTools > Application > Storage
# Limpar tudo: localStorage, sessionStorage, cookies

# 3. Abrir DevTools > Network
# 4. Criar uma conta de teste
# 5. Verificar que as requisições vão para:
#    - POST https://ms-frontend-picpay-monitor.hom-lionx.com.br/api/auth/signup
#    - NÃO para supabase.co!
```

## 🔎 Como Verificar Que Funcionou

### 1. Verificar No Browser (DevTools)

**Abrir DevTools → Network → Criar conta**

✅ **DEVE APARECER**:
```
POST https://ms-frontend-picpay-monitor.hom-lionx.com.br/api/auth/signup
Status: 200
```

❌ **NÃO DEVE APARECER**:
```
POST https://kwbskfecgpvywxjjytai.supabase.co/auth/v1/signup
```

### 2. Verificar No PostgreSQL Interno

```bash
kubectl exec -it postgres-0 -n ms-frontend-picpay-monitor -- \
  psql -U postgres -d aws_resource_db -c \
  "SELECT email, name, created_at FROM public.users_profile ORDER BY created_at DESC LIMIT 5;"
```

**Resultado esperado**: O novo usuário deve aparecer aqui!

### 3. Verificar No Supabase Cloud

Acesse: https://supabase.com/dashboard/project/kwbskfecgpvywxjjytai/auth/users

**Resultado esperado**: O novo usuário **NÃO** deve aparecer aqui!

### 4. Verificar Logs do Backend

```bash
kubectl logs -f deployment/backend -n ms-frontend-picpay-monitor
```

**Resultado esperado**: Ver logs de signup/signin sendo processados

## 📋 Checklist Final

- [ ] Arquivo `.env` tem APENAS `VITE_API_URL=/api`
- [ ] Deletou imagem Docker local
- [ ] Build feito com `--build-arg VITE_API_URL=/api --no-cache`
- [ ] Tag incrementada (v1.0.7)
- [ ] Push para ECR concluído
- [ ] Secret do backend atualizado (`kubectl apply -f k8s/07-backend-secret.yaml`)
- [ ] Deployment frontend atualizado
- [ ] Deployment backend reiniciado
- [ ] Pods rodando (kubectl get pods)
- [ ] Testado no DNS do Kubernetes (NÃO em localhost!)
- [ ] DevTools mostra requisições para o DNS correto
- [ ] Usuário criado no PostgreSQL interno
- [ ] Usuário NÃO criado no Supabase

## 🚨 Erro Comum: Testar em localhost

**NUNCA teste em**:
- `http://localhost:3000`
- `http://localhost:5173`
- `http://127.0.0.1:*`

**SEMPRE teste em**:
- `https://ms-frontend-picpay-monitor.hom-lionx.com.br`

## 🎯 Resumo

O problema NÃO é o código - o backend está 100% correto usando PostgreSQL.

O problema é que você estava testando em `localhost:3000`, onde o bundle antigo ainda tinha variáveis do Supabase compiladas.

**Solução**:
1. Rebuild da imagem Docker com `--no-cache`
2. Push para ECR
3. Deploy no Kubernetes
4. Testar no **DNS correto** (não em localhost!)

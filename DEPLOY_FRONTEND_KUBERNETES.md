# Deploy do Frontend no Kubernetes - GUIA DEFINITIVO

## ⚠️ CRÍTICO: O Problema Que Você Estava Enfrentando

Você estava buildando a imagem Docker SEM passar o build argument correto, fazendo com que as variáveis do Supabase do arquivo `.env` fossem compiladas no bundle JavaScript do Vite.

## ✅ SOLUÇÃO: Comando Correto de Build

### 1. Build da Imagem Docker (COMANDO CORRETO)

```bash
docker build \
  --build-arg VITE_API_URL=/api \
  --no-cache \
  -t 289208114389.dkr.ecr.us-east-1.amazonaws.com/picpay-dev/ms-resource-frontend:v1.0.5 \
  -f Dockerfile .
```

**IMPORTANTE:** 
- O `--build-arg VITE_API_URL=/api` é OBRIGATÓRIO
- O `--no-cache` garante que não use cache antigo com as variáveis do Supabase
- A tag deve ser incrementada (v1.0.5, v1.0.6, etc.)

### 2. Push da Imagem

```bash
docker push 289208114389.dkr.ecr.us-east-1.amazonaws.com/picpay-dev/ms-resource-frontend:v1.0.5
```

### 3. Atualizar o Deployment no Kubernetes

```bash
kubectl set image deployment/frontend \
  frontend=289208114389.dkr.ecr.us-east-1.amazonaws.com/picpay-dev/ms-resource-frontend:v1.0.5 \
  -n ms-frontend-picpay-monitor
```

### 4. Forçar Restart dos Pods

```bash
kubectl rollout restart deployment/frontend -n ms-frontend-picpay-monitor
```

### 5. Verificar o Rollout

```bash
kubectl rollout status deployment/frontend -n ms-frontend-picpay-monitor
```

## 📋 Checklist de Verificação

### Antes do Build:
- [ ] Arquivo `.env` contém APENAS `VITE_API_URL=/api`
- [ ] Não há mais variáveis `VITE_SUPABASE_*` no `.env`
- [ ] Código foi commitado no Git

### Durante o Build:
- [ ] Comando `docker build` inclui `--build-arg VITE_API_URL=/api`
- [ ] Comando inclui `--no-cache` para evitar cache antigo
- [ ] Tag da imagem foi incrementada (ex: v1.0.5)

### Após o Deploy:
- [ ] Pods foram reiniciados com sucesso
- [ ] Criar novo usuário NO frontend
- [ ] Verificar que o usuário FOI CRIADO no PostgreSQL do cluster
- [ ] Verificar que o usuário NÃO FOI CRIADO no Supabase

## 🔍 Como Verificar Se Funcionou

### 1. Verificar Logs do Frontend

```bash
kubectl logs -f deployment/frontend -n ms-frontend-picpay-monitor
```

### 2. Verificar Variáveis de Ambiente no Pod

```bash
kubectl exec -it deployment/frontend -n ms-frontend-picpay-monitor -- env | grep VITE
```

**Resultado esperado:**
```
VITE_API_URL=/api
```

**NÃO DEVE APARECER:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

### 3. Verificar Bundle JavaScript

Acesse o frontend e abra DevTools > Sources > Procure por "supabase" nos arquivos JS.

**Resultado esperado:** NÃO deve encontrar URLs ou chaves do Supabase hardcoded.

### 4. Verificar Requisições de Rede

Ao criar um usuário, abra DevTools > Network:

**Deve aparecer:**
```
POST http://backend.ms-frontend-picpay-monitor.svc.cluster.local:3000/auth/signup
```

**NÃO DEVE aparecer:**
```
POST https://kwbskfecgpvywxjjytai.supabase.co/auth/v1/signup
```

### 5. Verificar no Banco PostgreSQL do Cluster

```bash
kubectl exec -it statefulset/postgres -n ms-frontend-picpay-monitor -- \
  psql -U postgres -d aws_resource_db -c "SELECT email, name, created_at FROM users_profile ORDER BY created_at DESC LIMIT 5;"
```

**Resultado esperado:** O novo usuário deve aparecer aqui.

### 6. Verificar no Supabase (NÃO DEVE TER)

Acesse o dashboard do Supabase > Authentication > Users

**Resultado esperado:** O novo usuário NÃO deve aparecer aqui.

## 🚨 Troubleshooting

### Problema: Ainda está criando usuários no Supabase

**Causa:** Build foi feito sem `--build-arg VITE_API_URL=/api`

**Solução:**
1. Deletar a imagem local:
   ```bash
   docker rmi 289208114389.dkr.ecr.us-east-1.amazonaws.com/picpay-dev/ms-resource-frontend:v1.0.5
   ```

2. Rebuild com o comando COMPLETO:
   ```bash
   docker build --build-arg VITE_API_URL=/api --no-cache -t 289208114389.dkr.ecr.us-east-1.amazonaws.com/picpay-dev/ms-resource-frontend:v1.0.5 -f Dockerfile .
   ```

3. Push novamente
4. Forçar restart dos pods

### Problema: Erro "Cannot read properties of null"

**Causa:** Frontend tentando usar client do Supabase que foi desabilitado

**Solução:** Verifique se ainda há imports de `@/integrations/supabase/client` no código (exceto em `types.ts` que é apenas tipos).

### Problema: CORS Error

**Causa:** ConfigMap não está configurado corretamente

**Solução:** Verificar que o ConfigMap tenha:
```yaml
data:
  VITE_API_URL: "http://backend.ms-frontend-picpay-monitor.svc.cluster.local:3000"
```

## 📦 Arquivo .env Correto

Seu arquivo `.env` DEVE ter APENAS isto:

```env
# API Backend URL - aponta para o backend PostgreSQL no Kubernetes
# Esta é a ÚNICA variável necessária para o frontend
VITE_API_URL=/api
```

## 🎯 Resumo do Fluxo Correto

```
Frontend (React/Vite)
    ↓ fetch("/api/auth/signup")
Ingress do Kubernetes
    ↓ redireciona para
Backend (Node.js/Express)
    ↓ conecta via pg
PostgreSQL no Cluster
```

**NÃO HÁ MAIS:** Frontend → Supabase Cloud

## ✅ Comando Final Completo

```bash
# 1. Build
docker build --build-arg VITE_API_URL=/api --no-cache -t 289208114389.dkr.ecr.us-east-1.amazonaws.com/picpay-dev/ms-resource-frontend:v1.0.5 -f Dockerfile .

# 2. Push
docker push 289208114389.dkr.ecr.us-east-1.amazonaws.com/picpay-dev/ms-resource-frontend:v1.0.5

# 3. Update deployment
kubectl set image deployment/frontend frontend=289208114389.dkr.ecr.us-east-1.amazonaws.com/picpay-dev/ms-resource-frontend:v1.0.5 -n ms-frontend-picpay-monitor

# 4. Restart
kubectl rollout restart deployment/frontend -n ms-frontend-picpay-monitor

# 5. Verificar
kubectl rollout status deployment/frontend -n ms-frontend-picpay-monitor
```

## 🎉 Pronto!

Agora o frontend está 100% desconectado do Supabase e usando apenas o PostgreSQL no cluster Kubernetes.

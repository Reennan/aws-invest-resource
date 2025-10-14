# 🚨 SOLUÇÃO: Comando de Build CORRETO

## ⚠️ PROBLEMA IDENTIFICADO

Você estava fazendo o build **SEM** o argumento `--build-arg VITE_API_URL=/api`, fazendo com que as variáveis do Supabase fossem compiladas no bundle JavaScript do Vite.

## ✅ COMANDO CORRETO

### 1️⃣ Build com --no-cache (CRÍTICO!)

```bash
# Login no ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  289208114389.dkr.ecr.us-east-1.amazonaws.com

# Build CORRETO com --build-arg e --no-cache
docker build \
  --build-arg VITE_API_URL=/api \
  --no-cache \
  -t 289208114389.dkr.ecr.us-east-1.amazonaws.com/picpay-dev/ms-resource-frontend:v1.0.5 \
  -f Dockerfile .

# Push para ECR
docker push 289208114389.dkr.ecr.us-east-1.amazonaws.com/picpay-dev/ms-resource-frontend:v1.0.5
```

**POR QUE ESTAVA DANDO ERRO:**
- Você rodou: `docker build -t ... .` ❌
- Deveria rodar: `docker build --build-arg VITE_API_URL=/api --no-cache -t ... .` ✅

### 2️⃣ Atualizar Kubernetes

```bash
# Atualizar imagem do deployment (use v1.0.5!)
kubectl set image deployment/frontend \
  frontend=289208114389.dkr.ecr.us-east-1.amazonaws.com/picpay-dev/ms-resource-frontend:v1.0.5 \
  -n ms-frontend-picpay-monitor

# Forçar restart dos pods
kubectl rollout restart deployment/frontend -n ms-frontend-picpay-monitor

# Aguardar rollout completo
kubectl rollout status deployment/frontend -n ms-frontend-picpay-monitor
```

### 3️⃣ Testar

1. Acesse o DNS do frontend
2. Crie uma conta de teste
3. Verifique no PostgreSQL:

```bash
kubectl exec -it statefulset/postgres -n ms-frontend-picpay-monitor -- \
  psql -U postgres -d aws_resource_db -c \
  "SELECT email, name, created_at FROM users_profile ORDER BY created_at DESC LIMIT 5;"
```

**Resultado esperado:** Você deve ver o email da conta que acabou de criar!

**Verificar que NÃO está no Supabase:**
- Acesse: https://supabase.com/dashboard/project/kwbskfecgpvywxjjytai/auth/users
- O novo usuário NÃO deve aparecer lá!

---

## ✅ Checklist Final

- [ ] Arquivo `.env` contém APENAS `VITE_API_URL=/api`
- [ ] Nova imagem Docker buildada com tag v1.0.4 ou superior
- [ ] Imagem enviada para ECR
- [ ] Deployment atualizado no Kubernetes
- [ ] Pods reiniciados (veja com `kubectl get pods -n ms-frontend-picpay-monitor`)
- [ ] Conta de teste criada via DNS
- [ ] Usuário aparece no PostgreSQL (não no Supabase!)

---

## 🔥 Troubleshooting

### "Ainda cria no Supabase!"

**Motivo:** Você não buildou uma NOVA imagem ou não atualizou a tag no Kubernetes.

**Solução:**
```bash
# Use uma tag DIFERENTE cada vez
docker build -t ...:v1.0.5 ...
docker push ...:v1.0.5
kubectl set image deployment/frontend frontend=...:v1.0.5 -n ms-frontend-picpay-monitor
kubectl delete pod -l app=frontend -n ms-frontend-picpay-monitor
```

### "Erro ao criar conta"

**Verificar logs:**
```bash
# Backend
kubectl logs -l app=backend -n ms-frontend-picpay-monitor --tail=50

# Frontend  
kubectl logs -l app=frontend -n ms-frontend-picpay-monitor --tail=50
```

### "PostgreSQL não conecta"

```bash
# Verificar se PostgreSQL está rodando
kubectl get pods -n ms-frontend-picpay-monitor | grep postgres

# Testar conexão
kubectl exec -it postgres-0 -n ms-frontend-picpay-monitor -- pg_isready
```

---

## 📊 Como Saber Se Funcionou?

### No Browser (DevTools → Network):
✅ Requisições vão para: `/api/auth/signup`  
❌ NÃO devem ir para: `supabase.co`

### No localStorage:
```javascript
// No console do browser
localStorage.getItem('auth_token')
// Deve retornar um JWT token
```

### No PostgreSQL:
```sql
-- Deve ter usuários
SELECT COUNT(*) FROM auth.users;

-- Deve ter perfis
SELECT COUNT(*) FROM users_profile;
```

---

## 🎯 Resumo da Arquitetura

```
Browser
   ↓
https://ms-frontend-picpay-monitor.hom-lionx.com.br
   ↓
Ingress Kong (/)
   ↓
Frontend Service (porta 80)
   ↓
Frontend Pods (nginx:8080)
```

```
Browser → /api/*
   ↓
Ingress Kong (/api → strip /api)
   ↓  
Backend Service (porta 3000)
   ↓
Backend Pods (Node.js Express)
   ↓
PostgreSQL Service
   ↓
PostgreSQL Pod (porta 5432)
   ↓
Database: aws_resource_db
   ├─ Schema: auth (users)
   └─ Schema: public (users_profile, clusters, resources...)
```

---

## 📚 Documentação Completa

- `GUIA_COMPLETO_MIGRACAO.md` - Guia detalhado
- `VERIFICACAO_MIGRACAO.md` - Checklist de verificação
- `MIGRATE_TO_POSTGRES.md` - Detalhes técnicos
- `DEPLOY_FRONTEND_KUBERNETES.md` - Deploy no K8s

---

## 🆘 Precisa de Ajuda?

1. Verifique os logs (kubectl logs)
2. Confirme que `.env` está correto
3. Confirme que buildou NOVA imagem
4. Confirme que pods foram reiniciados
5. Verifique network no browser (DevTools)

**Tempo total estimado:** 15 minutos

# 🚀 Passo a Passo Rápido - Migração PostgreSQL

## ⚡ O Que Você Precisa Fazer AGORA

### 1️⃣ Atualizar o .env (2 minutos)

```bash
# Edite o arquivo .env na raiz do projeto
nano .env

# DELETE tudo e deixe APENAS isto:
VITE_API_URL=/api
```

### 2️⃣ Commit as Mudanças (1 minuto)

```bash
git add .
git commit -m "fix: Remove Supabase, usa PostgreSQL Kubernetes"
git push origin main
```

### 3️⃣ Build Nova Imagem Docker (5 minutos)

```bash
# Limpar build anterior
rm -rf dist/

# Login no ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  289208114389.dkr.ecr.us-east-1.amazonaws.com

# Build com NOVA TAG (importante: v1.0.4 ou superior)
docker build \
  -t 289208114389.dkr.ecr.us-east-1.amazonaws.com/picpay-dev/ms-resource-frontend:v1.0.4 \
  --build-arg VITE_API_URL=/api \
  -f Dockerfile .

# Push para ECR
docker push 289208114389.dkr.ecr.us-east-1.amazonaws.com/picpay-dev/ms-resource-frontend:v1.0.4
```

### 4️⃣ Atualizar Kubernetes (2 minutos)

```bash
# Atualizar imagem do deployment
kubectl set image deployment/frontend \
  frontend=289208114389.dkr.ecr.us-east-1.amazonaws.com/picpay-dev/ms-resource-frontend:v1.0.4 \
  -n ms-frontend-picpay-monitor

# Forçar restart dos pods
kubectl rollout restart deployment/frontend -n ms-frontend-picpay-monitor

# Aguardar rollout completo
kubectl rollout status deployment/frontend -n ms-frontend-picpay-monitor
```

### 5️⃣ Testar (3 minutos)

1. Acesse: `https://ms-frontend-picpay-monitor.hom-lionx.com.br`
2. Crie uma conta de teste
3. Verifique no PostgreSQL:

```bash
kubectl exec -it postgres-0 -n ms-frontend-picpay-monitor -- \
  psql -U postgres -d aws_resource_db -c \
  "SELECT email, created_at FROM auth.users ORDER BY created_at DESC LIMIT 5;"
```

**Resultado esperado:** Você deve ver o email da conta que acabou de criar!

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

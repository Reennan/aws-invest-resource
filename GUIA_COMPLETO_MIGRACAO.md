# Guia Completo de Migração - Supabase para PostgreSQL Kubernetes

## 📋 Pré-requisitos

- [ ] Acesso ao repositório GitHub
- [ ] Docker instalado
- [ ] AWS CLI configurado com acesso ao ECR
- [ ] kubectl configurado com acesso ao cluster Kubernetes
- [ ] Namespace `ms-frontend-picpay-monitor` criado no Kubernetes

---

## 🔄 PASSO 1: Atualizar o Código no GitHub

### 1.1 - Clone ou Pull do Repositório

```bash
# Se ainda não clonou
git clone <seu-repositorio-github>
cd <nome-do-repositorio>

# OU se já tem o repositório
cd <nome-do-repositorio>
git pull origin main
```

### 1.2 - Copie os Arquivos Atualizados

Os seguintes arquivos foram modificados e precisam ser atualizados no seu repositório:

**Hooks:**
- `src/hooks/useUserClusterPermissions.tsx`

**Componentes:**
- `src/components/ClusterFilters.tsx`
- `src/components/DashboardStats.tsx`
- `src/components/DashboardCharts.tsx`
- `src/components/LatestExecutions.tsx`
- `src/components/FilteredResourcesList.tsx`

**Páginas:**
- `src/pages/Account.tsx`

**Documentação:**
- `MIGRATE_TO_POSTGRES.md` (novo)
- `DEPLOY_FRONTEND_KUBERNETES.md` (novo)
- `GUIA_COMPLETO_MIGRACAO.md` (este arquivo - novo)

### 1.3 - Commit e Push

```bash
git add .
git commit -m "feat: Migrar do Supabase para PostgreSQL no Kubernetes"
git push origin main
```

---

## 🐳 PASSO 2: Build e Push das Imagens Docker

### 2.1 - Verificar o Dockerfile do Frontend

Certifique-se que seu `Dockerfile` está correto:

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build argument for API URL
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built app
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 8080

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

### 2.2 - Verificar o nginx.conf

Crie/atualize o arquivo `nginx.conf` na raiz do projeto:

```nginx
server {
    listen 8080;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

### 2.3 - Login no AWS ECR

```bash
# Fazer login no ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 289208114389.dkr.ecr.us-east-1.amazonaws.com
```

### 2.4 - Build da Imagem do Frontend

```bash
# Build da nova imagem (incrementar versão)
docker build -t 289208114389.dkr.ecr.us-east-1.amazonaws.com/picpay-dev/ms-resource-frontend:v1.0.3 .

# Verificar se a imagem foi criada
docker images | grep ms-resource-frontend
```

### 2.5 - Testar a Imagem Localmente (Opcional mas Recomendado)

```bash
# Rodar a imagem localmente
docker run -p 8080:8080 --rm \
  -e VITE_API_URL=http://localhost:3000 \
  289208114389.dkr.ecr.us-east-1.amazonaws.com/picpay-dev/ms-resource-frontend:v1.0.3

# Acessar http://localhost:8080 no navegador
# Ctrl+C para parar
```

### 2.6 - Push da Imagem para o ECR

```bash
# Push da imagem
docker push 289208114389.dkr.ecr.us-east-1.amazonaws.com/picpay-dev/ms-resource-frontend:v1.0.3

# Verificar no ECR se a imagem foi enviada
aws ecr describe-images --repository-name picpay-dev/ms-resource-frontend --region us-east-1 | grep v1.0.3
```

---

## ☸️ PASSO 3: Atualizar os Arquivos Kubernetes

### 3.1 - Atualizar o ConfigMap do Frontend

Edite `k8s/09-frontend-configmap.yaml`:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: frontend-config
  namespace: ms-frontend-picpay-monitor
data:
  VITE_API_URL: "/api"  # Importante: deixar como /api
```

### 3.2 - Atualizar o Deployment do Frontend

Edite `k8s/10-frontend-deployment.yaml` e atualize a versão da imagem:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: ms-frontend-picpay-monitor
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      imagePullSecrets:
      - name: ecr      
      containers:
      - name: frontend
        image: 289208114389.dkr.ecr.us-east-1.amazonaws.com/picpay-dev/ms-resource-frontend:v1.0.3  # ← ATUALIZAR AQUI
        imagePullPolicy: Always  # ← IMPORTANTE: Always para forçar pull
        ports:
        - containerPort: 8080
        envFrom:
        - configMapRef:
            name: frontend-config
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        livenessProbe:
          httpGet:
            path: /
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: frontend
  namespace: ms-frontend-picpay-monitor
spec:
  selector:
    app: frontend
  ports:
  - port: 80
    targetPort: 8080
  type: ClusterIP
```

### 3.3 - Verificar o Ingress

Confirme que o arquivo `k8s/11-ingress.yaml` tem a rota `/api` para o backend:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: aws-resource-backend
  namespace: ms-frontend-picpay-monitor
  labels:
    app: aws-resource
    external: "false"
    priority: "5"
  annotations:
    konghq.com/strip-path: "true"  # ← IMPORTANTE
spec:
  ingressClassName: kong
  rules:
  - host: ms-frontend-picpay-monitor.hom-lionx.com.br
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: backend
            port:
              number: 3000
```

---

## 🚀 PASSO 4: Deploy no Kubernetes

### 4.1 - Verificar Estado Atual

```bash
# Ver pods atuais
kubectl get pods -n ms-frontend-picpay-monitor

# Ver deployments
kubectl get deployments -n ms-frontend-picpay-monitor

# Ver services
kubectl get services -n ms-frontend-picpay-monitor
```

### 4.2 - Aplicar as Configurações

```bash
# Aplicar ConfigMap (se houver mudanças)
kubectl apply -f k8s/09-frontend-configmap.yaml

# Aplicar Deployment atualizado
kubectl apply -f k8s/10-frontend-deployment.yaml

# OU atualizar apenas a imagem (método mais rápido)
kubectl set image deployment/frontend \
  frontend=289208114389.dkr.ecr.us-east-1.amazonaws.com/picpay-dev/ms-resource-frontend:v1.0.3 \
  -n ms-frontend-picpay-monitor
```

### 4.3 - Acompanhar o Rollout

```bash
# Acompanhar o status do deployment
kubectl rollout status deployment/frontend -n ms-frontend-picpay-monitor

# Ver logs dos novos pods
kubectl logs -f deployment/frontend -n ms-frontend-picpay-monitor --tail=50

# Ver eventos
kubectl get events -n ms-frontend-picpay-monitor --sort-by=.metadata.creationTimestamp
```

### 4.4 - Verificar os Pods

```bash
# Ver se os novos pods estão rodando
kubectl get pods -n ms-frontend-picpay-monitor -l app=frontend

# Deve mostrar algo como:
# NAME                        READY   STATUS    RESTARTS   AGE
# frontend-xxxxxxxxxx-xxxxx   1/1     Running   0          2m
# frontend-xxxxxxxxxx-xxxxx   1/1     Running   0          2m
```

---

## ✅ PASSO 5: Testes e Verificações

### 5.1 - Teste de Acesso ao Frontend

```bash
# Acesse no navegador
https://ms-frontend-picpay-monitor.hom-lionx.com.br

# Ou teste com curl
curl -I https://ms-frontend-picpay-monitor.hom-lionx.com.br
```

### 5.2 - Teste de Cadastro de Usuário

1. **Abra o navegador** em `https://ms-frontend-picpay-monitor.hom-lionx.com.br`

2. **Clique em "Criar Conta"**

3. **Preencha os dados:**
   - Nome: `Usuario Teste`
   - Email: `teste@example.com`
   - Senha: `senha123456`
   - Confirmar Senha: `senha123456`

4. **Clique em "Criar Conta"**

5. **Deve:**
   - Criar a conta
   - Fazer login automático
   - Redirecionar para o dashboard

### 5.3 - Verificar no Banco de Dados

```bash
# Conectar ao PostgreSQL
kubectl exec -it postgres-0 -n ms-frontend-picpay-monitor -- psql -U postgres -d aws_resource_db

# No psql, execute:
```

```sql
-- Verificar usuários criados
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- Verificar perfis de usuário
SELECT id, name, email, role, is_active, created_at 
FROM users_profile 
ORDER BY created_at DESC 
LIMIT 5;

-- Sair do psql
\q
```

### 5.4 - Verificar Logs

```bash
# Logs do Frontend
kubectl logs deployment/frontend -n ms-frontend-picpay-monitor --tail=100

# Logs do Backend (para ver as requisições)
kubectl logs deployment/backend -n ms-frontend-picpay-monitor --tail=100

# Logs do PostgreSQL
kubectl logs postgres-0 -n ms-frontend-picpay-monitor --tail=100
```

### 5.5 - Testes no Browser Console

Abra o DevTools (F12) > Console:

```javascript
// Verificar se o token está salvo
localStorage.getItem('auth_token')

// Deve retornar um token JWT
```

Abra o DevTools (F12) > Network > Filter: `/api`:

```
Você deve ver chamadas como:
- POST /api/auth/signup (ao criar conta)
- POST /api/auth/signin (ao fazer login)
- GET /api/auth/user (ao verificar autenticação)
- GET /api/dashboard/stats
- GET /api/clusters
```

---

## 🔍 PASSO 6: Troubleshooting

### Problema: Pod não inicia

```bash
# Ver detalhes do pod
kubectl describe pod -l app=frontend -n ms-frontend-picpay-monitor

# Ver eventos
kubectl get events -n ms-frontend-picpay-monitor | grep frontend

# Ver logs do pod com erro
kubectl logs <nome-do-pod> -n ms-frontend-picpay-monitor
```

### Problema: Erro 502 Bad Gateway

```bash
# Verificar se o backend está rodando
kubectl get pods -n ms-frontend-picpay-monitor -l app=backend

# Verificar logs do backend
kubectl logs deployment/backend -n ms-frontend-picpay-monitor --tail=100

# Testar conexão do backend ao PostgreSQL
kubectl exec -it <backend-pod> -n ms-frontend-picpay-monitor -- curl http://postgres:5432
```

### Problema: Usuário não é criado

```bash
# Ver logs do backend durante o cadastro
kubectl logs -f deployment/backend -n ms-frontend-picpay-monitor

# Verificar se o PostgreSQL está acessível
kubectl exec -it postgres-0 -n ms-frontend-picpay-monitor -- pg_isready -U postgres

# Verificar tabelas no PostgreSQL
kubectl exec -it postgres-0 -n ms-frontend-picpay-monitor -- psql -U postgres -d aws_resource_db -c "\dt auth.*"
kubectl exec -it postgres-0 -n ms-frontend-picpay-monitor -- psql -U postgres -d aws_resource_db -c "\dt public.*"
```

### Problema: Frontend não carrega

```bash
# Limpar cache do browser (Ctrl+Shift+R)
# Ou usar modo anônimo

# Verificar se o NGINX está rodando
kubectl exec -it <frontend-pod> -n ms-frontend-picpay-monitor -- nginx -t

# Ver logs do NGINX
kubectl logs <frontend-pod> -n ms-frontend-picpay-monitor
```

---

## 🔄 PASSO 7: Rollback (Se Necessário)

### Se algo der muito errado:

```bash
# Ver histórico de deploys
kubectl rollout history deployment/frontend -n ms-frontend-picpay-monitor

# Rollback para versão anterior
kubectl rollout undo deployment/frontend -n ms-frontend-picpay-monitor

# Ou para uma versão específica
kubectl rollout undo deployment/frontend --to-revision=2 -n ms-frontend-picpay-monitor
```

---

## 📝 PASSO 8: Checklist Final

- [ ] Código atualizado no GitHub
- [ ] Imagem do frontend buildada (v1.0.3)
- [ ] Imagem enviada para o ECR
- [ ] ConfigMap aplicado no Kubernetes
- [ ] Deployment atualizado no Kubernetes
- [ ] Pods do frontend rodando (2 réplicas)
- [ ] Acesso ao site funcionando
- [ ] Cadastro de usuário funcionando
- [ ] Usuário aparece no banco de dados PostgreSQL
- [ ] Login funcionando
- [ ] Dashboard carregando dados
- [ ] Logs sem erros críticos

---

## 🎯 Resumo Executivo

**O que mudou:**
- Frontend agora usa PostgreSQL do Kubernetes via backend API
- Não usa mais Supabase Cloud
- Todos os dados vêm da API (`/api/*`)
- Autenticação via JWT armazenado no localStorage

**O que fazer:**
1. Atualizar código no GitHub
2. Build nova imagem Docker do frontend (v1.0.3)
3. Push para ECR
4. Atualizar deployment no Kubernetes
5. Testar cadastro e login
6. Verificar no banco de dados

**Tempo estimado:** 30-45 minutos

**Prioridade:** Alta (sistema não funciona sem esta migração)

---

## 📞 Suporte

Se encontrar problemas:

1. **Verifique logs:** Backend, Frontend, PostgreSQL
2. **Verifique conectividade:** Backend ↔ PostgreSQL
3. **Verifique Ingress:** Rotas `/api` e `/`
4. **Verifique browser:** Console e Network tab
5. **Faça rollback** se necessário

---

## ✨ Próximos Passos (Opcional)

Após a migração funcionar:

1. **Implementar reset de senha**
   - Criar endpoint `/api/auth/reset-password` no backend
   - Configurar serviço de email

2. **Implementar mudança de senha**
   - Criar endpoint `/api/auth/change-password` no backend

3. **Remover Supabase completamente**
   - `npm uninstall @supabase/supabase-js`
   - Remover pasta `src/integrations/supabase`

4. **Monitoramento**
   - Configurar alertas no Kubernetes
   - Configurar logs centralizados

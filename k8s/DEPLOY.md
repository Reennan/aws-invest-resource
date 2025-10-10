# 🚀 GUIA COMPLETO DE DEPLOY - AWS RESOURCE NO KUBERNETES

Este guia vai te ajudar a subir toda a aplicação AWS Resource no seu cluster Kubernetes, incluindo PostgreSQL, Backend API e Frontend.

## 📋 PRÉ-REQUISITOS

1. Cluster Kubernetes funcionando
2. `kubectl` instalado e configurado
3. Docker instalado (para build das imagens)
4. Ingress Controller instalado no cluster (nginx, traefik, etc.)

---

## 🎯 PASSO 1: CRIAR O NAMESPACE

```bash
kubectl apply -f k8s/01-namespace.yaml
```

**O que faz:** Cria o namespace `ms-frontend-picpay-monitor` onde todos os recursos serão instalados.

**Verificar:**
```bash
kubectl get namespace ms-frontend-picpay-monitor
```

---

## 🗄️ PASSO 2: DEPLOY DO POSTGRESQL

### 2.1 - Aplicar Secret do PostgreSQL
```bash
kubectl apply -f k8s/02-postgres-secret.yaml
```

**O que faz:** Cria as credenciais do banco de dados (usuário: postgres, senha: Primeiroacesso_2022).

### 2.2 - Criar PersistentVolumeClaim
```bash
kubectl apply -f k8s/03-postgres-pvc.yaml
```

**O que faz:** Reserva 10GB de armazenamento persistente para os dados do PostgreSQL.

### 2.3 - Deploy do PostgreSQL StatefulSet
```bash
kubectl apply -f k8s/04-postgres-statefulset.yaml
```

**O que faz:** Sobe o PostgreSQL 16 Alpine no cluster.

### 2.4 - Criar Service do PostgreSQL
```bash
kubectl apply -f k8s/05-postgres-service.yaml
```

**O que faz:** Expõe o PostgreSQL internamente no cluster (postgres.aws-resource.svc.cluster.local:5432).

**Verificar se o PostgreSQL está rodando:**
```bash
kubectl get pods -n ms-frontend-picpay-monitor
kubectl logs -n ms-frontend-picpay-monitor postgres-0
```

**Aguarde até o pod estar `Running` e `Ready 1/1`.**

---

## 🔧 PASSO 3: INICIALIZAR O BANCO DE DADOS

### 3.1 - Copiar o script SQL para o pod do PostgreSQL
```bash
kubectl cp k8s/06-init-db.sql ms-frontend-picpay-monitor/postgres-0:/tmp/init-db.sql
```

### 3.2 - Executar o script de inicialização
```bash
kubectl exec -n ms-frontend-picpay-monitor postgres-0 -- psql -U postgres -d aws_resource_db -f /tmp/init-db.sql
```

**O que faz:**
- Cria todas as tabelas (users, clusters, resources, etc.)
- Cria as funções e triggers
- Cria as views para dashboard
- Cria um usuário admin padrão:
  - **Email:** admin@awsresource.com
  - **Senha:** admin123

**Verificar se as tabelas foram criadas:**
```bash
kubectl exec -n ms-frontend-picpay-monitor postgres-0 -- psql -U postgres -d aws_resource_db -c "\dt public.*"
kubectl exec -n ms-frontend-picpay-monitor postgres-0 -- psql -U postgres -d aws_resource_db -c "\dt auth.*"
```

---

## 🔌 PASSO 4: BUILD E DEPLOY DO BACKEND

### 4.1 - Build da imagem Docker do Backend
```bash
cd backend
docker build -t aws-resource-backend:latest .
cd ..
```

**Nota:** Se você estiver usando Minikube, carregue a imagem:
```bash
minikube image load aws-resource-backend:latest
```

### 4.2 - Aplicar Secret do Backend
```bash
kubectl apply -f k8s/07-backend-secret.yaml
```

**O que faz:** Cria as variáveis de ambiente (JWT_SECRET, credenciais do DB).

### 4.3 - Deploy do Backend
```bash
kubectl apply -f k8s/08-backend-deployment.yaml
```

**O que faz:** Sobe 2 réplicas da API Backend (Node.js + Express + PostgreSQL).

**Verificar se o backend está rodando:**
```bash
kubectl get pods -n ms-frontend-picpay-monitor
kubectl logs -n ms-frontend-picpay-monitor -l app=backend
```

**Testar o health check do backend:**
```bash
kubectl port-forward -n ms-frontend-picpay-monitor svc/backend 3000:3000
# Em outro terminal:
curl http://localhost:3000/health
```

Você deve receber: `{"status":"ok","timestamp":"..."}`

---

## 🎨 PASSO 5: BUILD E DEPLOY DO FRONTEND

### 5.1 - Build da imagem Docker do Frontend
```bash
docker build --build-arg VITE_API_URL=/api -t aws-resource-frontend:latest .
```

**Nota:** Se você estiver usando Minikube:
```bash
minikube image load aws-resource-frontend:latest
```

### 5.2 - Aplicar ConfigMap do Frontend
```bash
kubectl apply -f k8s/09-frontend-configmap.yaml
```

### 5.3 - Deploy do Frontend
```bash
kubectl apply -f k8s/10-frontend-deployment.yaml
```

**O que faz:** Sobe 2 réplicas do Frontend (React + Vite + Nginx).

**Verificar se o frontend está rodando:**
```bash
kubectl get pods -n ms-frontend-picpay-monitor
kubectl logs -n ms-frontend-picpay-monitor -l app=frontend
```

---

## 🌐 PASSO 6: CONFIGURAR INGRESS

### 6.1 - Aplicar o Ingress
```bash
kubectl apply -f k8s/11-ingress.yaml
```

**O que faz:** Configura o Ingress para expor a aplicação no domínio `ms-frontend-picpay-monitor.hom-lionx.com.br`.

**Verificar o Ingress:**
```bash
kubectl get ingress -n ms-frontend-picpay-monitor
```

### 6.2 - Acessar a aplicação

Acesse no navegador: `http://ms-frontend-picpay-monitor.hom-lionx.com.br`

---

## ✅ PASSO 7: TESTAR A APLICAÇÃO

### 7.1 - Fazer login com o usuário admin
- Email: `admin@awsresource.com`
- Senha: `admin123`

### 7.2 - Verificar funcionalidades:
- ✅ Dashboard
- ✅ Clusters
- ✅ Reports
- ✅ Admin Users
- ✅ Account

---

## 🔍 COMANDOS ÚTEIS DE DEBUG

### Ver todos os recursos no namespace
```bash
kubectl get all -n ms-frontend-picpay-monitor
```

### Ver logs de um pod específico
```bash
kubectl logs -n ms-frontend-picpay-monitor <pod-name>
kubectl logs -n ms-frontend-picpay-monitor <pod-name> -f  # Follow logs
```

### Ver logs do backend
```bash
kubectl logs -n ms-frontend-picpay-monitor -l app=backend -f
```

### Ver logs do frontend
```bash
kubectl logs -n ms-frontend-picpay-monitor -l app=frontend -f
```

### Ver logs do PostgreSQL
```bash
kubectl logs -n ms-frontend-picpay-monitor postgres-0 -f
```

### Acessar o shell do pod do PostgreSQL
```bash
kubectl exec -it -n ms-frontend-picpay-monitor postgres-0 -- psql -U postgres -d aws_resource_db
```

### Testar conexão com o backend de dentro do cluster
```bash
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -n ms-frontend-picpay-monitor -- curl http://backend:3000/health
```

### Reiniciar um deployment
```bash
kubectl rollout restart deployment/backend -n ms-frontend-picpay-monitor
kubectl rollout restart deployment/frontend -n ms-frontend-picpay-monitor
```

### Deletar tudo e começar de novo
```bash
kubectl delete namespace ms-frontend-picpay-monitor
```

---

## 🎉 PRONTO!

Sua aplicação AWS Resource está rodando 100% local no Kubernetes!

**Credenciais padrão:**
- Email: admin@awsresource.com
- Senha: admin123

**Arquitetura:**
- PostgreSQL: banco de dados persistente
- Backend API: Node.js + Express (porta 3000)
- Frontend: React + Vite + Nginx (porta 8080)
- Ingress: roteamento HTTP/HTTPS

---

## 📚 PRÓXIMOS PASSOS

1. **Alterar senhas padrão** no `k8s/02-postgres-secret.yaml` e `k8s/07-backend-secret.yaml`
2. **Configurar SSL/TLS** no Ingress (cert-manager)
3. **Configurar backups** do PostgreSQL
4. **Configurar monitoramento** (Prometheus + Grafana)
5. **Configurar CI/CD** para deploy automatizado

---

## ❓ PROBLEMAS COMUNS

### Backend não conecta no PostgreSQL
- Verifique se o PostgreSQL está rodando: `kubectl get pods -n ms-frontend-picpay-monitor`
- Verifique os logs do backend: `kubectl logs -n ms-frontend-picpay-monitor -l app=backend`
- Teste a conexão: `kubectl exec -n ms-frontend-picpay-monitor postgres-0 -- pg_isready -U postgres`

### Frontend não carrega
- Verifique se o backend está rodando
- Verifique os logs do frontend: `kubectl logs -n ms-frontend-picpay-monitor -l app=frontend`
- Teste o health check: `curl http://<FRONTEND_URL>/`

### Ingress não funciona
- Verifique se o Ingress Controller está instalado: `kubectl get pods -n ingress-nginx`
- Verifique o Ingress: `kubectl describe ingress -n ms-frontend-picpay-monitor`
- Verifique se o domínio está resolvendo para o IP correto

---

**🎯 Para mais ajuda, consulte a documentação do Kubernetes ou abra uma issue.**

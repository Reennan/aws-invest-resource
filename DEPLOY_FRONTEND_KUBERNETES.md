# Deploy do Frontend no Kubernetes

## Passo a Passo para Fazer o Deploy

### 1. Build da Imagem Docker

```bash
# Entre no diretório raiz do projeto
cd /caminho/do/projeto

# Build da imagem do frontend
docker build -f Dockerfile -t 289208114389.dkr.ecr.us-east-1.amazonaws.com/picpay-dev/ms-resource-frontend:v1.0.3 .

# Push para o ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 289208114389.dkr.ecr.us-east-1.amazonaws.com
docker push 289208114389.dkr.ecr.us-east-1.amazonaws.com/picpay-dev/ms-resource-frontend:v1.0.3
```

### 2. Atualizar o Deployment

Edite o arquivo `k8s/10-frontend-deployment.yaml` e atualize a imagem:

```yaml
spec:
  containers:
  - name: frontend
    image: 289208114389.dkr.ecr.us-east-1.amazonaws.com/picpay-dev/ms-resource-frontend:v1.0.3
    imagePullPolicy: Always  # Força sempre puxar a imagem
```

### 3. Aplicar as Configurações

```bash
# Aplicar o ConfigMap (se houver mudanças)
kubectl apply -f k8s/09-frontend-configmap.yaml

# Aplicar o Deployment atualizado
kubectl apply -f k8s/10-frontend-deployment.yaml

# OU atualizar a imagem diretamente (mais rápido)
kubectl set image deployment/frontend frontend=289208114389.dkr.ecr.us-east-1.amazonaws.com/picpay-dev/ms-resource-frontend:v1.0.3 -n ms-frontend-picpay-monitor
```

### 4. Verificar o Deploy

```bash
# Ver status do deployment
kubectl rollout status deployment/frontend -n ms-frontend-picpay-monitor

# Ver pods
kubectl get pods -n ms-frontend-picpay-monitor -l app=frontend

# Ver logs
kubectl logs -f deployment/frontend -n ms-frontend-picpay-monitor
```

### 5. Testar a Aplicação

1. Acesse: `https://ms-frontend-picpay-monitor.hom-lionx.com.br`

2. Teste o cadastro de novo usuário:
   - Nome: "Teste User"
   - Email: "teste@example.com"
   - Senha: "senha123"

3. Verifique no banco se o usuário foi criado:
```bash
kubectl exec -it postgres-0 -n ms-frontend-picpay-monitor -- psql -U postgres -d aws_resource_db

SELECT email, created_at FROM auth.users ORDER BY created_at DESC LIMIT 5;
SELECT name, email, role FROM users_profile ORDER BY created_at DESC LIMIT 5;
```

## Estrutura dos YAMLs do Frontend

### ConfigMap (`09-frontend-configmap.yaml`)
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: frontend-config
  namespace: ms-frontend-picpay-monitor
data:
  VITE_API_URL: "/api"
```

### Deployment (`10-frontend-deployment.yaml`)
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
        image: 289208114389.dkr.ecr.us-east-1.amazonaws.com/picpay-dev/ms-resource-frontend:v1.0.3
        imagePullPolicy: Always
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

## Troubleshooting

### Pod não sobe
```bash
# Ver eventos
kubectl describe pod -l app=frontend -n ms-frontend-picpay-monitor

# Ver logs
kubectl logs -l app=frontend -n ms-frontend-picpay-monitor --tail=100
```

### Erro 502 Bad Gateway
```bash
# Verificar se o backend está rodando
kubectl get pods -n ms-frontend-picpay-monitor -l app=backend

# Verificar logs do backend
kubectl logs -l app=backend -n ms-frontend-picpay-monitor --tail=100
```

### Erro ao criar usuário
```bash
# Verificar logs do backend
kubectl logs -l app=backend -n ms-frontend-picpay-monitor --tail=100

# Verificar conexão com o PostgreSQL
kubectl exec -it postgres-0 -n ms-frontend-picpay-monitor -- psql -U postgres -d aws_resource_db -c "\dt"
```

### Cache do Browser
- Limpe o cache do browser (Ctrl+Shift+R)
- Ou use modo anônimo
- Ou abra DevTools > Application > Clear Storage

## Ordem de Deploy

1. PostgreSQL (se ainda não estiver rodando)
2. Backend
3. Frontend
4. Ingress

## Rollback

Se algo der errado, faça rollback para a versão anterior:

```bash
# Ver histórico
kubectl rollout history deployment/frontend -n ms-frontend-picpay-monitor

# Rollback para versão anterior
kubectl rollout undo deployment/frontend -n ms-frontend-picpay-monitor

# Rollback para versão específica
kubectl rollout undo deployment/frontend --to-revision=2 -n ms-frontend-picpay-monitor
```

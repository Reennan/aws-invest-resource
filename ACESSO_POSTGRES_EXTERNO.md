# 🔌 Expor PostgreSQL Fora do Cluster Kubernetes

## 📋 Visão Geral

Este guia mostra como acessar o banco de dados PostgreSQL que está rodando no cluster Kubernetes de **fora do cluster**.

---

## 🎯 Opções Disponíveis

### **OPÇÃO 1: NodePort** ⭐ (Recomendado para desenvolvimento/homologação)

Expõe o PostgreSQL em uma porta específica em todos os nodes do cluster.

#### ✅ Vantagens:
- Simples de configurar
- Funciona em qualquer cluster Kubernetes
- Não requer cloud provider específico

#### ⚠️ Desvantagens:
- Porta fixa (30000-32767)
- Menos seguro (exposto em todos os nodes)
- Não recomendado para produção

#### 🚀 Como Aplicar:

```bash
# 1. Aplicar o serviço NodePort
kubectl apply -f k8s/12-postgres-external-access.yaml

# 2. Verificar o serviço
kubectl get svc postgres-external -n ms-frontend-picpay-monitor

# 3. Obter o IP de um node
kubectl get nodes -o wide

# 4. Testar conexão
psql -h <IP_DO_NODE> -p 30432 -U postgres -d postgres
```

#### 📊 String de Conexão:
```
Host: <IP_DO_NODE>
Port: 30432
Database: postgres
User: postgres
Password: <sua_senha>
```

---

### **OPÇÃO 2: LoadBalancer** (Para ambientes cloud)

Cria um Load Balancer externo provisionado pelo cloud provider (AWS, GCP, Azure).

#### ✅ Vantagens:
- IP externo dedicado
- Mais seguro
- Balanceamento automático

#### ⚠️ Desvantagens:
- Requer cloud provider com suporte a LoadBalancer
- Pode gerar custos adicionais
- Não funciona em clusters locais (minikube, kind, etc)

#### 🚀 Como Aplicar:

```bash
# 1. Descomente a seção LoadBalancer no arquivo k8s/12-postgres-external-access.yaml
# (remova o # das linhas)

# 2. Aplicar
kubectl apply -f k8s/12-postgres-external-access.yaml

# 3. Aguardar o IP externo ser provisionado
kubectl get svc postgres-loadbalancer -n ms-frontend-picpay-monitor -w

# 4. Quando EXTERNAL-IP aparecer (não mais <pending>), use-o para conectar
psql -h <EXTERNAL-IP> -p 5432 -U postgres -d postgres
```

---

### **OPÇÃO 3: Ingress TCP** (Se você já usa nginx-ingress)

Usa o nginx-ingress-controller para expor serviços TCP (não apenas HTTP).

#### ✅ Vantagens:
- Usa a mesma infraestrutura do Ingress HTTP
- Centralizado
- Pode usar o mesmo IP/domínio

#### ⚠️ Desvantagens:
- Requer configuração adicional no nginx-ingress
- Mais complexo

#### 🚀 Como Aplicar:

```bash
# 1. Criar ConfigMap para TCP services
kubectl apply -f - <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: tcp-services
  namespace: ingress-nginx  # Ajuste conforme seu namespace
data:
  5432: "ms-frontend-picpay-monitor/postgres:5432"
EOF

# 2. Editar o deployment do nginx-ingress-controller
kubectl edit deployment nginx-ingress-controller -n ingress-nginx

# Adicionar nos args:
# - --tcp-services-configmap=ingress-nginx/tcp-services

# 3. Editar o service do nginx-ingress
kubectl edit svc nginx-ingress-controller -n ingress-nginx

# Adicionar nas portas:
#   - name: postgres
#     port: 5432
#     targetPort: 5432
#     protocol: TCP
```

---

### **OPÇÃO 4: Port Forward** (Para acesso temporário/desenvolvimento)

Para acessos rápidos e temporários, sem criar serviços permanentes.

#### 🚀 Como Usar:

```bash
# Iniciar port forward (mantém terminal aberto)
kubectl port-forward -n ms-frontend-picpay-monitor statefulset/postgres 5432:5432

# Em outro terminal, conectar
psql -h localhost -p 5432 -U postgres -d postgres
```

#### ⚠️ Atenção:
- Conexão só funciona enquanto o comando estiver rodando
- Acesso apenas da máquina local
- Útil para debug e manutenção rápida

---

## 🔐 Segurança

### ⚠️ IMPORTANTE - Recomendações de Segurança:

1. **Firewall**: Configure regras de firewall para permitir apenas IPs confiáveis
   ```bash
   # Exemplo (AWS Security Group, GCP Firewall, etc)
   # Permitir apenas seu IP ou rede interna
   ```

2. **Senha Forte**: Altere a senha padrão do PostgreSQL
   ```sql
   ALTER USER postgres PASSWORD 'senha_muito_forte_aqui';
   ```

3. **SSL/TLS**: Configure conexões SSL no PostgreSQL
   ```yaml
   # Em k8s/04-postgres-statefulset.yaml, adicionar:
   env:
   - name: POSTGRES_HOST_AUTH_METHOD
     value: "scram-sha-256"
   ```

4. **VPN**: Para produção, considere usar VPN ou bastion host
5. **Audit Logs**: Habilite logs de auditoria no PostgreSQL
6. **Backup**: Sempre faça backup antes de expor externamente

---

## 🧪 Testar Conexão

### Usando psql:
```bash
psql -h <HOST> -p <PORT> -U postgres -d postgres
```

### Usando DBeaver/PgAdmin:
```
Host: <HOST>
Port: <PORT>
Database: postgres
Username: postgres
Password: <sua_senha>
SSL: Preferir (ou Require se configurado)
```

### Usando aplicação Node.js:
```javascript
const { Pool } = require('pg');

const pool = new Pool({
  host: '<HOST>',
  port: <PORT>,
  database: 'postgres',
  user: 'postgres',
  password: '<sua_senha>',
  ssl: false  // true se SSL estiver configurado
});

pool.query('SELECT NOW()', (err, res) => {
  console.log(err ? err.stack : res.rows[0]);
  pool.end();
});
```

---

## 🐛 Troubleshooting

### Erro: "Connection refused"
```bash
# Verificar se o pod está rodando
kubectl get pods -n ms-frontend-picpay-monitor

# Verificar logs
kubectl logs -n ms-frontend-picpay-monitor statefulset/postgres

# Verificar serviço
kubectl get svc -n ms-frontend-picpay-monitor
```

### Erro: "timeout"
```bash
# Verificar firewall/security groups
# Verificar se a porta está aberta
telnet <HOST> <PORT>
nc -zv <HOST> <PORT>
```

### Erro: "authentication failed"
```bash
# Verificar credenciais no secret
kubectl get secret postgres-secret -n ms-frontend-picpay-monitor -o yaml

# Decodificar senha
echo "<base64_password>" | base64 -d
```

---

## 🎯 Recomendação Final

Para **desenvolvimento/homologação**: Use **NodePort** (Opção 1) - mais simples e rápido.

Para **produção**: Use **LoadBalancer** (Opção 2) com firewall/VPN configurado.

Para **acesso temporário**: Use **Port Forward** (Opção 4).

---

## 📚 Próximos Passos

1. Escolha a opção que melhor se adequa ao seu ambiente
2. Aplique o arquivo YAML correspondente
3. Configure firewall/segurança
4. Teste a conexão
5. Configure backup e monitoramento

---

## 🆘 Suporte

Se encontrar problemas:
1. Verifique os logs do PostgreSQL
2. Verifique os eventos do Kubernetes: `kubectl get events -n ms-frontend-picpay-monitor`
3. Verifique a conectividade de rede
4. Revise as configurações de segurança

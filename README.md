# AWS Resource Monitor - Kubernetes Internal

Sistema de monitoramento de recursos AWS totalmente internalizado no cluster Kubernetes.

## 🏗️ Arquitetura

- **Frontend**: React + Vite + Nginx (porta 8080)
- **Backend**: Node.js + Express (porta 3000)
- **Database**: PostgreSQL (porta 5432)

## 🚀 Deploy Rápido

```bash
# 1. Login no ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  289208114389.dkr.ecr.us-east-1.amazonaws.com

# 2. Build Frontend (IMPORTANTE: usar --build-arg!)
docker build \
  --build-arg VITE_API_URL=/api \
  --no-cache \
  -t 289208114389.dkr.ecr.us-east-1.amazonaws.com/picpay-dev/ms-resource-frontend:v1.0.6 \
  -f Dockerfile .

# 3. Push
docker push 289208114389.dkr.ecr.us-east-1.amazonaws.com/picpay-dev/ms-resource-frontend:v1.0.6
```

## 🛠️ Desenvolvimento Local

```bash
# Frontend
npm install
npm run dev

# Backend
cd backend
npm install
npm run dev
```

**Nota**: Para desenvolvimento local, ajuste `VITE_API_URL` no `.env` para apontar ao backend local.

## 📦 Estrutura

```
.
├── backend/              # Backend Node.js/Express
├── src/                  # Frontend React
│   ├── hooks/           # React hooks (useAuth, useClusters, etc.)
│   ├── lib/             # apiClient
│   └── pages/           # Páginas
├── tests/               # Testes unitários
├── .env                 # VITE_API_URL=/api
└── Dockerfile           # Frontend build
```

## ✅ Testes

```bash
# Executar testes
npm run test

# Verificar cobertura
npm run test -- --coverage
```

## 📝 Licença

Proprietary - PicPay

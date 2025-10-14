# Migração do Supabase para PostgreSQL no Kubernetes

## O que foi feito

O frontend foi refatorado para usar o backend PostgreSQL ao invés do Supabase Cloud. Todas as operações de autenticação e dados agora passam pela API do backend.

## Arquivos Modificados

### Hooks Refatorados
- ✅ `src/hooks/useAuth.tsx` - Já usava apiClient
- ✅ `src/hooks/useUsers.tsx` - Já usava apiClient  
- ✅ `src/hooks/useClusters.tsx` - Já usava apiClient
- ✅ `src/hooks/useResources.tsx` - Já usava apiClient
- ✅ `src/hooks/useUserClusterPermissions.tsx` - Migrado para apiClient
- ✅ `src/hooks/useRealtime.tsx` - Usa polling (30s), não depende do Supabase

### Componentes Refatorados
- ✅ `src/components/ClusterFilters.tsx` - Migrado para apiClient
- ✅ `src/components/DashboardStats.tsx` - Migrado para apiClient
- ✅ `src/components/DashboardCharts.tsx` - Migrado para apiClient
- ✅ `src/components/LatestExecutions.tsx` - Migrado para apiClient
- ✅ `src/components/FilteredResourcesList.tsx` - Migrado para apiClient

### Páginas Refatoradas
- ✅ `src/pages/Auth.tsx` - Já usava useAuth (apiClient)
- ✅ `src/pages/Account.tsx` - Removido supabase.auth.updateUser

### Componentes com Funcionalidade Desabilitada
- ⚠️ `src/components/PasswordResetDialog.tsx` - Usa Edge Function do Supabase (não migrado)
- ⚠️ `src/components/PasswordResetForm.tsx` - Usa Edge Function do Supabase (não migrado)

## Configuração do Frontend no Kubernetes

### ConfigMap (frontend-config)
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: frontend-config
  namespace: ms-frontend-picpay-monitor
data:
  VITE_API_URL: "/api"
```

### Ingress
O Ingress roteia `/api` para o backend:
```yaml
- path: /api
  pathType: Prefix
  backend:
    service:
      name: backend
      port:
        number: 3000
```

## Como Funciona Agora

1. **Autenticação**: 
   - SignIn/SignUp são feitos via `/api/auth/signin` e `/api/auth/signup`
   - Token JWT é armazenado no localStorage
   - Todas as requisições incluem o header `Authorization: Bearer <token>`

2. **Dados em Tempo Real**:
   - O hook `useRealtime` faz polling a cada 30 segundos
   - Não usa Supabase Realtime subscriptions

3. **Dados do Dashboard**:
   - Todos os dados vêm dos endpoints da API:
     - `/api/dashboard/stats`
     - `/api/dashboard/unused-by-type`
     - `/api/resources-created`
     - `/api/resources-unused`
     - `/api/clusters`
     - `/api/runs`

## Funcionalidades Não Implementadas

1. **Reset de Senha**: Os componentes `PasswordResetDialog` e `PasswordResetForm` dependem de Edge Functions do Supabase. Para implementar, é necessário:
   - Criar endpoint `/api/auth/reset-password` no backend
   - Configurar serviço de email (SMTP)
   - Implementar geração e validação de tokens de reset

2. **Mudança de Senha**: Temporariamente desabilitada no `Account.tsx`. Para implementar:
   - Criar endpoint `/api/auth/change-password` no backend
   - Validar senha antiga antes de atualizar

## Variáveis de Ambiente

O frontend usa apenas uma variável:
- `VITE_API_URL`: URL da API (padrão: "/api")

Essa variável é injetada via ConfigMap do Kubernetes.

## Build da Imagem Docker

O Dockerfile do frontend deve fazer o build do Vite com as variáveis de ambiente:

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL=/api
RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
```

## Verificação

Para verificar se está funcionando:

1. **Check Auth**:
   ```bash
   # No browser console
   localStorage.getItem('auth_token')
   ```

2. **Check API Calls**:
   - Abra DevTools > Network
   - Veja se as chamadas vão para `/api/*`
   - Verifique o header `Authorization`

3. **Check Database**:
   ```bash
   kubectl exec -it postgres-0 -n ms-frontend-picpay-monitor -- psql -U postgres -d aws_resource_db
   
   SELECT email, created_at FROM auth.users;
   SELECT name, email, role FROM users_profile;
   ```

## Próximos Passos

1. Implementar endpoint de reset de senha no backend
2. Implementar endpoint de mudança de senha no backend  
3. Configurar serviço de email
4. Remover completamente o package `@supabase/supabase-js` se não for mais necessário

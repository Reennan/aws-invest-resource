# Instruções para Funcionalidades de Admin e Limpeza de Dados

## 📋 Resumo das Alterações

Foram implementadas as seguintes melhorias no backend:

1. **Logs detalhados** com emojis para todas as operações de admin
2. **Correção do authMiddleware** para buscar corretamente os dados do usuário
3. **Funcionalidades de admin** funcionando corretamente:
   - ✅ Alterar senha de usuários
   - ✅ Desativar/Ativar conta de usuários
   - ✅ Excluir usuários

## 🚀 Como Aplicar as Alterações

### Passo 1: Limpar dados das tabelas (opcional)

Se você quiser limpar todos os dados das tabelas (exceto auth), execute:

```bash
# Opção 1: Usando o script bash
chmod +x k8s/limpar-dados.sh
./k8s/limpar-dados.sh

# Opção 2: Manualmente via kubectl
kubectl exec -n ms-frontend-picpay-monitor postgres-0 -it -- \
  psql -U postgres -d aws_resource_db

# Depois execute os comandos do arquivo k8s/limpar-dados.sql
```

### Passo 2: Atualizar o backend

Para aplicar as novas funcionalidades, você precisa reconstruir e fazer deploy do backend:

```bash
# Opção 1: Usando o script bash
chmod +x k8s/atualizar-backend.sh
./k8s/atualizar-backend.sh

# Opção 2: Manualmente
cd backend
docker build -t aws-resource-backend:latest .
kubectl rollout restart deployment/backend -n ms-frontend-picpay-monitor
kubectl rollout status deployment/backend -n ms-frontend-picpay-monitor
```

### Passo 3: Verificar os logs

Após o deploy, verifique se o backend está funcionando corretamente:

```bash
# Ver logs em tempo real
kubectl logs -f deployment/backend -n ms-frontend-picpay-monitor

# Ver logs das últimas linhas
kubectl logs --tail=100 deployment/backend -n ms-frontend-picpay-monitor
```

## 🔍 Como Testar as Funcionalidades

### 1. Alterar Senha de Usuário

1. Acesse o sistema como **administrador**
2. Vá para a página de usuários (menu Admin > Usuários)
3. Clique no botão de **alterar senha** de um usuário
4. Digite a nova senha (mínimo 6 caracteres)
5. Confirme

**Logs esperados no backend:**
```
📥 [CHANGE PASSWORD] Requisição recebida para alterar senha do usuário: {id}
🔍 [CHANGE PASSWORD] Buscando auth_user_id...
✅ [CHANGE PASSWORD] Usuário encontrado: {authUserId, email}
🔐 [CHANGE PASSWORD] Gerando hash da nova senha...
💾 [CHANGE PASSWORD] Atualizando senha no banco de dados...
✅ [CHANGE PASSWORD] Senha alterada com sucesso para usuário: {email}
```

### 2. Desativar/Ativar Conta

1. Acesse o sistema como **administrador**
2. Vá para a página de usuários
3. Clique no toggle de **Ativo/Inativo** de um usuário

**Logs esperados no backend:**
```
📥 [UPDATE USER] Requisição recebida para atualizar usuário: {id}
📝 [UPDATE USER] Dados para atualização: {role, is_active}
🔄 [UPDATE USER] Atualizando perfil do usuário...
✅ [UPDATE USER] Usuário atualizado com sucesso: {user_data}
```

### 3. Excluir Usuário

1. Acesse o sistema como **administrador**
2. Vá para a página de usuários
3. Clique no botão de **excluir** de um usuário
4. Confirme a exclusão

**Logs esperados no backend:**
```
📥 [DELETE USER] Requisição recebida para excluir usuário: {id}
🔍 [DELETE USER] Buscando dados do usuário...
✅ [DELETE USER] Usuário encontrado: {authUserId, email}
🗑️  [DELETE USER] Excluindo usuário do banco de dados...
✅ [DELETE USER] Usuário excluído com sucesso: {email}
```

## ❓ Solução de Problemas

### Problema: "Perfil não encontrado"

Este erro foi corrigido no authMiddleware. Se ainda ocorrer:
- Certifique-se de que o backend foi atualizado
- Verifique se o usuário existe no banco: `SELECT * FROM public.users_profile WHERE id = '{id}';`

### Problema: "Senha não foi alterada"

Se a senha não for alterada no banco:
- Verifique os logs do backend para ver onde ocorreu o erro
- Confirme que o usuário existe em `auth.users`
- Verifique a conexão do backend com o PostgreSQL

### Problema: "Clusters Ativos: 2" mas não há clusters

Execute o script de limpeza de dados conforme o Passo 1.

## 🔐 Segurança

- Todas as operações de admin requerem permissão `can_manage_users = true`
- As senhas são criptografadas com bcrypt antes de serem armazenadas
- A exclusão de usuários remove dados de `auth.users` (com cascade para `users_profile`)
- Logs detalhados permitem auditoria de todas as operações

## 📝 Notas Importantes

- ⚠️ **Não use Supabase**: Todo o sistema está configurado para usar PostgreSQL local no Kubernetes
- ⚠️ **Backup**: Faça backup dos dados antes de executar a limpeza
- ⚠️ **Administradores**: Não exclua o último usuário administrador do sistema

# ⚠️ Pasta Supabase - DESABILITADA

## Status do Projeto

Este projeto **NÃO USA MAIS o Supabase Cloud**.

Toda a infraestrutura foi migrada para o **Kubernetes interno**:
- **Autenticação**: Backend Node.js com JWT
- **Banco de Dados**: PostgreSQL StatefulSet no cluster
- **API**: Backend Express interno

## O Que Há Nesta Pasta?

### `config.toml`
- **Status**: Desabilitado (comentado)
- **Propósito**: Histórico de configuração do Supabase Cloud
- **Ação**: NÃO É MAIS USADO

### `migrations/`
- **Status**: Apenas para referência
- **Propósito**: Histórico do schema do banco de dados
- **Ação**: Migrações NÃO são aplicadas automaticamente
- **Nota**: O schema real está em `k8s/06-init-db.sql`

## Banco de Dados Atual

```yaml
Host: postgres.ms-frontend-picpay-monitor.svc.cluster.local
Port: 5432
Database: aws_resource_db
User: postgres
Password: Primeiroacesso_2022
```

## Arquitetura

Consulte [`ARQUITETURA_INTERNA_KUBERNETES.md`](../ARQUITETURA_INTERNA_KUBERNETES.md) para:
- Fluxo de autenticação
- Estrutura do banco de dados
- Deploy no Kubernetes
- Troubleshooting

## Se Você Quiser Remover Esta Pasta

Esta pasta pode ser removida com segurança, pois:
- O `config.toml` está desabilitado
- As migrations são apenas histórico
- O projeto não depende mais do Supabase Cloud

**IMPORTANTE**: Se você remover esta pasta, atualize também:
- `src/integrations/supabase/types.ts` (remover ou manter apenas para compatibilidade de tipos)
- Qualquer referência a `supabase/` no código

## Migração Completa

A migração do Supabase Cloud para Kubernetes interno está **100% concluída**.

Nenhum dado ou autenticação passa mais pelo Supabase Cloud.

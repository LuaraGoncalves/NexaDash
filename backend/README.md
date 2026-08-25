# NexaDash Backend

API REST do NexaDash, responsavel por autenticacao, regras de negocio e persistencia dos modulos do CRM.

## Tecnologias

- Laravel 12
- PHP 8.2+
- PostgreSQL

## Modulos da API

- Auth
- Dashboard
- Leads e mensagens
- Vendas
- Clientes
- Produtos, categorias, fornecedores e unidades
- Estoque e movimentacoes
- Financeiro
- Usuarios e auditoria

## Como rodar

```powershell
cd C:\NexaDash\backend
composer install
php artisan key:generate
php artisan migrate
php artisan db:seed
php artisan serve --host=127.0.0.1 --port=8000
```

API local:

- `http://127.0.0.1:8000/api`

## Contas locais

- Admin: `admin@nexadash.local` / `password`
- Gerente: `gerente@nexadash.local` / `password`
- Financeiro: `financeiro@nexadash.local` / `password`
- Caixa: `caixa@nexadash.local` / `password`

O seed mantém o banco limpo para uso real: ele cria apenas estas contas e dados-base de referência. Leads, clientes, produtos, vendas, estoque e financeiro começam vazios.

## Testes

Os testes automatizados usam um banco PostgreSQL separado:

- `nexadash_test`

Rodar testes:

```powershell
cd C:\NexaDash\backend
php artisan test
```

## Arquivos importantes

- `routes/api.php`: contratos da API
- `app/Http/Controllers`: regras por modulo
- `app/Models`: entidades e relacionamentos
- `database/migrations`: estrutura do banco
- `database/seeders`: contas locais e dados-base de referência

# NexaDash

CRM + gestao comercial leve com PDV, financeiro, leads, clientes, produtos, usuarios e auditoria.

Projeto desenvolvido para portfolio, com foco em arquitetura full-stack, regras de negocio reais e execucao local. Nao ha deploy publico propositalmente.

## Resumo

O NexaDash foi pensado como um sistema de operacao comercial de ponta a ponta:

- captura e acompanhamento de leads
- cadastro de clientes
- vendas e PDV
- produtos e estoque
- financeiro
- usuarios, cargos e auditoria

Cada perfil entra em uma experiencia diferente:

- `admin`: sistema completo
- `manager`: painel comercial
- `finance`: painel focado em financeiro
- `employee`: fluxo rapido de PDV e leads

O projeto esta organizado como um monorepo simples:

- `backend/`: API Laravel
- `frontend/`: aplicacao React + Vite

## Arquitetura

```text
NexaDash
|-- backend/   API REST em Laravel
|   |-- app/Http/Controllers   entrada das requisicoes por modulo
|   |-- app/Http/Middleware    autenticacao, cargos e permissoes
|   |-- app/Models             entidades do dominio
|   |-- app/Services           regras de negocio compartilhadas
|   |-- database/migrations    estrutura do banco PostgreSQL
|   `-- routes/api.php         rotas da API
`-- frontend/  interface React
    |-- src/pages              telas principais
    |-- src/layouts            layouts por perfil de usuario
    |-- src/services           comunicacao com a API
    |-- src/context            autenticacao e feedback visual
    `-- src/components         componentes reutilizaveis
```

Fluxo principal:

1. O usuario entra pelo frontend React.
2. O frontend chama a API Laravel usando Bearer Token.
3. O backend valida autenticacao, cargo e permissoes.
4. As regras de negocio gravam e consultam dados no PostgreSQL.
5. A auditoria registra acoes importantes do sistema.

## Modulos atuais

- Dashboard
- Vendas / PDV
- Produtos e estoque
- Clientes
- Leads e mensagens
- Financeiro
- Usuarios e acessos
- Auditoria

## Diferenciais do projeto

- API real em Laravel com persistencia em PostgreSQL
- Frontend React + TypeScript com rotas separadas por cargo
- PDV simplificado para operacao de caixa
- Conversa de leads ligada ao backend
- Auditoria real das acoes principais
- Autenticacao com token salvo em hash, expiracao e limite de tentativas de login
- Testes automatizados no backend e frontend
- Build com code splitting para melhorar carregamento

## Tecnologias

- Backend: Laravel 12, PHP 8.4+, PostgreSQL
- Frontend: React 19, TypeScript, Vite, Tailwind CSS

## Pre-requisitos

- PHP 8.4+
- Composer
- Node.js 24+
- npm
- PostgreSQL

## Como rodar localmente

### 1. Backend

```powershell
cd C:\NexaDash\backend
composer install
copy .env.example .env
php artisan key:generate
php artisan migrate
php artisan db:seed
php artisan serve --host=127.0.0.1 --port=8000
```

Antes de rodar as migrations, confira no arquivo `backend/.env` se o banco PostgreSQL existe e se `DB_DATABASE`, `DB_USERNAME` e `DB_PASSWORD` estao corretos para a sua maquina.

### 2. Frontend

```powershell
cd C:\NexaDash\frontend
npm install
copy .env.example .env
npm run dev
```

## Enderecos locais

- Frontend: `http://127.0.0.1:5173`
- Backend API: `http://127.0.0.1:8000/api`

## Contas locais

- Admin: `admin@nexadash.local` / `password`
- Gerente: `gerente@nexadash.local` / `password`
- Financeiro: `financeiro@nexadash.local` / `password`
- Caixa: `caixa@nexadash.local` / `password`

O seed cria apenas estas contas e dados-base de referência, como categorias e unidades. Leads, clientes, produtos, vendas, movimentações e lançamentos financeiros nascem vazios para evitar dados fictícios misturados ao uso real.

## Regras de acesso

- `admin`: acesso total
- `manager`: dashboard, vendas, clientes, produtos e leads
- `finance`: dashboard e financeiro
- `employee`: fluxo rapido de PDV e leads

## Testes

Os testes usam um banco PostgreSQL separado:

- Banco de testes: `nexadash_test`

Para rodar:

```powershell
cd C:\NexaDash\backend
php artisan test
```

Frontend:

```powershell
cd C:\NexaDash\frontend
npm test
```

## CI/CD

O projeto possui GitHub Actions em `.github/workflows/ci.yml`.

A cada push em `main` ou `finalizacao-projeto`, e a cada pull request para `main`, o GitHub executa:

- Backend: `vendor/bin/pint --test` e `php artisan test`
- Frontend: `npm run lint`, `npm test` e `npm run build`

## Checklist de validação

Para validar no navegador e mostrar o projeto em portfolio, estes sao os caminhos mais fortes:

1. Entrar como `admin` e mostrar dashboard, vendas, clientes, financeiro, usuarios e auditoria.
2. Entrar como `caixa` e mostrar o fluxo rapido de PDV + leads.
3. Entrar como `financeiro` e mostrar a experiencia separada de fluxo de caixa.
4. Criar uma venda, editar a venda, dar baixa em um lançamento e conferir o log na auditoria.

## Estrutura rapida

- [backend/routes/api.php](backend/routes/api.php): rotas da API
- [backend/app/Http/Controllers](backend/app/Http/Controllers): regras do backend
- [backend/app/Services](backend/app/Services): regras de negócio compartilhadas
- [backend/app/Models](backend/app/Models): entidades
- [frontend/src/pages](frontend/src/pages): telas
- [frontend/src/services](frontend/src/services): comunicacao com a API

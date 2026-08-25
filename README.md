# NexaDash

CRM + gestao comercial leve com PDV, financeiro, leads, clientes, produtos, usuarios e auditoria.

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
- Testes automatizados no backend e frontend
- Build com code splitting para melhorar carregamento

## Tecnologias

- Backend: Laravel 12, PHP 8.2+, PostgreSQL
- Frontend: React 19, TypeScript, Vite, Tailwind CSS

## Como rodar localmente

### 1. Backend

```powershell
cd C:\NexaDash\backend
composer install
php artisan key:generate
php artisan migrate
php artisan db:seed
php artisan serve --host=127.0.0.1 --port=8000
```

### 2. Frontend

```powershell
cd C:\NexaDash\frontend
npm install
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

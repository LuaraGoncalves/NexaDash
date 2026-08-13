# NexaDash

CRM com foco em operacao comercial leve, PDV e financeiro.

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

## Contas seed

- Admin: `admin@nexadash.local` / `password`
- Gerente: `gerente@nexadash.local` / `password`
- Financeiro: `financeiro@nexadash.local` / `password`
- Caixa: `caixa@nexadash.local` / `password`

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

## Estrutura rapida

- [backend/routes/api.php](/C:/NexaDash/backend/routes/api.php): rotas da API
- [backend/app/Http/Controllers](/C:/NexaDash/backend/app/Http/Controllers): regras do backend
- [backend/app/Models](/C:/NexaDash/backend/app/Models): entidades
- [frontend/src/pages](/C:/NexaDash/frontend/src/pages): telas
- [frontend/src/services](/C:/NexaDash/frontend/src/services): comunicacao com a API

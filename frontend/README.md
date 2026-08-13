# NexaDash Frontend

Interface web do NexaDash, focada em CRM, PDV, financeiro e operacao comercial.

## Tecnologias

- React 19
- TypeScript
- Vite
- Tailwind CSS

## Como rodar

```powershell
cd C:\NexaDash\frontend
npm install
npm run dev
```

Aplicacao local:

- `http://127.0.0.1:5173`

## Perfis e experiencia

- `admin`: painel completo
- `manager`: painel comercial
- `finance`: dashboard + financeiro
- `employee`: shell rapido com PDV e leads

## Estrutura

- `src/pages`: telas por modulo
- `src/services`: chamadas da API
- `src/context`: autenticacao e toasts
- `src/components`: componentes reutilizaveis
- `src/layouts`: cascas por perfil

## Comandos uteis

```powershell
npm run dev
npm run build
npx eslint src --ext .ts,.tsx
```

## Dependencia de API

Por padrao o frontend usa:

- `http://127.0.0.1:8000/api`

Se quiser trocar, use `VITE_API_URL`.

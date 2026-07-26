# Refeno Manager

Monorepo com formulário de inspeção de embarcações.

## Estrutura

- `apps/web` — Next.js (formulário)
- `apps/api` — API Node.js/Express em TypeScript (MVC + Prisma)

## Pré-requisitos

- Node.js 20+
- Docker (para MySQL) **ou** MySQL local na porta 3306

## Configuração

```bash
npm install
cp .env.example apps/api/.env
```

Crie `apps/web/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:3333
```

## Banco de dados

Com Docker:

```bash
npm run db:up
npm run db:migrate
```

Sem Docker, com MySQL local:

```bash
cd apps/api
npx prisma migrate deploy
```

## Desenvolvimento

Subir tudo com um comando:

```bash
chmod +x run.sh
./run.sh
```

Modos opcionais: `./run.sh docker` ou `./run.sh local`

Ou apenas Docker: `./rundocker.sh`

```bash
npm run dev
```

- Frontend: http://localhost:3000
- API: http://localhost:3333
- Health check: http://localhost:3333/api/health

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/health` | Status da API |
| POST | `/api/inspections` | Criar inspeção |

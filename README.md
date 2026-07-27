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
cp .env.example .env
```

Os scripts `db.sh`, `dev.sh` e `run.sh` também criam `apps/api/.env` e `apps/web/.env.local` automaticamente se não existirem.

Variáveis principais (arquivo `.env` na raiz — usado pelo Docker Compose):

| Variável | Uso |
|----------|-----|
| `MYSQL_*` | Credenciais do banco nos containers |
| `JWT_SECRET` | Tokens de autenticação da API |
| `FRONTEND_URL` | Origem permitida no CORS |
| `NEXT_PUBLIC_API_URL` | URL da API no build do front (Docker) |
| `SEED_ADMIN_*` | Login/senha do admin inicial |

Em produção, altere senhas e URLs antes do deploy.

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

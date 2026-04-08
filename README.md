# Vouch

Vouch is an AI-assisted fact-checking and analysis product in a pnpm monorepo.

## Apps And Packages

- `apps/web` - Next.js web app (auth, dashboard, detail, share)
- `apps/api` - Hono API (JWT auth, Prisma, AI routes, OTP, Google login)
- `apps/extension` - Chrome extension (shared SDK auth + API)
- `packages/types` - shared API/domain types
- `packages/sdk` - shared API client/token helpers

## Auth And API

Auth endpoints:
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/google`
- `POST /auth/otp/request`
- `POST /auth/otp/verify`
- `POST /auth/extension/link-code` (authenticated)
- `POST /auth/extension/link-code/exchange`
- `POST /auth/demo-login`
- `POST /auth/refresh`
- `GET /auth/me`
- `POST /auth/logout`

Dashboard and share:
- `GET /dashboard/history`
- `POST /dashboard/analysis`
- `GET /dashboard/analysis/:id`
- `POST /dashboard/analysis/:id/share`
- `GET /public/analysis/:shareId`

AI routes (authenticated):
- `POST /verify`
- `POST /analyze`
- `POST /chat`

Response format (JSON endpoints):
- success: `{ status, message, data }`
- error: `{ status, message, error }`

## Local Setup

1) Create env files from examples:
- root: `.env.example`
- web: `apps/web/.env.local.example`
- extension: `apps/extension/.env.example`

2) Install and prepare DB:

```bash
pnpm install
pnpm --filter @vouch/api prisma:generate
pnpm --filter @vouch/api prisma:push
```

3) Run services:

```bash
pnpm --filter @vouch/api dev
pnpm --filter @vouch/web dev
pnpm --filter @vouch/extension dev
```

## Docker

Compose setup is ready at `docker-compose.yml`.

Build and run:

```bash
docker compose build
docker compose up -d
```

Images:
- `talhadevelopes/vouch-web:${TAG:-latest}`
- `talhadevelopes/vouch-server:${TAG:-latest}`

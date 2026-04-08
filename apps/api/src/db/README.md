# Database Layer (Prisma)

This folder now uses Prisma as the only ORM/database path.

Files:
- `prisma/schema.prisma` - DB models
- `src/db/prisma.ts` - Prisma client instance

Setup flow:
1. Ensure `DATABASE_URL` is set.
2. Run `pnpm --filter @vouch/api prisma:generate`
3. Run `pnpm --filter @vouch/api prisma:push`

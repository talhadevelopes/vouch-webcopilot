FROM node:20-alpine

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.8.1 --activate

COPY package.json pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/sdk/package.json packages/sdk/package.json

RUN pnpm install --filter @vouch/web... --no-frozen-lockfile

COPY apps/web ./apps/web
COPY packages ./packages

ARG NEXT_PUBLIC_API_URL=http://localhost:8787
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID=
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=${NEXT_PUBLIC_GOOGLE_CLIENT_ID}

RUN pnpm --filter @vouch/web build

EXPOSE 3000

CMD ["pnpm", "--filter", "@vouch/web", "start"]

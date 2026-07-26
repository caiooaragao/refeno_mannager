FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci

FROM deps AS builder
COPY apps/api apps/api
COPY apps/web apps/web
RUN npm run db:generate -w apps/api
RUN npm run build -w apps/api
ENV NEXT_PUBLIC_API_URL=http://localhost:3333
RUN npm run build -w apps/web

FROM base AS api
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
WORKDIR /app/apps/api
EXPOSE 3333
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && node dist/index.js"]

FROM base AS web
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/next.config.js ./apps/web/
WORKDIR /app/apps/web
EXPOSE 3000
CMD ["npm", "run", "start"]

# Build context: root repositori.
#   docker build -f services/api/Dockerfile -t placetogo-api .
FROM node:22-slim AS build
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable && corepack prepare pnpm@10.34.5 --activate
WORKDIR /repo
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc tsconfig.base.json ./
COPY packages/shared packages/shared
COPY services/api services/api
RUN pnpm install --frozen-lockfile --filter @placetogo/api...
RUN pnpm --filter @placetogo/shared build && pnpm --filter @placetogo/api build
RUN pnpm --filter @placetogo/api deploy --legacy --prod /out

FROM node:22-slim AS runtime
ENV NODE_ENV=production PORT=8080
WORKDIR /app
COPY --from=build --chown=node:node /out ./
# Proses berjalan sebagai pengguna non-root bawaan image (uid 1000).
USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/server.js"]

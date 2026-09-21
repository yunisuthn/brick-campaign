# syntax=docker/dockerfile:1

# One image holds the API and the front it serves (reference document, section 10.2).
#
# Two stages come out of it. `runtime` serves, and carries no build tool: the prisma CLI alone
# drags in Studio, an embedded postgres and typescript, some 160 MB that have no business on a
# server. `build` keeps them, and the compose file runs the migrations from that stage before
# the serving one starts.

FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /repo

# Manifests first: the install layer is rebuilt only when a dependency changes.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/contracts/package.json packages/contracts/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile

COPY . .
# The generated client is gitignored; the build imports it.
RUN pnpm --filter api exec prisma generate && pnpm build

# The migrations run from the stage above, which still has the prisma CLI. What serves does
# not need it, so the tools are dropped on the way out.
FROM build AS pruned
RUN pnpm prune --prod

FROM node:22-alpine AS runtime
RUN corepack enable
WORKDIR /repo
ENV NODE_ENV=production
# The front is served by the API from here, on the same origin.
ENV WEB_ROOT=/repo/apps/web/dist

COPY --from=pruned /repo/node_modules ./node_modules
COPY --from=pruned /repo/package.json /repo/pnpm-lock.yaml /repo/pnpm-workspace.yaml ./
COPY --from=pruned /repo/packages/contracts/package.json ./packages/contracts/
COPY --from=pruned /repo/packages/contracts/dist ./packages/contracts/dist
COPY --from=pruned /repo/packages/contracts/node_modules ./packages/contracts/node_modules
COPY --from=pruned /repo/apps/api/package.json ./apps/api/
COPY --from=pruned /repo/apps/api/node_modules ./apps/api/node_modules
COPY --from=pruned /repo/apps/api/dist ./apps/api/dist
COPY --from=pruned /repo/apps/api/prisma ./apps/api/prisma
COPY --from=pruned /repo/apps/web/dist ./apps/web/dist

USER node
EXPOSE 3000
CMD ["node", "apps/api/dist/main.js"]

# For hosts that build the last stage and give no way to run a step before the server (Render's
# free plan): migrate, create the account named by SEED_USER_EMAIL/SEED_USER_PASSWORD if both
# are set (an existing one is left alone), then serve. It keeps the build tools, so it is
# heavier than `runtime`; compose names its targets and is not affected.
FROM build AS hosted
ENV NODE_ENV=production
ENV WEB_ROOT=/repo/apps/web/dist
EXPOSE 3000
CMD ["sh", "-c", "pnpm --filter api exec prisma migrate deploy && { [ -z \"$SEED_USER_EMAIL\" ] || pnpm --filter api create-user || true; } && exec node apps/api/dist/main.js"]

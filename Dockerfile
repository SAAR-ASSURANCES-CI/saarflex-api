# --- Base Layer ---
# Using node-alpine for a smaller security footprint
FROM node:20-alpine AS base

# Configure PNPM environment
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# --- Dependencies Layer ---
# Install all dependencies
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# --- Build Layer ---
# Compiles TypeScript and prunes development dependencies
FROM deps AS build
COPY . .
RUN pnpm build
RUN pnpm prune --prod

# --- Development Environment ---
FROM base AS development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["pnpm", "run", "start:dev"]

# --- Production Environment ---
FROM base AS production

# Security: Run application as non-privileged user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001 -G nodejs

# Selective copy from build stage for minimal image size
COPY --from=build --chown=nodeuser:nodejs /app/dist ./dist
COPY --from=build --chown=nodeuser:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nodeuser:nodejs /app/package.json ./package.json

USER nodeuser

# Application runtime configuration
ENV PORT=3000
EXPOSE 3000

# Start NestJS application
CMD ["node", "dist/main.js"]
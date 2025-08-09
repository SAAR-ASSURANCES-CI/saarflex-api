FROM node:20-alpine AS base

RUN apk add --no-cache \
    curl \
    bash \
    wget \
    && wget -O dockerize.tar.gz https://github.com/jwilder/dockerize/releases/download/v0.7.0/dockerize-linux-amd64-v0.7.0.tar.gz \
    && tar -C /usr/local/bin -xzvf dockerize.tar.gz \
    && rm dockerize.tar.gz \
    && rm -rf /var/cache/apk/*

# Activation de pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Étape de développement
FROM base AS development

# Copie des fichiers de dépendances
COPY package.json pnpm-lock.yaml ./

# Installation des dépendances
RUN pnpm install --frozen-lockfile

# Copie du code source
COPY . .

# Port d'exposition
EXPOSE 3000

CMD ["pnpm", "run", "start:dev"]

# Étape de production
FROM base AS production

# Copie des fichiers de dépendances
COPY package.json pnpm-lock.yaml ./

# Installation des dépendances de production uniquement
RUN pnpm install --frozen-lockfile --prod

# Copie du code source et build
COPY . .
RUN pnpm build

# Nettoyage
RUN rm -rf src/ node_modules/.cache && \
    pnpm store prune


RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001 -G nodejs


RUN chown -R nodeuser:nodejs /app
USER nodeuser

EXPOSE 3000

CMD ["node", "dist/main.js"]
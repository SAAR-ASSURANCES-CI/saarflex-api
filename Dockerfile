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

# Créer un utilisateur non-root 
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001 -G nodejs

WORKDIR /app

# Étape de développement
FROM base AS development

# Copie des fichiers de dépendances
COPY package.json pnpm-lock.yaml ./

# Installation des dépendances
RUN pnpm install --frozen-lockfile

# Créer les dossiers nécessaires avec les bonnes permissions
RUN mkdir -p /app/dist && \
    chown -R nodeuser:nodejs /app

# Copie du code source avec les bonnes permissions pour watch
COPY --chown=nodeuser:nodejs . .

# S'assurer que l'utilisateur peut écrire dans /app
RUN chown -R nodeuser:nodejs /app

# Basculer vers l'utilisateur non-root
USER nodeuser

# Port d'exposition
EXPOSE 3000

CMD ["pnpm", "run", "start:dev"]

# Étape de production
FROM base AS production

# Copie des fichiers de dépendances
COPY package.json pnpm-lock.yaml ./

# Installation de toutes les dépendances (dev + prod) pour le build
RUN pnpm install --frozen-lockfile

# Copie du code source avec les bonnes permissions
COPY --chown=nodeuser:nodejs . .

# Build de l'application
RUN pnpm build

# Nettoyage : supprimer les dépendances de dev et le code source
RUN pnpm prune --prod && \
    rm -rf src/ node_modules/.cache tsconfig*.json nest-cli.json && \
    pnpm store prune

# S'assurer que l'utilisateur peut écrire dans /app
RUN chown -R nodeuser:nodejs /app
USER nodeuser

# Port d'exposition (configurable via PORT env var, par défaut 3004 en prod)
EXPOSE 3004

CMD ["node", "dist/main.js"]
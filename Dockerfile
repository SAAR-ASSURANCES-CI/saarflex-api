FROM node:20-alpine

# Installation de netcat pour le script wait-for-mysql
RUN apk add --no-cache netcat-openbsd

WORKDIR /app

# Activation de pnpm via corepack
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

# Copie des fichiers de dépendances
COPY package.json pnpm-lock.yaml ./

# Installation des dépendances
RUN pnpm install --frozen-lockfile

# Copie du reste du code
COPY . .

# Build de l'application
RUN pnpm build

# Rendre le script exécutable
RUN chmod +x wait-for-mysql.sh

EXPOSE 3000
CMD ["node", "dist/main.js"]
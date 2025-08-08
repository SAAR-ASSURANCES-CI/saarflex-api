FROM node:20-alpine

WORKDIR /app

# Activation de pnpm via corepack
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

# Installation des dépendances
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copie du reste du code et build
COPY . .
RUN pnpm build

EXPOSE 3000
CMD ["node", "dist/main.js"]

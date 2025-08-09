#!/bin/sh

DB_HOST=${DB_HOST:-users-db}
DB_PORT=${DB_PORT:-3306}

echo "En attente de MySQL sur $DB_HOST:$DB_PORT..."

while ! nc -z "$DB_HOST" "$DB_PORT"; do
  echo "MySQL n'est pas encore prêt, attente..."
  sleep 1
done

echo "MySQL est prêt, démarrage de l'application..."

if [ ! -d "node_modules" ]; then
  echo "Installation des dépendances..."
  pnpm install --frozen-lockfile
fi

echo "Démarrage de l'application en mode développement..."
exec pnpm run start:dev
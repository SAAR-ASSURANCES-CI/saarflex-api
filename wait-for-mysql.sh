#!/bin/sh
echo "En attente de MySQL sur le port $DB_PORT..."

while ! nc -z "$DB_HOST" "$DB_PORT"; do
  sleep 1
done

echo "MySQL est prêt, démarrage de l'application..."

if [ ! -d "node_modules" ]; then
  pnpm install --frozen-lockfile
fi

pnpm run start:dev

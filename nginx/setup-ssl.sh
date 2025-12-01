#!/bin/bash

# Script pour configurer les certificats SSL avec Let's Encrypt
# Usage: ./nginx/setup-ssl.sh

set -e

DOMAIN="api-saarflex.saarassurancesci.com"
EMAIL="admin@saarassurancesci.com"  # Modifiez avec votre email

echo "🔐 Configuration SSL pour $DOMAIN"
echo ""

# Créer le répertoire pour les challenges Let's Encrypt
echo "📁 Création du répertoire pour les challenges..."
mkdir -p nginx/certbot/www

# Vérifier si les certificats existent déjà
if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    echo "✅ Les certificats existent déjà pour $DOMAIN"
    echo "Pour renouveler, utilisez: certbot renew"
    exit 0
fi

# Obtenir le certificat avec Certbot
echo "🔑 Obtention du certificat SSL avec Let's Encrypt..."
echo "⚠️  Assurez-vous que:"
echo "   1. Le domaine $DOMAIN pointe vers ce serveur"
echo "   2. Les ports 80 et 443 sont ouverts"
echo "   3. Nginx n'est pas encore démarré (ou utilisez --standalone)"
echo ""

read -p "Continuer? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# Méthode 1: Standalone (nécessite d'arrêter Nginx temporairement)
echo "🚀 Lancement de Certbot en mode standalone..."
docker run -it --rm \
    -p 80:80 \
    -p 443:443 \
    -v "$(pwd)/nginx/certbot/www:/var/www/certbot" \
    -v "/etc/letsencrypt:/etc/letsencrypt" \
    certbot/certbot certonly \
    --standalone \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d "$DOMAIN"

# Méthode 2: Webroot (nécessite que Nginx soit démarré avec la config)
# Décommentez cette section si vous préférez utiliser webroot
# echo "🚀 Lancement de Certbot en mode webroot..."
# docker run -it --rm \
#     -v "$(pwd)/nginx/certbot/www:/var/www/certbot" \
#     -v "/etc/letsencrypt:/etc/letsencrypt" \
#     certbot/certbot certonly \
#     --webroot \
#     --webroot-path=/var/www/certbot \
#     --email "$EMAIL" \
#     --agree-tos \
#     --no-eff-email \
#     -d "$DOMAIN"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Certificat SSL obtenu avec succès!"
    echo ""
    echo "📋 Prochaines étapes:"
    echo "   1. Vérifiez que les certificats sont bien présents:"
    echo "      ls -la /etc/letsencrypt/live/$DOMAIN/"
    echo ""
    echo "   2. Démarrez Nginx avec Docker Compose:"
    echo "      docker compose -f docker-compose.prod.yml up -d nginx"
    echo ""
    echo "   3. Testez l'accès HTTPS:"
    echo "      curl -I https://$DOMAIN/health"
    echo ""
    echo "   4. Configurez le renouvellement automatique (crontab):"
    echo "      0 0 * * * docker run --rm -v /etc/letsencrypt:/etc/letsencrypt certbot/certbot renew --quiet && docker restart saarflex-nginx-prod"
else
    echo ""
    echo "❌ Erreur lors de l'obtention du certificat"
    echo "Vérifiez les logs ci-dessus pour plus de détails"
    exit 1
fi


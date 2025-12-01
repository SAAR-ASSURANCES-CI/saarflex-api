#!/bin/bash
# Script pour générer un certificat SSL auto-signé temporaire
# ⚠️ À utiliser uniquement pour le développement/test
# Pour la production, utilisez Let's Encrypt avec Certbot

mkdir -p nginx/ssl

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/selfsigned.key \
  -out nginx/ssl/selfsigned.crt \
  -subj "/C=CI/ST=Abidjan/L=Abidjan/O=SaarAssurances/CN=api-saarflex.saarassurancesci.com"

echo "✅ Certificat SSL auto-signé généré dans nginx/ssl/"
echo "⚠️  Ce certificat n'est PAS sécurisé pour la production"
echo "⚠️  Utilisez Let's Encrypt pour la production"


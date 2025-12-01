# Configuration Nginx pour api-saarflex.saarassurancesci.com

## Fichiers de configuration

- `nginx.conf` : Configuration principale de Nginx
- `api-saarflex.conf` : Configuration spécifique pour le sous-domaine api-saarflex.saarassurancesci.com
- `docker-compose.nginx.yml` : Configuration Docker Compose pour Nginx avec SSL

## Installation et configuration

### 1. Prérequis

- Docker et Docker Compose installés
- Le domaine `api-saarflex.saarassurancesci.com` pointant vers votre serveur
- Ports 80 et 443 ouverts sur votre serveur

### 2. Configuration SSL avec Let's Encrypt (Recommandé)

#### Option A: Utiliser Certbot dans Docker

1. Créez le répertoire pour les challenges Let's Encrypt:
```bash
mkdir -p nginx/certbot/www
```

2. Lancez Certbot pour obtenir le certificat:
```bash
docker run -it --rm \
  -v $(pwd)/nginx/certbot/www:/var/www/certbot \
  -v /etc/letsencrypt:/etc/letsencrypt \
  certbot/certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email votre-email@saarassurancesci.com \
  --agree-tos \
  --no-eff-email \
  -d api-saarflex.saarassurancesci.com
```

#### Option B: Utiliser Certbot sur l'hôte

Si Certbot est installé directement sur le serveur:
```bash
certbot certonly --standalone -d api-saarflex.saarassurancesci.com
```

### 3. Configuration SSL avec certificat personnalisé

Si vous avez votre propre certificat SSL:

1. Créez le répertoire:
```bash
mkdir -p nginx/ssl
```

2. Placez vos certificats:
   - `nginx/ssl/api-saarflex.crt` : Certificat
   - `nginx/ssl/api-saarflex.key` : Clé privée

3. Modifiez `api-saarflex.conf` pour utiliser vos certificats:
```nginx
ssl_certificate /etc/nginx/ssl/api-saarflex.crt;
ssl_certificate_key /etc/nginx/ssl/api-saarflex.key;
```

### 4. Déploiement avec Docker Compose

#### Méthode 1: Intégrer dans docker-compose.prod.yml

Ajoutez la configuration nginx dans votre `docker-compose.prod.yml` existant en vous basant sur `docker-compose.nginx.yml`.

#### Méthode 2: Utiliser le fichier séparé

```bash
docker compose -f docker-compose.prod.yml -f nginx/docker-compose.nginx.yml up -d
```

### 5. Vérification

1. Vérifiez que Nginx démarre correctement:
```bash
docker logs saarflex-nginx-prod
```

2. Testez l'accès HTTPS:
```bash
curl -I https://api-saarflex.saarassurancesci.com/health
```

3. Vérifiez les certificats SSL:
```bash
openssl s_client -connect api-saarflex.saarassurancesci.com:443 -servername api-saarflex.saarassurancesci.com
```

## Renouvellement automatique des certificats Let's Encrypt

Les certificats Let's Encrypt expirent après 90 jours. Configurez un cron job pour le renouvellement automatique:

```bash
# Ajoutez cette ligne dans votre crontab (crontab -e)
0 0 * * * docker run --rm -v /etc/letsencrypt:/etc/letsencrypt -v $(pwd)/nginx/certbot/www:/var/www/certbot certbot/certbot renew --quiet && docker restart saarflex-nginx-prod
```

Ou utilisez un conteneur avec un scheduler intégré comme `certbot/dns-route53` ou configurez un service systemd.

## Configuration de l'API

Assurez-vous que votre fichier `.env.prod` contient:

```env
PORT=3004
NODE_ENV=production
ALLOWED_ORIGINS=https://api-saarflex.saarassurancesci.com,https://saarassurancesci.com
```

## Dépannage

### Erreur: "upstream not found"
- Vérifiez que le service `api` est bien démarré et accessible sur le réseau Docker
- Vérifiez le nom du service dans `docker-compose.prod.yml`

### Erreur: "certificate not found"
- Vérifiez que les certificats SSL sont bien montés dans le conteneur
- Vérifiez les chemins dans `api-saarflex.conf`

### Erreur: "502 Bad Gateway"
- Vérifiez que l'API écoute bien sur le port 3004
- Vérifiez les logs: `docker logs saarflex-api-prod`
- Vérifiez la connectivité réseau Docker

### Redirection en boucle
- Vérifiez que le port 443 est bien ouvert
- Vérifiez que les certificats SSL sont valides

## Notes importantes

- Les certificats Let's Encrypt sont stockés dans `/etc/letsencrypt` sur l'hôte
- Le répertoire `nginx/certbot/www` est utilisé pour les challenges HTTP-01 de Let's Encrypt
- La configuration utilise HTTP/2 pour de meilleures performances
- Les headers de sécurité sont configurés pour protéger contre les attaques courantes
- La taille maximale des uploads est fixée à 20MB (modifiable dans `api-saarflex.conf`)


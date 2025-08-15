## SAARFLEX API

API backend pour l'application d'assurances pour SAAR Assurances Côte d'Ivoire. Ce service expose des endpoints REST et des patterns microservices (Redis) pour l'authentification, la gestion de profil, les sessions et les notifications, etc.

Important — Propriété et confidentialité
- Ce dépôt est privé et appartient à SAAR Assurances Côte d'Ivoire.
- Tous droits réservés. Toute diffusion, copie ou usage non autorisé est strictement interdit.

### Pile technique
- NestJS 11 (Express)
- TypeORM 0.3 (MySQL 8)
- JWT (authentification)
- Redis (transport microservices)
- Nodemailer (email SMTP)
- Swagger (docs API en développement)
- Docker / Docker Compose

## Démarrage rapide

### Prérequis
- Node.js 20+
- PNPM (automatiquement activé dans l'image Docker via Corepack)
- Docker et Docker Compose

### Variables d'environnement (.env)
Créer un fichier `.env` à la racine avec, au minimum:

```
# App
PORT=3000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# JWT
JWT_SECRET=
JWT_EXPIRES_IN=

# Base de données
DB_HOST=
DB_PORT=3306
DB_USERNAME=
DB_PASSWORD=
DB_NAME=
DB_ROOT_PASSWORD=

# Redis
REDIS_HOST=
REDIS_PORT=
REDIS_PASSWORD=
REDIS_DB=0

# SMTP
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=no-reply@example.com
SMTP_PASS=change-me
```

### Lancement avec Docker (recommandé)
- Build et démarrage:
```
pnpm run docker:up
```
- Arrêt et nettoyage des volumes:
```
pnpm run docker:down
```
- Logs de l'API:
```
pnpm run docker:logs
```

Services exposés par docker-compose:
- API: `http://localhost:3000`
- MySQL: `localhost:3307` (mappé sur 3306 du conteneur)
- phpMyAdmin: `http://localhost:8080`
- Redis: `localhost:6379`

### Lancement en local (sans Docker)
```
pnpm install
pnpm run start:dev
```

## Scripts PNPM
- `pnpm run start` — démarre l'app
- `pnpm run start:dev` — démarre en watch
- `pnpm run build` — compile TypeScript vers `dist`
- `pnpm run start:prod` — démarre `dist/main`
- `pnpm run lint` — ESLint + fix
- `pnpm run test` — tests unitaires (Jest)
- `pnpm run test:e2e` — tests e2e
- `pnpm run migration:generate` — génère une migration TypeORM (via `data-source.ts`)
- `pnpm run migration:run` — exécute les migrations
- `pnpm run migration:revert` — revert migrations
- `pnpm run migration:show` — liste les migrations
- `pnpm run schema:drop` — drop du schéma (attention)
- `pnpm run db:console` — console MySQL dans le conteneur

## Architecture applicative

### Modules principaux
- `UsersModule` — endpoints REST et handlers microservices autour des utilisateurs, profils, sessions, notifications et OTP reset.
- `EmailModule` — envoi d'emails (bienvenue, OTP) via SMTP.
- `AppModule` — configuration globale (env, TypeORM, injection du `ValidationPipe`).

### Entités (TypeORM)
- `User`, `Profile`, `Session`, `Notification`, `PasswordReset`

### Stockage et migrations
- Connexion MySQL configurée via variables d'environnement.
- Migrations dans `src/migrations` (exécutées en prod depuis `dist/migrations`).

## API HTTP

Documentation Swagger (en développement uniquement): `http://localhost:3000/api`

Authentification: Bearer Token (header `Authorization: Bearer <token>`)

Endpoints principaux (contrôleur `users`):
- `POST /users/register` — inscription (retourne un JWT)
- `POST /users/login` — connexion (retourne un JWT)
- `POST /users/forgot-password` — envoi d'un code OTP (6 chiffres, 15 min)
- `POST /users/verify-otp` — vérification de l'OTP
- `POST /users/reset-password` — réinitialisation via OTP
- `GET /users/me` — récupérer mon profil (protégé par JWT)
- `PATCH /users/me` — mise à jour profil (protégé par JWT)

Exemple d'appel de connexion:
```
curl -X POST http://localhost:3000/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "mot_de_passe": "Password123!"
  }'
```

## Patterns microservices (Redis)

Le service se connecte à Redis comme transport microservices et expose des `MessagePattern` depuis `UsersController`:
- `user.login` — payload: `{ loginDto, ipAddress?, userAgent? }`
- `user.register` — payload: `{ registerDto, ipAddress?, userAgent? }`
- `user.findById` — payload: `userId: string`
- `user.findByEmail` — payload: `email: string`
- `user.updateLastLogin` — payload: `userId: string`
- `user.invalidateSession` — payload: `sessionId: string`
- `user.invalidateAllUserSessions` — payload: `userId: string`
- `user.emailExists` — payload: `email: string`

La configuration microservice est faite au bootstrap et utilise `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_DB`.

## Emails

Le module `EmailService` utilise les variables SMTP pour envoyer:
- Email de bienvenue après inscription
- Code OTP de réinitialisation de mot de passe

Assurez-vous que `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` sont valides. En dev, la vérification SMTP loggue le résultat au démarrage.

## Sécurité et bonnes pratiques
- CORS: la liste `ALLOWED_ORIGINS` est lue depuis l'environnement.
- Validation: `ValidationPipe` avec `whitelist`, `forbidNonWhitelisted`, `transform` activés.
- Mots de passe: hashés via `bcrypt` (12 rounds).
- JWT: signé avec `JWT_SECRET`, expiration par défaut `24h`.
- Sessions: persistées en base, invalidées lors des resets de mot de passe.

## Déploiement

### Image Docker
- `Dockerfile` multi-étapes (development / production)
- Production: build TypeScript, prune du store PNPM, exécution en user non-root

### Variables clés en prod
- `NODE_ENV=production` désactive Swagger par défaut et les messages d'erreur détaillés.
- Fournir un `JWT_SECRET` robuste et des identifiants DB/SMTP/Redis sécurisés.

## Dépannage
- L'API ne devient pas `healthy` dans Compose: implémentez `GET /health` (via `@nestjs/terminus`) ou modifiez le `healthcheck` de `api`.
- Erreurs SMTP au démarrage: vérifier `SMTP_HOST/PORT/USER/PASS`; la vérification est logguée par `EmailService`.
- Migrations: en dev, exécuter `pnpm run migration:run` après démarrage des conteneurs.

## Mentions légales
Ce logiciel et sa documentation sont la propriété de SAAR Assurances Côte d'Ivoire. Toute reproduction ou utilisation non autorisée est interdite. Aucune licence open-source n'est accordée; l'usage est strictement interne.

# Guide Docker - Evenza

Ce guide explique comment utiliser Docker pour exécuter l'application Evenza.

## Prérequis

- Docker installé sur votre machine
- Docker Compose installé (généralement inclus avec Docker Desktop)

## Structure

L'application est composée de 3 services Docker :
- **mongodb** : Base de données MongoDB
- **backend** : API NestJS (port 3000)
- **frontend** : Application Next.js (port 3001)

## Démarrage rapide

### 1. Configuration des variables d'environnement

Créez un fichier `.env` à la racine du projet en copiant `.env.example` :

```bash
cp .env.example .env
```

Modifiez les valeurs dans `.env` selon vos besoins, notamment le `JWT_SECRET`.

### 2. Construction et démarrage des conteneurs

```bash
# Construire et démarrer tous les services
docker-compose up --build

# Ou en arrière-plan
docker-compose up -d --build
```

### 3. Accéder à l'application

- **Frontend** : http://localhost:3001
- **Backend API** : http://localhost:3000
- **MongoDB** : localhost:27017

## Commandes utiles

### Arrêter les conteneurs

```bash
docker-compose down
```

### Arrêter et supprimer les volumes (⚠️ supprime les données)

```bash
docker-compose down -v
```

### Voir les logs

```bash
# Tous les services
docker-compose logs -f

# Un service spécifique
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb
```

### Reconstruire un service spécifique

```bash
docker-compose build backend
docker-compose up -d backend
```

### Exécuter des commandes dans un conteneur

```bash
# Accéder au shell du backend
docker-compose exec backend sh

# Exécuter le seeder dans le backend
docker-compose exec backend npm run seed
```

## Développement avec Docker

Pour le développement, vous pouvez monter les volumes locaux pour avoir le hot-reload :

Les volumes sont déjà configurés dans `docker-compose.yml` pour :
- `/app` : Code source (monté depuis le répertoire local)
- `/app/node_modules` : Modules npm (volume anonyme pour éviter les conflits)

## Production

Pour la production, vous devriez :

1. Modifier les variables d'environnement dans `.env`
2. Utiliser des secrets sécurisés pour `JWT_SECRET`
3. Configurer correctement `FRONTEND_URL` et `NEXT_PUBLIC_API_URL`
4. Utiliser un reverse proxy (nginx, traefik) devant les services
5. Configurer des volumes persistants pour MongoDB

## Dépannage

### Les conteneurs ne démarrent pas

Vérifiez les logs :
```bash
docker-compose logs
```

### Port déjà utilisé

Si les ports 3000, 3001 ou 27017 sont déjà utilisés, modifiez les ports dans `docker-compose.yml` :

```yaml
ports:
  - "3002:3000"  # Au lieu de "3000:3000"
```

### Problèmes de connexion MongoDB

Assurez-vous que le service `mongodb` est démarré avant le `backend`. Le `depends_on` dans docker-compose devrait gérer cela automatiquement.

### Rebuild complet

Si vous rencontrez des problèmes, essayez un rebuild complet :

```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

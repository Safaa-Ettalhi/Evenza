# Documentation des Tests - Backend Evenza

Cette documentation décrit la stratégie de tests, l'organisation des fichiers et les commandes pour exécuter les tests du backend.

---

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Prérequis](#prérequis)
3. [Commandes de test](#commandes-de-test)
4. [Tests unitaires](#tests-unitaires)
5. [Tests E2E](#tests-e2e)
6. [Structure des fichiers](#structure-des-fichiers)
7. [Référence JIRA](#référence-jira)
8. [Dépannage](#dépannage)

---

## Vue d'ensemble

Le backend Evenza dispose de deux types de tests :

| Type | Nombre | Fichiers | Framework |
|------|--------|----------|-----------|
| **Tests unitaires** | 30 | `*.spec.ts` | Jest |
| **Tests E2E** | 36 | `*.e2e-spec.ts` | Jest + Supertest |

**Total : 66 tests**

---

## Prérequis

### Pour les tests unitaires
- Node.js 18+
- Aucune base de données requise (mocks utilisés)

### Pour les tests E2E
- Node.js 18+
- **MongoDB** en cours d'exécution (localhost:27017 ou via Docker)
- **Données de test** : exécuter le seeder avant les tests E2E

```bash
# Démarrer MongoDB (Docker)
docker-compose up -d mongodb

# Ou si MongoDB est installé localement, assurez-vous qu'il tourne sur le port 27017

# Exécuter le seeder pour créer les comptes admin et participant
npm run seed
```

**Comptes créés par le seeder :**
- Admin : `admin@evenza.com` / `admin123`
- Participant : `participant@evenza.com` / `participant123`

---

## Commandes de test

### Tous les tests unitaires
```bash
cd backend
npm test
```

### Tous les tests E2E
```bash
cd backend
npm run test:e2e
```

### Tests avec couverture de code
```bash
npm run test:cov
```
Génère un rapport dans `backend/coverage/`

### Mode watch (développement)
```bash
npm run test:watch
```
Relance les tests à chaque modification de fichier.

### Tests d'un fichier spécifique
```bash
# Tests unitaires
npm test -- auth.service.spec.ts
npm test -- events.service.spec.ts
npm test -- reservations.service.spec.ts

# Tests E2E
npm run test:e2e -- test/auth.e2e-spec.ts
npm run test:e2e -- test/events.e2e-spec.ts
npm run test:e2e -- test/reservations.e2e-spec.ts
```

### Tests avec un pattern
```bash
npm test -- --testNamePattern="devrait créer"
npm run test:e2e -- --testNamePattern="login"
```

---

## Tests unitaires

Les tests unitaires mockent les dépendances (Mongoose, services externes) et testent la logique métier en isolation.

### AuthService (`src/auth/auth.service.spec.ts`)

| Test | Description |
|------|-------------|
| Inscription | Création d'un utilisateur avec mot de passe hashé (bcrypt) |
| Email existant | Exception Conflict si l'email est déjà utilisé |
| Login succès | Retourne un token JWT pour des identifiants valides |
| Utilisateur inexistant | Exception Unauthorized si l'email n'existe pas |
| Mot de passe incorrect | Exception Unauthorized si le mot de passe est faux |

### EventsService (`src/events/events.service.spec.ts`)

| Test | Description |
|------|-------------|
| create (DRAFT) | Création avec statut DRAFT par défaut |
| create (PUBLISHED) | Création avec statut spécifié |
| findAll | Retourne tous les événements triés par date |
| findAll (filtre) | Filtre par statut si fourni |
| findPublished | Retourne uniquement les événements PUBLISHED |
| findOne | Retourne un événement par ID |
| findOne (404) | Exception si l'événement n'existe pas |
| update | Mise à jour avec conversion de la date |
| update (404) | Exception si l'événement n'existe pas |
| publish | Change le statut en PUBLISHED |
| publish (404) | Exception si l'événement n'existe pas |
| cancel | Change le statut en CANCELED |
| cancel (404) | Exception si l'événement n'existe pas |

### ReservationsService (`src/reservations/reservations.service.spec.ts`)

| Test | Description |
|------|-------------|
| create | Création pour événement publié avec capacité disponible |
| create (non publié) | Exception si l'événement n'est pas PUBLISHED |
| create (complet) | Exception si la capacité est atteinte |
| create (doublon) | Exception si une réservation existe déjà |
| confirm | Confirmation d'une réservation PENDING |
| confirm (capacité) | Exception si la capacité est atteinte |
| refuse | Refus d'une réservation |
| cancel | Annulation par participant ou admin |
| cancel (utilisateur) | Vérification que l'utilisateur peut annuler sa réservation |
| cancel (autre) | Exception si un participant annule une autre réservation |

---

## Tests E2E

Les tests E2E utilisent une instance réelle de l'application et une base MongoDB. Ils testent les endpoints HTTP de bout en bout.

### AuthController (`test/auth.e2e-spec.ts`)

| Test | Endpoint | Description |
|------|----------|-------------|
| Inscription | POST /auth/register | Création d'un compte participant |
| Email existant | POST /auth/register | Erreur 409 si doublon |
| Email invalide | POST /auth/register | Erreur 400 validation |
| Mot de passe court | POST /auth/register | Erreur 400 validation |
| Login succès | POST /auth/login | Retourne un token JWT |
| Utilisateur inexistant | POST /auth/login | Erreur 401 |
| Mot de passe incorrect | POST /auth/login | Erreur 401 |
| Email invalide | POST /auth/login | Erreur 400 validation |
| Scénario complet | Register → Login → /reservations/me | Flux complet avec token |

### EventsController (`test/events.e2e-spec.ts`)

| Test | Endpoint | Description |
|------|----------|-------------|
| Création (admin) | POST /events | Création d'un événement |
| Création (401) | POST /events | Erreur si non authentifié |
| Création (403) | POST /events | Erreur si participant |
| Validation | POST /events | Erreur 400 si champs manquants |
| Liste publique | GET /events | Événements PUBLISHED uniquement |
| Liste admin | GET /events/admin/all | Tous les événements |
| Détail | GET /events/:id | Un événement par ID |
| Détail (404) | GET /events/:id | Erreur si inexistant |
| Mise à jour | PATCH /events/:id | Modification par admin |
| Publication | PATCH /events/:id/publish | Changement de statut |
| Annulation | PATCH /events/:id/cancel | Changement de statut |
| Scénario CRUD | Create → Read → Update → Publish → Cancel | Flux complet |

### ReservationsController (`test/reservations.e2e-spec.ts`)

| Test | Endpoint | Description |
|------|----------|-------------|
| Création | POST /reservations | Réservation par participant |
| Création (401) | POST /reservations | Erreur si non authentifié |
| Événement non publié | POST /reservations | Erreur 400 |
| Événement complet | POST /reservations | Erreur 400 |
| Mes réservations | GET /reservations/me | Liste des réservations du user |
| Mes réservations (401) | GET /reservations/me | Erreur si non authentifié |
| Toutes (admin) | GET /reservations | Liste pour admin |
| Toutes (403) | GET /reservations | Erreur si participant |
| Confirmation | PATCH /reservations/:id/confirm | Admin confirme |
| Confirmation (403) | PATCH /reservations/:id/confirm | Erreur si participant |
| Refus | PATCH /reservations/:id/refuse | Admin refuse |
| Annulation (participant) | PATCH /reservations/:id/cancel | Participant annule la sienne |
| Annulation (admin) | PATCH /reservations/:id/cancel | Admin annule n'importe laquelle |
| Scénario complet | Réserver → Confirmer → Vérifier | Flux réservation → confirmation |

---

## Structure des fichiers

```
backend/
├── src/
│   ├── auth/
│   │   └── auth.service.spec.ts      # Tests unitaires AuthService
│   ├── events/
│   │   └── events.service.spec.ts    # Tests unitaires EventsService
│   ├── reservations/
│   │   └── reservations.service.spec.ts  # Tests unitaires ReservationsService
│   └── app.controller.spec.ts        # Test unitaire AppController
├── test/
│   ├── jest-e2e.json                 # Configuration Jest pour E2E
│   ├── app.e2e-spec.ts               # Test E2E App
│   ├── auth.e2e-spec.ts              # Tests E2E Auth
│   ├── events.e2e-spec.ts            # Tests E2E Events
│   └── reservations.e2e-spec.ts      # Tests E2E Reservations
└── docs/
    └── TESTS.md                      # Cette documentation
```

### Configuration Jest

- **Tests unitaires** : configuration dans `package.json` (clé `jest`)
  - `rootDir`: `src`
  - `testRegex`: `.*\.spec\.ts$`
  
- **Tests E2E** : configuration dans `test/jest-e2e.json`
  - `rootDir`: `.`
  - `testRegex`: `.e2e-spec.ts$`

---

## Référence JIRA

| Ticket | Description |
|--------|-------------|
| ST1.4.1 | Tests unitaires AuthService |
| ST1.4.2 | Tests E2E login/register |
| ST2.4.1 | Tests unitaires EventsService |
| ST2.4.2 | Tests E2E CRUD événements |
| ST3.4.1 | Tests unitaires ReservationsService |
| ST3.4.2 | Tests E2E réservation → confirmation |

---

## Dépannage

### Les tests E2E échouent avec "MongoServerSelectionError"
**Cause :** MongoDB n'est pas démarré ou inaccessible.

**Solution :**
```bash
docker-compose up -d mongodb
# Attendre quelques secondes que MongoDB soit prêt
npm run test:e2e
```

### Les tests E2E échouent avec "401 Unauthorized"
**Cause :** Les comptes admin/participant n'existent pas dans la base.

**Solution :**
```bash
npm run seed
npm run test:e2e
```

### "A worker process has failed to exit gracefully"
**Cause :** La connexion MongoDB n'est pas fermée proprement à la fin des tests.

**Impact :** Aucun sur les résultats des tests. Tous les tests passent. Cet avertissement peut être ignoré ou corrigé en ajoutant une fermeture explicite de la connexion Mongoose dans `afterAll`.

### Les tests unitaires échouent
**Cause :** Problème de mocks ou de dépendances.

**Solution :** Vérifier que les mocks correspondent aux signatures des services. Exécuter un test isolé pour identifier l'erreur :
```bash
npm test -- auth.service.spec.ts --verbose
```

---

## Bonnes pratiques

1. **Exécuter les tests avant chaque commit** : `npm test && npm run test:e2e`
2. **Utiliser des emails uniques** dans les tests E2E (ex: `test-${Date.now()}@example.com`) pour éviter les conflits
3. **Isoler les tests** : chaque test E2E crée ses propres données pour éviter les effets de bord
4. **Nettoyer la base** : en développement, vous pouvez réinitialiser la base avec `npm run seed` si nécessaire

---


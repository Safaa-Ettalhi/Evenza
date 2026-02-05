# CI/CD - Evenza

Pipeline GitHub Actions pour build, lint et tests.

## Workflow

**Fichier :** `.github/workflows/ci.yml`

**Déclenchement :** push et pull_request sur `main` et `develop`

## Jobs

### Backend (ST8.1.1 ST8.1.2 ST8.1.3 ST8.1.4)

| Étape | Commande | Description |
|-------|----------|-------------|
| Install | `npm ci` | Dépendances |
| Lint | `npm run lint` | ESLint |
| Unit tests | `npm test` | 30 tests Jest |
| E2E tests | `npm run test:e2e` | 36 tests avec MongoDB |

**Services :** MongoDB 7 (port 27017)

**Variables :**
- `MONGODB_URI`: mongodb://localhost:27017/evenza
- `JWT_SECRET`: secret-ci-test

### Frontend

| Étape | Commande | Description |
|-------|----------|-------------|
| Install | `npm ci` | Dépendances |
| Lint | `npm run lint` | ESLint (continue-on-error) |
| Unit tests | `npm test` | 31 tests Jest |
| Build | `npm run build` | Next.js production |

**Variables :**
- `NEXT_PUBLIC_API_URL`: http://localhost:3000

## Référence JIRA

| Ticket | Description |
|--------|-------------|
| ST8.1.1 | Install dépendances |
| ST8.1.2 | Lint |
| ST8.1.3 | Tests unitaires |
| ST8.1.4 | Tests E2E backend |

## Note

Le lint frontend a des erreurs préexistantes. Il est exécuté avec `continue-on-error: true` pour ne pas bloquer le pipeline. À corriger pour un lint strict.

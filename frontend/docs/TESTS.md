# Documentation des Tests - Frontend Evenza

Cette documentation décrit les tests du frontend Next.js avec Jest et React Testing Library.

---

## Vue d'ensemble

| Type | Nombre | Fichiers |
|------|--------|----------|
| **Tests composants** | 31 | `__tests__/**/*.test.tsx` |

**Total : 31 tests**

---

## Prérequis

- Node.js 18+
- Aucune base de données requise (mocks utilisés)

---

## Commandes

```bash
cd frontend

# Tous les tests
npm test

# Mode watch (développement)
npm run test:watch

# Couverture
npm run test:cov

# Un fichier spécifique
npm test -- EventCard
npm test -- login
```

---

## Structure des tests

```
frontend/
├── __tests__/
│   ├── app/
│   │   ├── login/page.test.tsx       # Page connexion
│   │   ├── register/page.test.tsx   # Page inscription
│   │   └── mes-reservations/page.test.tsx  # Page mes réservations
│   ├── components/
│   │   ├── EventCard.test.tsx        # Carte événement
│   │   ├── EventForm.test.tsx        # Formulaire événement
│   │   └── Header.test.tsx           # En-tête navigation
│   ├── contexts/
│   │   └── AuthContext.test.tsx     # Contexte authentification
│   ├── mocks/
│   │   └── next-navigation.ts        # Mocks Next.js
│   └── test-utils.tsx                # Utilitaires de test
├── jest.config.ts
└── jest.setup.ts
```

---

## Couverture par module

### Auth (ST1.4.3)
- **AuthContext** : login, register, logout, état authentifié
- **LoginPage** : formulaire, validation, redirection, erreurs
- **RegisterPage** : formulaire, validation mots de passe, redirection

### Events (ST2.4.3)
- **EventCard** : affichage titre, description, places, lien, état complet
- **EventForm** : champs, validation, soumission, lien annuler

### Reservations (ST3.4.3)
- **MesReservationsPage** : titre, appel API getMyReservations

### Composants communs
- **Header** : logo, liens selon rôle (participant/admin), déconnexion

---

## Mocks utilisés

- `next/navigation` : useRouter, usePathname
- `@/contexts/AuthContext` : useAuth
- `@/lib/api` : apiService (pour mes-reservations)

---

## Référence JIRA

| Ticket | Description |
|--------|-------------|
| ST1.4.3 | Tests frontend Auth |
| ST2.4.3 | Tests frontend Events |
| ST3.4.3 | Tests frontend Reservations |

---

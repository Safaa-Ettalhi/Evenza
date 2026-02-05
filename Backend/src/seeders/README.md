# Seeder - Données de test

Ce seeder permet de créer des données de test pour l'application Evenza.

## Comptes créés

### Admin
- **Email**: `admin@evenza.com`
- **Mot de passe**: `admin123`
- **Rôle**: ADMIN

### Participant
- **Email**: `participant@evenza.com`
- **Mot de passe**: `participant123`
- **Rôle**: PARTICIPANT

## Données créées

- **4 événements** :
  - 3 événements PUBLISHED (publiés)
  - 1 événement DRAFT (brouillon)

- **3 réservations** pour le participant :
  - 1 réservation PENDING (en attente)
  - 1 réservation CONFIRMED (confirmée)
  - 1 réservation REFUSED (refusée)

## Utilisation

Pour exécuter le seeder :

```bash
cd backend
npm run seed
```

**Note**: Le seeder vérifie si les données existent déjà avant de les créer, vous pouvez l'exécuter plusieurs fois sans créer de doublons.

# Evenza - Plateforme de Gestion d'Événements

Bienvenue sur le projet **Evenza**.

## Documentation Technique

### 1. Architecture Globale

Le projet **Evenza** suit une architecture moderne basée sur des microservices logiques (séparation Frontend/Backend) et conteneurisée.

#### Stack Technique
*   **Frontend** : Next.js 14+ (App Router), React, Tailwind CSS, Shadcn UI.
    *   **Architecture** : Hybride SSR (Server-Side Rendering) pour les pages publiques et CSR (Client-Side Rendering) pour les dashboards sécurisés.
    *   **État** : Context API pour la gestion de l'authentification globale.
*   **Backend** : NestJS (Node.js framework).
    *   **Architecture** : Modulaire (Modules, Controllers, Services).
    *   **Base de données** : MongoDB (NoSQL) avec Mongoose ODM.
    *   **Sécurité** : JWT (JSON Web Tokens) pour l'authentification sans état (stateless).
*   **DevOps** : Docker, Docker Compose, GitHub Actions (CI/CD).

#### Flux de Données
1.  Le client (navigateur) envoie des requêtes HTTP au Backend (API REST).
2.  Le Backend valide les requêtes (Pipes/DTOs), vérifie l'auth (Guards), et délègue au Service.
3.  Le Service interagit avec la Base de Données (MongoDB) via Mongoose.
4.  Le Backend renvoie une réponse JSON standardisée.

---

### 2. Diagramme de Classes

Le diagramme de classes des entités principales (`User`, `Event`, `Reservation`) est disponible séparément dans le dossier `docs`.

consulter le diagramme : [Voir le diagramme d'architecture](./docs/architecture_diagram.mermaid)

---

### 3. Guide d'Installation et de Configuration

#### Prérequis
*   Node.js 18+
*   Docker & Docker Compose
*   Git

#### Installation Locale

1.  **Cloner le dépôt**
    ```bash
    git clone https://github.com/Safaa-Ettalhi/Evenza.git
    cd Evenza
    ```

2.  **Lancer avec Docker (Recommandé)**
    ```bash
    docker-compose up --build
    ```
    *   Backend dispo sur : `http://localhost:3000`
    *   Frontend dispo sur : `http://localhost:3001`
    *   MongoDB dispo sur : `localhost:27017`

3.  **Installation Manuelle (Sans Docker)**

    *   **Backend** :
        ```bash
        cd backend
        npm install
        # Configurer .env (voir .env.example)
        npm run start:dev
        ```

    *   **Frontend** :
        ```bash
        cd frontend
        npm install
        # Configurer .env (voir .env.example)
        npm run dev
        ```

#### Configuration (.env)

**Backend (.env)**
```env
MONGODB_URI=mongodb://localhost:27017/evenza
JWT_SECRET=votre_secret_tres_securise
FRONTEND_URL=http://localhost:3001
PORT=3000
```

**Frontend (.env)**
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

---

### 4. Règles Métier Implémentées

#### Gestion des Utilisateurs
*   **Rôles** :
    *   **Admin** : Peut créer, modifier, annuler des événements et gérer toutes les réservations.
    *   **Participant** : Peut consulter les événements, réserver sa place et voir ses propres réservations.
*   **Unicité** : L'email doit être unique lors de l'inscription.

#### Gestion des Événements
*   **Statuts** :
    *   `DRAFT` : Invisible pour les participants. Seul l'Admin peut le voir.
    *   `PUBLISHED` : Visible publiquement, ouvert aux réservations.
    *   `CANCELED` : Visible mais réservations bloquées.
*   **Capacité** : Le nombre de places disponibles (`availableSpots`) est décrémenté automatiquement à chaque réservation confirmée (ou en attente selon la logique choisie).
*   **Contraintes** : On ne peut pas réserver un événement complet ou passé.

#### Gestion des Réservations
*   **Flux de vie** :
    1.  Création -> `PENDING` (En attente de validation Admin).
    2.  Admin valide -> `CONFIRMED` -> Génération du billet PDF possible.
    3.  Admin refuse -> `REFUSED`.
    4.  Utilisateur/Admin annule -> `CANCELED` -> La place est libérée.
*   **Restriction** : Un utilisateur ne peut réserver qu'une seule fois pour le même événement.

#### Sécurité
*   Les mots de passe sont hashés avec **bcrypt** avant stockage.
*   Toutes les routes sensibles sont protégées par **Guard JWT**.
*   Validation stricte des entrées via **DTO** et **class-validator**.

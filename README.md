# TP3 - Plateforme de Quiz Interactif en Temps Réel

Plateforme de quiz interactive permettant aux enseignants de créer des quiz et de lancer des sessions en temps réel, et aux étudiants de participer et de voir les résultats instantanément.

## ✨ Fonctionnalités Principales

- **Gestion de quiz** : Création, modification et suppression de quiz avec différents types de questions (QCM, Vrai/Faux, Texte libre)
- **Sessions en temps réel** : Lancement de sessions avec code d'accès unique et gestion en direct via WebSocket
- **Dashboard interactif** : Statistiques de performance, historique des sessions, vue d'ensemble pour enseignants et étudiants
- **Récapitulatifs détaillés** : Consultation des résultats complets avec bonnes réponses et réponses des étudiants
- **Authentification sécurisée** : JWT avec cookies httpOnly, gestion des rôles (Teacher/Student)
- **Documentation API** : Documentation OpenAPI accessible via Swagger UI

## 🏗️ Architecture

### Structure Monorepo

Ce projet utilise une architecture **monorepo** pour faciliter le partage de types TypeScript entre le frontend et le backend, et simplifier le développement et le déploiement.

```
tp3-fullstack/
├── frontend/          # Application Next.js (Frontend)
├── backend/           # API Express (Backend)
├── shared/            # Types et utilitaires partagés
└── package.json       # Configuration workspace
```

### Choix Techniques

#### Frontend

- **Next.js 14+** avec TypeScript (App Router)
- **Tailwind CSS** pour le styling
- **TanStack Query** (React Query) pour la gestion des données et cache
- **Zustand** pour la gestion d'état globale
- **Socket.io-client** pour la communication WebSocket

#### Backend

- **Express.js** avec TypeScript
- **Socket.io** pour les WebSockets temps réel
- **PostgreSQL** comme base de données (avec `pg` client)
- **JWT** pour l'authentification
- **bcryptjs** pour le hachage des mots de passe
- **Zod** pour la validation des schémas

#### Communication Temps Réel

- **Socket.io** : Choix pour sa simplicité d'utilisation, sa compatibilité avec Express, et sa gestion automatique des reconnexions et fallbacks (long-polling si WebSocket indisponible)

### Partage de Types

Les types TypeScript sont définis dans le package `shared` et importés dans le frontend et le backend pour garantir la cohérence des données entre les deux parties de l'application.

## 🚀 Installation

### Prérequis

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- PostgreSQL >= 14.0

### Installation des dépendances

```bash
pnpm install
```

Cette commande installera automatiquement toutes les dépendances pour tous les workspaces (frontend, backend, shared).

### Configuration

1. **Base de données PostgreSQL**

Créez une base de données PostgreSQL :

```sql
CREATE DATABASE quiz_platform;
```

2. **Variables d'environnement**

Créez des fichiers `.env` séparés pour le backend et le frontend en copiant les fichiers d'exemple :

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env.local
```

Puis modifiez les valeurs selon votre configuration locale.

**`backend/.env`** :

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/quiz_platform"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"

# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL="http://localhost:3000"
```

**`frontend/.env.local`** (Next.js charge automatiquement ce fichier) :

```env
# Frontend (Next.js)
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_WS_URL="http://localhost:3001"
```

**Note** :

- Les fichiers `.env.example` sont fournis dans le repository comme modèles de référence (dans `backend/.env.example` et `frontend/.env.example`).
- Les fichiers `.env` et `.env.local` sont dans `.gitignore` pour des raisons de sécurité. Ne les commitez jamais dans Git.
- Modifiez les valeurs dans vos fichiers `.env` selon votre configuration locale (notamment le `DATABASE_URL` avec votre nom d'utilisateur PostgreSQL).

3. **Configuration de la base de données**

Exécutez les migrations pour créer les tables :

```bash
cd backend
pnpm db:migrate
```

Optionnel : Créez des données de test :

```bash
pnpm db:seed
```

**Comptes de test créés par la seed** :

- **Teacher** : `teacher1@example.com` / `teacher123`
  - A 2 quiz avec plusieurs questions
  - Sessions actives et terminées disponibles
  
- **Student** : `student1@example.com` / `student123`
  - A complété plusieurs sessions avec scores
  - Peut tester toutes les fonctionnalités étudiant

Ces comptes sont également utilisables via les boutons "Quick Login" sur la page d'accueil.

## 🛠️ Développement

### Lancer l'application complète

```bash
pnpm dev
```

Cette commande lance simultanément :

- Le backend Express sur `http://localhost:3001`
- Le frontend Next.js sur `http://localhost:3000`

### Lancer séparément

**Backend uniquement :**

```bash
pnpm dev:backend
```

**Frontend uniquement :**

```bash
pnpm dev:frontend
```

## 📦 Build

### Build complet

```bash
pnpm build
```

Cette commande build d'abord le package `shared`, puis le backend, puis le frontend.

### Build séparé

```bash
pnpm build:shared   # Build les types partagés
pnpm build:backend  # Build le backend
pnpm build:frontend # Build le frontend
```

## 📁 Structure des Dossiers

### Frontend (`frontend/`)

```
frontend/
├── app/                    # App Router Next.js
│   ├── (auth)/            # Routes d'authentification
│   ├── dashboard/         # Dashboard avec Parallel Routes
│   │   ├── @overview/    # Vue d'ensemble
│   │   ├── @quizzes/     # Liste des quiz
│   │   ├── @sessions/    # Liste des sessions
│   │   ├── @performance/ # Statistiques de performance
│   │   └── sessions/     # Détails des sessions
│   ├── teacher/          # Routes enseignants
│   │   └── quizzes/      # Gestion des quiz
│   ├── student/          # Routes étudiants
│   │   └── join/         # Rejoindre une session
│   └── api/              # API routes Next.js (si nécessaire)
├── components/            # Composants React réutilisables
│   ├── AuthGuard.tsx     # Protection des routes par rôle
│   └── dashboard/        # Composants du dashboard
├── lib/                   # Utilitaires et configurations
│   ├── api/              # Client API centralisé (Axios)
│   ├── hooks/            # Hooks personnalisés
│   │   ├── useAuthMutation.ts
│   │   ├── useQuizzes.ts
│   │   ├── useSessions.ts
│   │   └── useWebSocket.ts
│   └── store/            # Stores Zustand
│       └── authStore.ts  # Store d'authentification
└── public/                # Assets statiques
```

### Backend (`backend/`)

```
backend/
├── src/
│   ├── controllers/      # Contrôleurs (logique métier)
│   │   ├── authController.ts
│   │   ├── quizController.ts
│   │   └── sessionController.ts
│   ├── routes/           # Routes Express
│   │   ├── auth.ts       # Routes d'authentification
│   │   ├── quiz.ts       # Routes de gestion des quiz
│   │   ├── session.ts    # Routes de gestion des sessions
│   │   └── dashboard.ts  # Routes du dashboard
│   ├── middleware/       # Middlewares (auth, validation, etc.)
│   │   └── auth.ts       # Middleware d'authentification JWT
│   ├── db/              # Configuration base de données
│   │   ├── connection.ts # Pool de connexions PostgreSQL
│   │   ├── migrate.ts    # Script de migration
│   │   └── seed.ts       # Script de seed avec données de test
│   ├── migrations/       # Fichiers SQL de migration
│   ├── socket/           # Gestion WebSocket
│   │   ├── handlers.ts   # Gestionnaires d'événements Socket.io
│   │   └── sessionManager.ts # Gestion des sessions en temps réel
│   ├── utils/            # Utilitaires
│   └── index.ts          # Point d'entrée du serveur
└── tests/                # Tests
```

### Shared (`shared/`)

```
shared/
├── types/                # Types partagés (User, Quiz, Question, etc.)
├── constants/            # Constantes partagées
└── utils/                # Utilitaires partagés
```

## 🔌 WebSockets

### Implémentation

L'application utilise **Socket.io** pour la communication temps réel. Les fonctionnalités suivantes utilisent WebSockets :

1. **Diffusion des questions** : Quand un enseignant lance une question, elle est diffusée à tous les étudiants connectés
2. **Réception des réponses** : Les réponses des étudiants sont reçues en temps réel
3. **Affichage des résultats** : Les résultats et le classement sont mis à jour en temps réel
4. **Timer synchronisé** : Le timer de chaque question est géré côté serveur et synchronisé avec tous les clients
5. **Affichage des bonnes réponses** : Quand le temps est écoulé ou que l'enseignant affiche les résultats, les étudiants voient la bonne réponse
6. **Récapitulatif final** : À la fin du quiz, chaque étudiant reçoit un récapitulatif personnalisé avec toutes les questions, ses réponses et les bonnes réponses

### Gestion des Reconnexions

Socket.io gère automatiquement les reconnexions. Si un étudiant se déconnecte, il peut se reconnecter à la session en cours (si elle est toujours active) et reprendre là où il s'est arrêté.

### Événements WebSocket

**Client → Server** :
- `joinSession` - Rejoindre une session avec code d'accès
- `answer` - Soumettre une réponse à une question
- `leaveSession` - Quitter une session

**Server → Client** :
- `question` - Nouvelle question diffusée
- `results` - Résultats et classement (inclut la bonne réponse)
- `sessionStarted` - Notification de démarrage de session
- `sessionEnded` - Notification de fin de session (inclut le récapitulatif complet)
- `timerUpdate` - Mise à jour du timer
- `error` - Message d'erreur

## 📚 API Documentation

La documentation OpenAPI/Swagger est disponible dans le fichier `openapi.yaml` à la racine du projet.

**Documentation interactive Swagger UI** :

- URL: `http://localhost:3001/api-docs`
- Accessible dès que le serveur backend est démarré
- Permet de tester les endpoints directement depuis l'interface

## 🧪 Tests

```bash
# Tests backend
cd backend && pnpm test

# Tests frontend
cd frontend && pnpm test
```

## 🚢 Déploiement

### Préparation

1. Build de l'application :

```bash
pnpm build
```

2. Variables d'environnement de production à configurer sur le serveur :

   - `backend/.env` pour les variables du backend (DATABASE_URL, JWT_SECRET, etc.)
   - `frontend/.env.local` ou `frontend/.env.production` pour les variables du frontend (NEXT*PUBLIC*\*)

3. Exécuter les migrations sur la base de données de production :

```bash
cd backend
pnpm db:migrate
```

### Déploiement Backend

Le backend Express peut être déployé sur :

- Heroku
- Railway
- Render
- VPS avec PM2

### Déploiement Frontend

Le frontend Next.js peut être déployé sur :

- Vercel (recommandé pour Next.js)
- Netlify
- VPS avec Node.js

## 👥 Rôles et Permissions

### Enseignant (Teacher)

- Créer, modifier et supprimer des quiz
- Créer des questions (QCM, Vrai/Faux, Texte libre) avec points personnalisés
- Lancer des sessions de quiz avec code d'accès
- Contrôler la progression des questions (suivante, résultats, fin de session)
- Visualiser les résultats et statistiques en temps réel
- Consulter les résultats détaillés de chaque session (participants, scores, réponses)
- Accéder aux statistiques de performance par quiz avec scores moyens et maximums

### Étudiant (Student)

- Rejoindre une session via code d'accès
- Répondre aux questions en temps réel
- Visualiser les résultats et le classement
- Voir les bonnes réponses après expiration du temps
- Consulter le récapitulatif complet du quiz après la fin de la session
- Accéder à l'historique des sessions depuis le dashboard

## 📝 Notes

- Les mots de passe sont hashés avec bcryptjs
- Les tokens JWT sont stockés dans des cookies httpOnly pour la sécurité
- Les tokens expirent après 7 jours
- Les cookies utilisent `sameSite: "lax"` en développement et `sameSite: "strict"` en production
- Les sessions de quiz sont stockées en mémoire (pourrait être migré vers Redis en production)
- Les migrations SQL sont gérées manuellement via le script `db:migrate`
- Le projet utilise pnpm workspaces pour gérer les dépendances du monorepo
- Les scores sont calculés en fonction des points attribués à chaque question
- Les réponses sont stockées en base de données pour permettre la consultation des récapitulatifs après la session

## 🤝 Contribution

Ce projet est réalisé dans le cadre d'un TP scolaire.

## 📄 Licence

Ce projet est un projet académique.

# TP3 - Plateforme de Quiz Interactif en Temps Réel

Plateforme de quiz interactive permettant aux enseignants de créer des quiz et de lancer des sessions en temps réel, et aux étudiants de participer et de voir les résultats instantanément.

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

Créez un fichier `.env` à la racine du projet :

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/quiz_platform"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"

# Server
PORT=3001
NODE_ENV=development

# Frontend (Next.js)
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_WS_URL="http://localhost:3001"
```

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
│   ├── (teacher)/         # Routes enseignants
│   ├── (student)/         # Routes étudiants
│   └── api/               # API routes Next.js (si nécessaire)
├── components/            # Composants React réutilisables
├── lib/                   # Utilitaires et configurations
│   ├── api/              # Client API centralisé
│   ├── hooks/            # Hooks personnalisés
│   └── store/            # Stores Zustand
├── types/                 # Types TypeScript (importés de shared)
└── public/                # Assets statiques
```

### Backend (`backend/`)

```
backend/
├── src/
│   ├── controllers/      # Contrôleurs (logique métier)
│   ├── routes/           # Routes Express
│   ├── middleware/       # Middlewares (auth, validation, etc.)
│   ├── db/              # Configuration base de données
│   │   ├── connection.ts # Pool de connexions PostgreSQL
│   │   ├── migrate.ts    # Script de migration
│   │   └── seed.ts       # Script de seed
│   ├── migrations/       # Fichiers SQL de migration
│   ├── services/         # Services métier
│   ├── socket/           # Gestion WebSocket
│   ├── utils/            # Utilitaires
│   └── types/            # Types TypeScript (importés de shared)
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

### Gestion des Reconnexions

Socket.io gère automatiquement les reconnexions. Si un étudiant se déconnecte, il peut se reconnecter à la session en cours (si elle est toujours active) et reprendre là où il s'est arrêté.

## 📚 API Documentation

La documentation OpenAPI/Swagger est disponible dans le fichier `openapi.yaml` à la racine du projet.

Pour accéder à la documentation interactive (si Swagger UI est configuré) :
- URL: `http://localhost:3001/api-docs`

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

2. Variables d'environnement de production à configurer sur le serveur

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
- Créer des questions (QCM, Vrai/Faux, Texte libre)
- Lancer des sessions de quiz avec code d'accès
- Visualiser les résultats et statistiques en temps réel

### Étudiant (Student)
- Rejoindre une session via code d'accès
- Répondre aux questions en temps réel
- Visualiser les résultats et le classement

## 📝 Notes

- Les mots de passe sont hashés avec bcryptjs
- Les tokens JWT expirent après 7 jours
- Les sessions de quiz sont stockées en mémoire (pourrait être migré vers Redis en production)
- Les migrations SQL sont gérées manuellement via le script `db:migrate`
- Le projet utilise pnpm workspaces pour gérer les dépendances du monorepo

## 🤝 Contribution

Ce projet est réalisé dans le cadre d'un TP scolaire.

## 📄 Licence

Ce projet est un projet académique.


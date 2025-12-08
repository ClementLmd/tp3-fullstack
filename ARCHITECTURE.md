# Architecture Overview

## Monorepo Structure

```
tp3-fullstack/
├── frontend/              # Next.js application
│   ├── app/              # Next.js App Router
│   ├── components/       # React components
│   ├── lib/              # Utilities and configurations
│   │   ├── api/         # API client (Axios)
│   │   ├── hooks/       # Custom React hooks
│   │   └── store/       # Zustand stores
│   └── public/           # Static assets
│
├── backend/              # Express API server
│   ├── src/
│   │   ├── controllers/ # Request handlers
│   │   ├── routes/      # Express routes
│   │   ├── middleware/  # Auth, validation, etc.
│   │   ├── db/          # Database configuration
│   │   │   ├── connection.ts # PostgreSQL connection pool
│   │   │   ├── migrate.ts    # Migration script
│   │   │   └── seed.ts       # Seed script
│   │   ├── migrations/  # SQL migration files
│   │   ├── services/    # Business logic
│   │   ├── socket/      # WebSocket handlers
│   │   └── utils/       # Utilities
│
└── shared/              # Shared TypeScript types
    └── src/
        └── types/       # Type definitions
```

## Technology Stack

### Frontend

- **Next.js 14** (App Router) - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **TanStack Query** - Data fetching and caching
- **Zustand** - State management
- **Socket.io-client** - WebSocket client
- **Axios** - HTTP client

### Backend

- **Express.js** - Web framework
- **TypeScript** - Type safety
- **Socket.io** - WebSocket server
- **PostgreSQL** - Database (using `pg` client library)
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Zod** - Schema validation

## Data Flow

### Authentication Flow

1. User registers/logs in → Backend validates → Returns JWT token
2. Frontend stores token in localStorage and Zustand store
3. Axios interceptor adds token to all API requests
4. Backend middleware validates token on protected routes

### Real-time Quiz Flow

1. Teacher creates quiz → Stored in database
2. Teacher starts session → Backend generates access code → WebSocket room created
3. Students join via access code → WebSocket connection established
4. Teacher sends question → Broadcasted to all students via WebSocket
5. Students submit answers → Sent via WebSocket → Backend processes
6. Results calculated → Broadcasted to all clients → Leaderboard updated

## WebSocket Events

### Client → Server

- `joinSession` - Student joins a quiz session
- `answer` - Student submits an answer
- `leaveSession` - Student leaves session

### Server → Client

- `question` - New question broadcasted
- `results` - Results and leaderboard update
- `sessionStarted` - Session started notification
- `sessionEnded` - Session ended notification
- `timerUpdate` - Timer countdown update
- `error` - Error message

## Database Schema

### Core Entities

- **User** - Teachers and Students
- **Quiz** - Quiz definitions
- **Question** - Questions within quizzes
- **Session** - Active quiz sessions
- **Participation** - Student participation in sessions
- **Answer** - Student answers to questions

### Relationships

- User → Quiz (one-to-many, creator)
- Quiz → Question (one-to-many)
- Quiz → Session (one-to-many)
- Session → Participation (one-to-many)
- Participation → Answer (one-to-many)
- Question → Answer (one-to-many)

## Security

- JWT tokens for authentication
- Password hashing with bcryptjs
- Role-based access control (RBAC)
- CORS configuration
- Input validation with Zod
- SQL injection prevention via parameterized queries (pg library)

## Deployment Considerations

- Frontend: Vercel (recommended) or any Node.js hosting
- Backend: Railway, Render, Heroku, or VPS
- Database: Managed PostgreSQL (Supabase, Railway, etc.)
- WebSocket: Requires persistent connection support
- Environment variables: Separate for dev/prod

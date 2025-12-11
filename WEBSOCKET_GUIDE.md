# Guide WebSocket - Quiz en Temps Réel

## 🔌 Qu'est-ce qu'un WebSocket ?

### Différence avec HTTP classique

**HTTP (requêtes classiques)** :

```
Client → Server : Requête GET /api/quizzes
Server → Client : Réponse JSON avec les quizzes
Connexion fermée
```

- **Unidirectionnel** : Client demande, serveur répond
- **Stateless** : Chaque requête est indépendante
- **Le serveur ne peut pas envoyer de données** sans que le client demande

**WebSocket** :

```
Client ↔ Server : Connexion persistante établie
Client → Server : "Je rejoins la session ABC123"
Server → Client : "Question envoyée à tous les participants"
Client → Server : "Ma réponse est 'Paris'"
Server → Client : "Résultats : 10 participants, leaderboard..."
```

- **Bidirectionnel** : Communication dans les deux sens en temps réel
- **Persistant** : Connexion reste ouverte
- **Le serveur peut envoyer des données** à tout moment

### Pourquoi WebSocket pour les quizzes ?

1. **Temps réel** : Quand le professeur envoie une question, tous les étudiants la reçoivent instantanément
2. **Synchronisation** : Tous les participants voient la même question au même moment
3. **Efficacité** : Pas besoin de "polling" (vérifier toutes les 2 secondes si une nouvelle question existe)
4. **Interactivité** : Réponses instantanées, leaderboard mis à jour en direct

## 🏗️ Architecture Socket.io

### Concept de "Rooms" (Salles)

Socket.io utilise des **rooms** pour organiser les connexions :

```
Session ABC123 (Room)
├── Student 1 (socket.id: abc123)
├── Student 2 (socket.id: def456)
└── Student 3 (socket.id: ghi789)
```

- Chaque session de quiz = une room unique
- Les étudiants **rejoignent** la room avec le code d'accès
- Quand le professeur **broadcast** une question → tous les étudiants de la room la reçoivent
- Les étudiants **émettent** des réponses → le serveur les traite

### Flux de données

```
1. Teacher démarre session → Code ABC123 généré
2. Student 1 rejoint → socket.join('session:ABC123')
3. Student 2 rejoint → socket.join('session:ABC123')
4. Teacher envoie question → io.to('session:ABC123').emit('question', question)
5. Tous les étudiants reçoivent la question simultanément
6. Student 1 répond → socket.emit('answer', { questionId, answer })
7. Server calcule résultats → io.to('session:ABC123').emit('results', leaderboard)
8. Tous voient le leaderboard mis à jour
```

## 📁 Structure de l'implémentation

### Backend

#### 1. `socket/sessionManager.ts` - Gestion des sessions

- **`activeSessions`** : Map qui stocke l'état de chaque session en mémoire
- **`initializeSession()`** : Charge les questions depuis la DB et crée l'état de session
- **`handleJoinSession()`** : Ajoute un étudiant à la room
- **`handleAnswer()`** : Traite une réponse, vérifie la correction, met à jour le score
- **`startNextQuestion()`** : Envoie la question suivante à tous les participants
- **`showResults()`** : Affiche les résultats et le leaderboard
- **`endSession()`** : Termine la session et nettoie

#### 2. `socket/handlers.ts` - Gestionnaires d'événements

- **`authenticateSocket()`** : Vérifie le JWT depuis les cookies
- **`setupSocketHandlers()`** : Configure tous les event listeners

#### 3. `controllers/sessionController.ts` - Routes HTTP

- **`POST /api/sessions`** : Démarrer une session
- **`POST /api/sessions/:id/next`** : Question suivante
- **`POST /api/sessions/:id/results`** : Afficher résultats
- **`POST /api/sessions/:id/end`** : Terminer session

### Frontend

#### `hooks/useWebSocket.ts` - Hook React

- Crée la connexion Socket.io
- Gère la reconnexion automatique
- Expose des fonctions : `joinSession()`, `submitAnswer()`, `leaveSession()`
- Retourne le socket pour écouter les événements

## 🔄 Événements Socket.io

### Client → Server (Émis par le client)

```typescript
// Student rejoint une session
socket.emit("joinSession", { accessCode: "ABC123", userId: "user-123" });

// Student soumet une réponse
socket.emit("answer", { questionId: "q-456", answer: "Paris" });

// Student quitte la session
socket.emit("leaveSession");
```

### Server → Client (Reçus par le client)

```typescript
// Nouvelle question envoyée
socket.on("question", (question: Question) => {
  console.log("Nouvelle question:", question.text);
});

// Résultats et leaderboard
socket.on("results", (data) => {
  console.log("Leaderboard:", data.leaderboard);
});

// Session démarrée
socket.on("sessionStarted", (session: Session) => {
  console.log("Session démarrée:", session.accessCode);
});

// Session terminée
socket.on("sessionEnded", () => {
  console.log("Session terminée");
});

// Mise à jour du timer
socket.on("timerUpdate", (timeLeft: number) => {
  console.log("Temps restant:", timeLeft);
});

// Erreur
socket.on("error", (message: string) => {
  console.error("Erreur:", message);
});
```

## 💻 Exemple d'utilisation complète

### Côté Teacher (Démarrer une session)

```typescript
// 1. Démarrer la session via HTTP
const response = await apiClient.post("/api/sessions", { quizId: "quiz-123" });
const session = response.data; // { accessCode: 'ABC123', ... }

// 2. Envoyer la première question via HTTP
await apiClient.post(`/api/sessions/${session.id}/next`);

// 3. Les étudiants reçoivent automatiquement la question via WebSocket
```

### Côté Student (Rejoindre et participer)

```typescript
import { useWebSocket } from "@/lib/hooks/useWebSocket";
import { useAuthStore } from "@/lib/store/authStore";

function QuizSession({ accessCode }: { accessCode: string }) {
  const { socket, isConnected, joinSession, submitAnswer } = useWebSocket();
  const user = useAuthStore((s) => s.user);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [leaderboard, setLeaderboard] = useState([]);

  // Rejoindre la session au montage
  useEffect(() => {
    if (isConnected && user) {
      joinSession(accessCode, user.id);
    }
  }, [isConnected, user, accessCode, joinSession]);

  // Écouter les événements
  useEffect(() => {
    if (!socket) return;

    socket.on("question", (question) => {
      setCurrentQuestion(question);
    });

    socket.on("results", (data) => {
      setLeaderboard(data.leaderboard);
    });

    socket.on("sessionEnded", () => {
      alert("Session terminée !");
    });

    return () => {
      socket.off("question");
      socket.off("results");
      socket.off("sessionEnded");
    };
  }, [socket]);

  const handleAnswer = (answer: string) => {
    if (currentQuestion) {
      submitAnswer(currentQuestion.id, answer);
    }
  };

  return (
    <div>
      {currentQuestion && (
        <div>
          <h2>{currentQuestion.text}</h2>
          {/* Afficher les options */}
          <button onClick={() => handleAnswer("Paris")}>Paris</button>
        </div>
      )}
      <div>
        <h3>Leaderboard</h3>
        {leaderboard.map((entry) => (
          <div key={entry.userId}>
            {entry.name}: {entry.score} points
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 🔐 Authentification WebSocket

Le WebSocket utilise les **cookies httpOnly** pour l'authentification :

1. Client se connecte → Socket.io envoie automatiquement les cookies
2. Serveur vérifie le JWT dans `authenticateSocket()`
3. Si valide → connexion acceptée
4. Si invalide → connexion refusée avec erreur

## 📊 État de session en mémoire

Chaque session active est stockée dans `activeSessions` Map :

```typescript
{
  'ABC123': {
    sessionId: 'session-uuid',
    quizId: 'quiz-uuid',
    accessCode: 'ABC123',
    currentQuestionIndex: 2,
    questions: [...],
    participants: Map {
      'user-1' => { userId, socketId, name, score, answers },
      'user-2' => { userId, socketId, name, score, answers },
    },
    timer: NodeJS.Timeout,
    timeLeft: 30
  }
}
```

**Pourquoi en mémoire ?**

- Accès ultra-rapide pour les opérations temps réel
- Synchronisation instantanée entre tous les participants
- Sauvegarde périodique dans la DB pour persistance

## 🎯 Points clés à retenir

1. **WebSocket = connexion persistante** : Une fois connecté, la connexion reste ouverte
2. **Rooms = groupes** : Les participants d'une session sont dans la même room
3. **Broadcast = envoi à tous** : `io.to('room').emit()` envoie à tous dans la room
4. **État en mémoire** : Rapide mais perdu au redémarrage (sauvegardé en DB)
5. **Reconnexion automatique** : Socket.io gère les déconnexions/réconnexions

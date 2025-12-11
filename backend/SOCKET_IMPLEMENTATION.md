# Socket.io Session Management Implementation

This document describes the socket.io implementation for real-time quiz sessions.

## Overview

The implementation provides a complete real-time quiz system where teachers can create sessions, broadcast questions, and students can join and answer in real-time. It uses Socket.io for WebSocket communication and in-memory storage for active session state.

## Architecture

### Components

1. **Session Service** (`src/services/sessionService.ts`)
   - Manages in-memory active sessions
   - Generates unique 6-character access codes
   - Tracks connected users per session

2. **Session Controller** (`src/controllers/sessionController.ts`)
   - HTTP endpoints for session management
   - Creates, starts, and ends sessions
   - Manages question broadcasting

3. **Socket Handlers** (`src/socket/handlers.ts`)
   - WebSocket event handlers
   - Real-time communication between teacher and students
   - Answer submission and result broadcasting

4. **Session Routes** (`src/routes/session.ts`)
   - Express routes for session API endpoints

## API Endpoints

### POST /api/sessions
Create a new quiz session with a unique access code.

**Authentication:** Teacher role required

**Request:**
```json
{
  "quizId": "uuid"
}
```

**Response:**
```json
{
  "id": "uuid",
  "quizId": "uuid",
  "accessCode": "ABC123",
  "isActive": false,
  "currentQuestionIndex": 0,
  "createdAt": "2023-01-01T00:00:00Z"
}
```

### GET /api/sessions/:id
Get session details by session ID.

**Authentication:** Teacher role required (must be session creator)

### PATCH /api/sessions/:id/start
Start a session, making it active for students to join.

**Authentication:** Teacher role required

### PATCH /api/sessions/:id/question
Broadcast the next question to all connected students.

**Authentication:** Teacher role required

**Request:**
```json
{
  "questionIndex": 0
}
```

### DELETE /api/sessions/:id
End a session.

**Authentication:** Teacher role required

### GET /api/sessions/by-code/:code
Get session by access code (for students to join).

**Authentication:** Any authenticated user

## Socket.io Events

### Client → Server Events

#### `joinTeacherRoom`
Teacher joins their session room to manage it.

**Data:**
```typescript
{
  sessionId: string
}
```

#### `joinSession`
Student joins a session using an access code.

**Data:**
```typescript
{
  accessCode: string,
  userId: string,
  userName: string
}
```

**Emits:** `joinedSession`, `sessionUpdate`

#### `broadcastQuestion`
Teacher broadcasts a question to all students.

**Data:**
```typescript
{
  sessionId: string,
  question: Question
}
```

**Emits:** `question`, `timerUpdate` (if time limit is set)

#### `answer`
Student submits an answer to a question.

**Data:**
```typescript
{
  questionId: string,
  answer: string
}
```

**Emits:** `answerSubmitted`

#### `broadcastResults`
Teacher broadcasts results after a question.

**Data:**
```typescript
{
  sessionId: string,
  questionId: string
}
```

**Emits:** `results`

#### `getLeaderboard`
Request current leaderboard for a session.

**Data:**
```typescript
{
  sessionId: string
}
```

**Emits:** `leaderboard`

#### `leaveSession`
User leaves a session.

### Server → Client Events

#### `joinedSession`
Confirms student successfully joined a session.

**Data:**
```typescript
{
  sessionId: string,
  quizId: string,
  currentQuestionIndex: number
}
```

#### `sessionUpdate`
Updates about session state (e.g., student count).

**Data:**
```typescript
{
  connectedStudents: number,
  students: Array<{ userId: string, userName: string }>
}
```

#### `question`
New question broadcasted to students.

**Data:**
```typescript
Partial<Question> // Without correct answer info
```

#### `timerUpdate`
Timer countdown update.

**Data:**
```typescript
{
  timeLeft: number
}
```

#### `timeUp`
Time limit expired for a question.

**Data:**
```typescript
{
  questionId: string
}
```

#### `answerSubmitted`
Confirms answer submission.

**Data:**
```typescript
{
  questionId: string,
  isCorrect: boolean,
  pointsEarned: number
}
```

#### `results`
Results after a question.

**Data:**
```typescript
{
  questionId: string,
  leaderboard: Array<{
    rank: number,
    userId: string,
    name: string,
    score: number
  }>
}
```

#### `leaderboard`
Current leaderboard.

**Data:**
```typescript
{
  leaderboard: Array<{
    rank: number,
    userId: string,
    name: string,
    score: number
  }>
}
```

#### `error`
Error message.

**Data:**
```typescript
{
  message: string
}
```

## Flow Diagrams

### Teacher Flow

1. Create a quiz (existing functionality)
2. Create a session → `POST /api/sessions` → Get access code
3. Connect to socket.io
4. Join teacher room → `joinTeacherRoom`
5. Start session → `PATCH /api/sessions/:id/start`
6. For each question:
   - Broadcast question → `broadcastQuestion`
   - Wait for answers
   - Broadcast results → `broadcastResults`
7. End session → `DELETE /api/sessions/:id`

### Student Flow

1. Get access code from teacher
2. Join session → `GET /api/sessions/by-code/:code`
3. Connect to socket.io
4. Join session → `joinSession`
5. Receive questions → `question` event
6. Submit answers → `answer` event
7. Receive results → `results` event
8. View leaderboard → `leaderboard` event

## Data Storage

### Database (PostgreSQL)
- **sessions table:** Persistent session records
- **participations table:** Student participation records
- **answers table:** Student answers to questions

### In-Memory (sessionService)
- **activeSessions Map:** Active session state and connected users
- **accessCodeMap Map:** Quick lookup of sessions by access code

## Security Considerations

1. **Authentication:** All endpoints require JWT authentication
2. **Authorization:** Teacher-only endpoints checked via middleware
3. **Access Codes:** Unique 6-character codes prevent unauthorized access
4. **Answer Validation:** Server validates all answers (no trust in client)
5. **Correct Answer Hiding:** Correct answers never sent to students

## Testing

### Unit Tests
- `sessionController.test.ts`: 15 tests covering all controller endpoints
- `sessionService.test.ts`: 14 tests covering service functions

### Manual Testing
Run the manual test script:
```bash
cd backend
tsx src/test-manual/test-session-api.ts
```

## Future Improvements

1. **Redis Integration:** Move in-memory state to Redis for scalability
2. **Session Persistence:** Reconnection support after disconnects
3. **Room Cleanup:** Automatic cleanup of inactive sessions
4. **Rate Limiting:** Prevent spam on answer submissions
5. **Analytics:** Track session metrics and student performance
6. **Private Rooms:** Option for private vs public sessions

## Dependencies

- `socket.io`: ^4.7.0 - WebSocket server
- `express`: ^4.18.2 - HTTP server
- `pg`: ^8.11.3 - PostgreSQL client

## Configuration

No additional configuration required beyond existing environment variables in `.env`:
- `FRONTEND_URL`: For CORS configuration with Socket.io
- `PORT`: Server port (default: 3001)

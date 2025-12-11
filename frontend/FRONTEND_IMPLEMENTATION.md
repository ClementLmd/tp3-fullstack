# Frontend Implementation Guide - Socket.io Quiz Sessions

## Overview

This document describes the complete frontend implementation for real-time quiz sessions using Socket.io. All necessary components, hooks, and pages have been created to interact with the backend session management system.

## Architecture

### Custom Hooks

#### 1. Socket Management (`lib/hooks/useSocket.ts`)

Three specialized hooks for WebSocket communication:

**`useSocket(options)`** - Base hook
- Manages Socket.io connection lifecycle
- Handles connection/disconnection events
- Provides connection status and error states

**`useTeacherSocket(sessionId)`** - For teachers
- Joins teacher room for session management
- Tracks connected students in real-time
- Provides methods:
  - `broadcastQuestion(question)` - Send question to all students
  - `broadcastResults(questionId)` - Show results and leaderboard

**`useStudentSocket()`** - For students
- Manages student participation in sessions
- Receives questions, timer updates, and results
- Provides methods:
  - `joinSession(accessCode, userId, userName)` - Join with access code
  - `submitAnswer(questionId, answer)` - Submit answer to question
  - `leaveSession()` - Leave the session

#### 2. Session API (`lib/hooks/useSessions.ts`)

React Query hooks for REST API operations:

- `useCreateSession()` - Create new session
- `useSession(sessionId)` - Get session details
- `useStartSession()` - Activate a session
- `useBroadcastQuestion()` - Update current question
- `useEndSession()` - Terminate a session
- `useSessionByCode(accessCode)` - Find session by access code

## Teacher Workflow

### 1. Create Session (`/teacher/sessions/new`)

**Features:**
- Select from existing quizzes
- Pre-selection via URL parameter: `?quizId={id}`
- Displays quiz details (questions count, estimated time)
- Creates session with unique 6-character access code
- Auto-redirects to session control page

**UI Elements:**
- Quiz dropdown selector
- Selected quiz preview
- Info box explaining next steps
- Loading states and error handling

### 2. Control Session (`/teacher/sessions/[id]`)

**Main Dashboard:**
- Session status bar with:
  - Access code display (large, easy to share)
  - Active/waiting status
  - WebSocket connection status
  - Real-time student count
- Connected students list with names
- Session controls (Start, End)

**Question Broadcasting:**
- Current question display with:
  - Question text
  - All options (with correct answer highlighted when showing results)
  - Time limit indicator
  - Points value
- Action buttons:
  - "Broadcast Question" - Send to all students
  - "Show Results" - Display leaderboard
  - "Next Question" - Move to next
- Quiz overview sidebar:
  - Clickable question list
  - Quick navigation between questions
  - Current question highlighted

**Real-time Updates:**
- Student connection/disconnection notifications
- Live student count
- Timer synchronization across all clients

## Student Workflow

### 1. Join Session (`/student/join`)

**Features:**
- Access code input (6 characters, auto-uppercase)
- Real-time validation
- Error messages for invalid codes
- Auto-redirect to session on success

**UI Elements:**
- Large, centered access code input
- Clear instructions
- Loading state during join
- Info box with joining requirements

### 2. Participate in Session (`/student/session/[id]`)

**Question Display:**
- Timer countdown (visual indicator, changes color when < 10s)
- Question text (large, centered)
- Answer options:
  - **Multiple Choice:** Lettered buttons (A, B, C, D)
  - **True/False:** Large True/False buttons
  - **Text:** Text input area
- Submit button (disabled when time's up or no answer selected)

**Answer Feedback:**
- Immediate visual confirmation:
  - ✅ Green for correct answers
  - ❌ Red for incorrect answers
  - Points earned display
- Waiting message until results broadcast

**Results Display:**
- Leaderboard with rankings:
  - Top 3 highlighted (gold, silver, bronze)
  - User scores
  - Rank indicators
- Automatic transition to next question

**Connection Management:**
- Connection status indicator
- "Leave Session" button
- Auto-reconnection handling

## Navigation Integration

### Home Page Updates

**For Teachers:**
- "Host a Quiz" card → `/teacher/sessions/new`
- Quick access from authenticated home

**For Students:**
- "Join a Session" card → `/student/join`
- Prominent placement for easy access

### Quiz List Updates

**New Button per Quiz:**
- "🚀 Start Session" button
- Links to `/teacher/sessions/new?quizId={id}`
- Pre-selects quiz for immediate session creation

## Key Features

### Real-time Communication
- Instant question broadcasting to all students
- Live timer synchronization
- Real-time student connection tracking
- Leaderboard updates after each question

### User Experience
- Responsive design (mobile, tablet, desktop)
- Loading states and animations
- Error handling with user-friendly messages
- Visual feedback for all interactions
- Accessibility considerations (keyboard navigation, color contrast)

### State Management
- React Query for server state
- Socket.io for real-time state
- Local state for UI interactions
- Proper cleanup on component unmount

## Technical Details

### WebSocket Events Flow

**Teacher → Server:**
1. `joinTeacherRoom` - Enter session management room
2. `broadcastQuestion` - Send question to students
3. `broadcastResults` - Show results/leaderboard

**Student → Server:**
1. `joinSession` - Join with access code
2. `answer` - Submit answer
3. `leaveSession` - Exit session

**Server → Teacher:**
1. `sessionUpdate` - Student count/list updates
2. `error` - Error messages

**Server → Students:**
1. `joinedSession` - Successful join confirmation
2. `question` - New question received
3. `timerUpdate` - Timer countdown
4. `timeUp` - Time expired
5. `answerSubmitted` - Answer confirmation with correctness
6. `results` - Leaderboard after question
7. `error` - Error messages

### Error Handling

All pages implement:
- Network error recovery
- Invalid input validation
- Session not found handling
- Connection loss recovery
- User-friendly error messages

### Performance Optimizations

- React Query caching for API calls
- Optimistic UI updates
- Debounced input handling
- Lazy loading of components
- Memoization of expensive computations

## Usage Examples

### Teacher Starting a Session

```typescript
// 1. Navigate to create session
router.push('/teacher/sessions/new?quizId=quiz-123');

// 2. Session auto-created, redirected to control page
// 3. Start session
await startSession.mutateAsync(sessionId);

// 4. Broadcast questions
socketBroadcastQuestion(quiz.questions[0]);

// 5. Show results when ready
socketBroadcastResults(question.id);
```

### Student Joining and Answering

```typescript
// 1. Navigate to join page
router.push('/student/join');

// 2. Enter access code and join
const result = await joinSession('ABC123', userId, userName);

// 3. Auto-redirected to session page
// 4. Answer questions when they arrive
submitAnswer(questionId, selectedAnswer);

// 5. View results automatically when broadcasted
```

## Future Enhancements

Suggested improvements for the frontend:

1. **Offline Support:** Service worker for offline access
2. **Answer Review:** Allow students to review their answers
3. **Audio Feedback:** Sound effects for correct/incorrect answers
4. **Animations:** Smooth transitions between questions
5. **Chat Feature:** Real-time chat between participants
6. **Session History:** View past sessions and scores
7. **Export Results:** Download session results as PDF/CSV
8. **Accessibility:** Enhanced screen reader support
9. **Internationalization:** Multi-language support
10. **Mobile App:** React Native version

## Troubleshooting

### Common Issues

**Socket not connecting:**
- Check `NEXT_PUBLIC_WS_URL` environment variable
- Verify backend server is running
- Check browser console for errors

**Questions not appearing:**
- Verify session is started (status: active)
- Check socket connection status
- Refresh the page

**Access code not working:**
- Ensure code is uppercase
- Verify session is active
- Check code hasn't expired

**Timer not syncing:**
- Check socket connection
- Verify time_limit is set on question
- Check network latency

## Testing

All components can be tested using:

```bash
# Run frontend tests
cd frontend && pnpm test

# Type checking
pnpm typecheck

# Build check
pnpm build
```

## Deployment Notes

Environment variables required:

```env
# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

For production, replace with actual domain URLs and ensure:
- WebSocket connections are supported (no proxy issues)
- CORS is properly configured
- SSL/TLS for secure WebSocket (wss://)

## Conclusion

The frontend implementation provides a complete, production-ready interface for real-time quiz sessions. All components are fully typed with TypeScript, responsive, and follow React best practices. The implementation is tightly integrated with the backend socket.io system and provides an intuitive user experience for both teachers and students.

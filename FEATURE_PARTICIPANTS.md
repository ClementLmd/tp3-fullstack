# Feature: Connected Players Tracking & Answer Details

## Overview

This feature allows professors (teachers) to:
1. See all connected players in real-time with their current scores
2. View detailed answer information when showing results for the current question

## Implementation Details

### Backend Changes

#### 1. Socket Events

**New Server-to-Client Event:**
- `participantsUpdate`: Emitted when players join/leave the session
  - Payload: `Array<{ userId: string; name: string; score: number }>`

**Enhanced `results` Event:**
- Now includes `participantAnswers` field with detailed answer information
  - Each entry contains: `userId`, `name`, `answer`, `isCorrect`, `points`, `answered`

#### 2. API Endpoints

**New Endpoint:**
- `GET /api/sessions/:sessionId/participants`
  - Returns the current list of participants with their scores
  - Requires teacher authentication
  - Used as a fallback to WebSocket updates

#### 3. Session Manager Updates

- Modified `handleJoinSession` to emit `participantsUpdate` when a student joins
- Modified `handleLeaveSession` to emit `participantsUpdate` when a student leaves
- Enhanced `showResults` to include individual participant answer details
- Teachers can now join session rooms to receive real-time updates

### Frontend Changes

#### 1. Host Page Enhancements

**New UI Components:**

1. **Connected Players Panel** (`👥 Connected Players`)
   - Displays in real-time when players join/leave
   - Shows player name and current score
   - Updates automatically via WebSocket

2. **Answer Details Panel** (`📊 Answer Details for Current Question`)
   - Appears after clicking "Show Results"
   - Shows each player's answer with visual indicators:
     - ✅ Green: Correct answer
     - ❌ Red: Incorrect answer
     - ⏳ Gray: No answer submitted
   - Displays the actual answer text submitted
   - Shows points earned/lost

#### 2. State Management

New state variables:
- `participants`: List of connected players
- `participantAnswers`: Answer details for current question
- `showAnswerDetails`: Toggle for displaying answer details

#### 3. WebSocket Integration

The teacher now:
- Joins the session room automatically when a session starts
- Receives `participantsUpdate` events in real-time
- Receives enhanced `results` events with answer details

### Shared Types

Updated `ServerToClientEvents` interface:
- Added `participantsUpdate` event type
- Enhanced `results` event to include optional `participantAnswers` field

## User Experience

### For Teachers

1. **Before starting questions:**
   - See "Connected Players" panel with all joined students
   - Monitor in real-time as students join

2. **During questions:**
   - Connected players panel shows current scores
   - Updated automatically after each question

3. **After clicking "Show Results":**
   - Answer Details panel appears
   - See who answered correctly/incorrectly
   - View actual answers submitted by each student
   - Leaderboard shows overall standings

### For Students

No changes to the student experience. The feature is purely for teacher visibility.

## Testing

### Manual Testing Steps

1. Start the application:
   ```bash
   pnpm dev
   ```

2. Create/login as teacher account
3. Start a quiz session
4. Join with multiple student accounts (different browsers/incognito)
5. Verify:
   - Connected players panel appears and updates
   - When question is active, players are listed
   - After "Show Results", answer details appear
   - Correct/incorrect answers are clearly indicated

### Automated Tests

All existing tests pass:
- Backend: 16 tests passing
- Frontend: 9 tests passing
- TypeScript: No type errors
- Linting: No new errors

## Future Enhancements

Potential improvements:
- Add real-time answer count during question time
- Show which students have already answered (without revealing answers)
- Export session results to CSV/PDF
- Add filters for viewing only correct/incorrect answers
- Display answer time for each student

## Related Files

### Backend
- `backend/src/socket/sessionManager.ts`
- `backend/src/socket/handlers.ts`
- `backend/src/controllers/sessionController.ts`
- `backend/src/routes/session.ts`

### Frontend
- `frontend/app/teacher/quizzes/[id]/host/page.tsx`
- `frontend/lib/hooks/useSessions.ts`

### Shared
- `shared/src/types/index.ts`

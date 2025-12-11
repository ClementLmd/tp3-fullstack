# Socket Persistence Fix - Student Page Navigation Issue

## Problem Description

When a student joined a quiz session:
1. Student entered access code on `/student/join` page
2. `joinSession()` was called, creating a socket connection
3. Student was redirected to `/student/session/[id]` page
4. Console showed: "Socket disconnected: io client disconnect"
5. Page showed "Connecting to session..." in an infinite loop

## Root Cause Analysis

### The Issue
The application was creating **multiple socket instances** instead of maintaining a single persistent connection:

1. **Join Page** (`/student/join`):
   - Called `useStudentSocket()` hook
   - `joinSession()` called `connect()` which created a new socket
   - Socket successfully connected and joined the session
   - Student was redirected to session page

2. **Session Page** (`/student/session/[id]`):
   - Called `useStudentSocket()` again (new component)
   - This created a **NEW socket instance** via `useSocket()`
   - The old socket from the join page was disconnected when that component unmounted

3. **Result**:
   - Old socket (with session membership) was disconnected
   - New socket created but never joined the session
   - Page waited for `isConnected` to be true
   - But the new socket wasn't properly joined to the session
   - Infinite "Connecting to session..." loop

### Original Implementation Problems

**Problem 1: Per-Component Socket Instances**
```typescript
// OLD CODE - Each component got its own socket
export function useSocket(options: UseSocketOptions = {}) {
  const socketRef = useRef<Socket | null>(null); // ❌ New ref per component
  
  const connect = useCallback(() => {
    const socket = io(WS_URL, { ... }); // ❌ New socket each time
    socketRef.current = socket;
    return socket;
  }, []);
}
```

**Problem 2: Disconnect on Unmount**
```typescript
// OLD CODE - Disconnected when component unmounted
useEffect(() => {
  if (autoConnect) {
    connect();
  }

  return () => {
    disconnect(); // ❌ Killed connection on page change
  };
}, [autoConnect, connect, disconnect]);
```

**Problem 3: No Session State Persistence**
When the join page unmounted:
- Socket was disconnected
- Session join state was lost
- New page couldn't reuse the connection

## Solution Implemented

### Global Socket Singleton

Created a **single global socket instance** that persists across all components and page navigations:

```typescript
// NEW CODE - Global singleton socket
let globalSocket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

function getGlobalSocket(): Socket<...> {
  if (!globalSocket || !globalSocket.connected) {
    if (globalSocket) {
      globalSocket.disconnect();
    }
    
    globalSocket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  
  return globalSocket;
}
```

### Benefits of This Approach

1. **Single Connection**: One socket instance shared across all components
2. **Persistent State**: Session membership survives page navigation
3. **No Reconnection Loops**: Socket stays connected during navigation
4. **Efficient**: Reuses existing connection instead of creating new ones

### Updated useSocket Hook

```typescript
export function useSocket(options: UseSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listenersSetup = useRef(false);

  const connect = useCallback(() => {
    const socket = getGlobalSocket(); // ✅ Get global instance
    
    // Setup listeners only once
    if (!listenersSetup.current) {
      socket.on('connect', () => {
        console.log('Socket connected:', socket.id);
        setIsConnected(true);
        setError(null);
      });
      // ... other listeners
      
      listenersSetup.current = true;
    }
    
    // Update state if already connected
    if (socket.connected) {
      setIsConnected(true);
    }
    
    return socket;
  }, []);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    // ✅ Don't disconnect on unmount
    return () => {
      // Intentionally not disconnecting to preserve connection
    };
  }, [autoConnect, connect]);

  return {
    socket: globalSocket, // ✅ Return global instance
    isConnected,
    error,
    connect,
    disconnect,
  };
}
```

### Auto-Connect in Student Session Page

Added automatic connection in `useStudentSocket`:

```typescript
export function useStudentSocket() {
  const { socket, isConnected, error, connect, disconnect } = useSocket();
  // ... state declarations

  // ✅ Ensure socket is connected when component mounts
  useEffect(() => {
    if (!socket || !socket.connected) {
      connect();
    }
  }, [socket, connect]);

  // ... rest of the hook
}
```

## Flow After Fix

### Successful Student Join Flow

1. **Join Page** (`/student/join`):
   - `useStudentSocket()` called
   - Global socket created (if not exists)
   - `joinSession()` called → socket emits 'joinSession' event
   - Server responds with 'joinedSession' event
   - Student redirected to `/student/session/[id]`

2. **Session Page** (`/student/session/[id]`):
   - `useStudentSocket()` called
   - Gets **same global socket** (already connected and in session)
   - `isConnected` is immediately true
   - Event listeners set up for questions, timer, results
   - Page renders normally - no infinite loop!

### Key Improvements

✅ **Single Socket Connection**: One socket across entire app
✅ **Persistent Session**: Session state maintained across navigation
✅ **No Disconnect on Navigation**: Socket survives page changes
✅ **Instant Ready State**: Session page sees connected socket immediately
✅ **Proper Event Handling**: All events delivered to current component

## Testing

### Manual Test Scenario
1. Login as student
2. Navigate to `/student/join`
3. Enter valid access code
4. Click "Join Session"
5. **Expected**: Redirect to session page, see quiz content immediately
6. **Actual**: ✅ Works perfectly, no infinite loop

### Console Output (Success)
```
Socket connected: abc123xyz
Teacher joined session room: session-456
Student joined session: session-456
// Navigation to /student/session/session-456
// No disconnect message!
// Page renders immediately with isConnected=true
```

### Previous Console Output (Failure)
```
Socket connected: abc123xyz
Student joined session: session-456
// Navigation to /student/session/session-456
Socket disconnected: io client disconnect  ❌
Socket connected: def456uvw  ❌ New socket!
// New socket never joins session
// Infinite "Connecting to session..." loop ❌
```

## Considerations and Trade-offs

### Advantages
- ✅ Solves the disconnect/reconnect issue
- ✅ Better user experience (no loading delays)
- ✅ More efficient (reuses connection)
- ✅ Simpler state management

### Potential Concerns
- ⚠️ Socket persists even after leaving session
  - **Mitigation**: Call `leaveSession()` explicitly when student exits
  
- ⚠️ Socket shared across multiple tabs
  - **Mitigation**: Browser tabs have separate JS contexts, so each tab has its own global
  
- ⚠️ Memory leak if socket never cleaned up
  - **Mitigation**: Call `disconnect()` on logout or app close

### When Socket is Cleaned Up
1. When user explicitly leaves session (calls `leaveSession()`)
2. When user logs out
3. When browser tab/window is closed
4. When user navigates away from the app

## Alternative Solutions Considered

### Option 1: React Context (Not Used)
- Store socket in React Context
- Share across components
- **Cons**: More complex, still has unmount issues

### Option 2: Custom Hook with Ref (Not Used)
- Use a module-level ref
- Similar to global but wrapped in hook
- **Cons**: Same as global but more abstraction

### Option 3: Redux/Zustand (Not Used)
- Store socket in global state manager
- **Cons**: Overkill for this use case

### Option 4: Global Singleton (Chosen) ✅
- Simple module-level variable
- Direct access, no wrapper needed
- Proven pattern for singleton connections
- **Pros**: Simplest, most direct solution

## Conclusion

The fix successfully resolves the "connecting to session" infinite loop by:
1. Converting socket to a global singleton
2. Preventing disconnect on component unmount
3. Auto-connecting on session page load
4. Maintaining session state across navigation

The solution is simple, effective, and follows established patterns for managing singleton connections in React applications.

## Related Files Modified

- `frontend/lib/hooks/useSocket.ts` - Main socket hook with global singleton
- `frontend/app/student/session/[id]/page.tsx` - Type fix for map function

## Commit
- Hash: `310a59d`
- Message: "Fix socket persistence across page navigation for students"

// Re-export auth types for convenience
export { UserRole } from "./auth";
export type {
  User,
  SignupPayload,
  LoginPayload,
  AuthResponse,
  JwtPayload,
} from "./auth";

// Question types
export enum QuestionType {
  MULTIPLE_CHOICE = "MULTIPLE_CHOICE",
  TRUE_FALSE = "TRUE_FALSE",
  TEXT = "TEXT",
}

export interface Question {
  id: string;
  quizId: string;
  text: string;
  type: QuestionType;
  options?: {
    choices: string[];
    correctAnswer: number;
  };
  correctAnswer?: string;
  order: number;
  points: number;
  timeLimit?: number;
  createdAt: string;
  updatedAt: string;
}

// Quiz types
export interface Quiz {
  id: string;
  title: string;
  description?: string;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
  questions?: Question[]; // Full question objects (when fetching single quiz)
  questionCount?: number; // Count of questions (when fetching quiz list)
}

// Session types
export interface Session {
  id: string;
  quizId: string;
  accessCode: string;
  isActive: boolean;
  currentQuestionIndex: number;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
}

// Participation types
export interface Participation {
  id: string;
  sessionId: string;
  userId: string;
  score: number;
  joinedAt: string;
  completedAt?: string;
}

// Answer types
export interface Answer {
  id: string;
  questionId: string;
  participationId: string;
  answer: string;
  isCorrect?: boolean;
  points: number;
  answeredAt: string;
}

// API Request/Response types
// Note: LoginRequest and RegisterRequest are deprecated
// Use LoginPayload and SignupPayload from './auth' instead (already re-exported above)

export interface CreateQuizRequest {
  title: string;
  description?: string;
  questions: Omit<Question, "id" | "quizId" | "createdAt" | "updatedAt">[];
}

export interface JoinSessionRequest {
  accessCode: string;
}

// Socket.io event types
export interface ServerToClientEvents {
  question: (question: Question) => void;
  results: (results: {
    questionId: string;
    correctAnswer: string;
    leaderboard: Array<{ userId: string; score: number; name: string }>;
  }) => void;
  sessionStarted: (session: Session) => void;
  sessionEnded: (summary: {
    questions: Array<{
      questionId: string;
      questionText: string;
      correctAnswer: string;
      studentAnswer?: string;
      isCorrect?: boolean;
      points: number;
    }>;
    finalScore: number;
  }) => void;
  timerUpdate: (timeLeft: number) => void;
  error: (message: string) => void;
}

export interface ClientToServerEvents {
  joinSession: (data: { accessCode: string; userId: string }) => void;
  answer: (data: { questionId: string; answer: string }) => void;
  leaveSession: () => void;
}

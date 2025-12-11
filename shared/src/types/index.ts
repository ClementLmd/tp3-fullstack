// User types
export enum UserRole {
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

// Question types
export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TRUE_FALSE = 'TRUE_FALSE',
  TEXT = 'TEXT',
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
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface CreateQuizRequest {
  title: string;
  description?: string;
  questions: Omit<Question, 'id' | 'quizId' | 'createdAt' | 'updatedAt'>[];
}

export interface JoinSessionRequest {
  accessCode: string;
}

// Socket.io event types
export interface ServerToClientEvents {
  question: (question: Question) => void;
  results: (results: {
    questionId: string;
    leaderboard: Array<{ userId: string; score: number; name: string }>;
  }) => void;
  sessionStarted: (session: Session) => void;
  sessionEnded: () => void;
  timerUpdate: (timeLeft: number) => void;
  error: (message: string) => void;
}

export interface ClientToServerEvents {
  joinSession: (data: { accessCode: string; userId: string }) => void;
  answer: (data: { questionId: string; answer: string }) => void;
  leaveSession: () => void;
}


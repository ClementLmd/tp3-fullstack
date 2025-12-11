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
  questions?: Question[];
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
  question: (question: Partial<Question>) => void;
  results: (results: {
    questionId: string;
    leaderboard: Array<{ rank: number; userId: string; score: number; name: string }>;
  }) => void;
  sessionStarted: (session: Session) => void;
  sessionEnded: () => void;
  timerUpdate: (data: { timeLeft: number }) => void;
  timeUp: (data: { questionId: string }) => void;
  error: (error: { message: string }) => void;
  joinedSession: (data: { sessionId: string; quizId: string; currentQuestionIndex: number }) => void;
  sessionUpdate: (data: { connectedStudents: number; students: Array<{ userId: string; userName: string }> }) => void;
  answerSubmitted: (data: { questionId: string; isCorrect: boolean; pointsEarned: number }) => void;
  leaderboard: (data: { leaderboard: Array<{ rank: number; userId: string; name: string; score: number }> }) => void;
}

export interface ClientToServerEvents {
  joinSession: (data: { accessCode: string; userId: string; userName: string }) => void;
  joinTeacherRoom: (data: { sessionId: string }) => void;
  answer: (data: { questionId: string; answer: string }) => void;
  leaveSession: () => void;
  broadcastQuestion: (data: { sessionId: string; question: Question }) => void;
  broadcastResults: (data: { sessionId: string; questionId: string }) => void;
  getLeaderboard: (data: { sessionId: string }) => void;
}


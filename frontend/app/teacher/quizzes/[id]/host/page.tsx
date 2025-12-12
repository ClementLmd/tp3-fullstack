"use client";

/**
 * Host Quiz Session Page (Teacher)
 *
 * Allows teacher to:
 * 1. Start a session from a quiz
 * 2. Control the session (next question, show results, end)
 * 3. See real-time participant count and leaderboard
 */

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import { UserRole } from "shared/src/types";
import { useQuiz } from "@/lib/hooks/useQuizzes";
import {
  useStartSession,
  useNextQuestion,
  useShowResults,
  useEndSession,
  useSession,
} from "@/lib/hooks/useSessions";
import { useWebSocket } from "@/lib/hooks/useWebSocket";
import type { Question } from "shared/src/types";

interface ParticipantAnswer {
  userId: string;
  name: string;
  answer?: string;
  isCorrect?: boolean;
  points: number;
  answered: boolean;
}

export default function HostQuizPage() {
  const router = useRouter();
  const params = useParams();
  const quizId = params?.id as string;

  const { data: quiz, isLoading: quizLoading } = useQuiz(quizId);
  const startSession = useStartSession();
  const nextQuestion = useNextQuestion();
  const showResults = useShowResults();
  const endSession = useEndSession();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(-1);
  const [leaderboard, setLeaderboard] = useState<
    Array<{ userId: string; score: number; name: string }>
  >([]);
  const [participants, setParticipants] = useState<
    Array<{ userId: string; name: string; score: number }>
  >([]);
  const [participantAnswers, setParticipantAnswers] = useState<ParticipantAnswer[]>([]);
  const [showAnswerDetails, setShowAnswerDetails] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [participantCount, setParticipantCount] = useState(0);

  const { socket, isConnected } = useWebSocket();
  const { data: session } = useSession(sessionId);

  // Join session room when session is created
  useEffect(() => {
    if (socket && session?.accessCode) {
      socket.emit("joinSession", { accessCode: session.accessCode, userId: "" });
      console.log("Teacher joined session room:", session.accessCode);
    }
  }, [socket, session?.accessCode]);

  // Listen to WebSocket events
  useEffect(() => {
    if (!socket) return;

    socket.on("question", (question: Question) => {
      setCurrentQuestion(question);
      setTimeLeft(question.timeLimit || null);
      setShowAnswerDetails(false);
      setParticipantAnswers([]);
      // Update question index based on quiz questions
      if (quiz?.questions) {
        const index = quiz.questions.findIndex((q) => q.id === question.id);
        if (index !== -1) {
          setCurrentQuestionIndex(index);
        }
      }
    });

    socket.on("results", (data) => {
      setLeaderboard(data.leaderboard);
      setParticipantCount(data.leaderboard.length);
      if (data.participantAnswers) {
        setParticipantAnswers(data.participantAnswers);
        setShowAnswerDetails(true);
      }
    });

    socket.on("participantsUpdate", (updatedParticipants) => {
      setParticipants(updatedParticipants);
      setParticipantCount(updatedParticipants.length);
    });

    socket.on("sessionEnded", () => {
      alert("Session terminée !");
      router.push(`/teacher/quizzes/${quizId}`);
    });

    socket.on("timerUpdate", (time: number) => {
      setTimeLeft(time);
    });

    socket.on("error", (message: string) => {
      alert(`Erreur: ${message}`);
    });

    return () => {
      socket.off("question");
      socket.off("results");
      socket.off("participantsUpdate");
      socket.off("sessionEnded");
      socket.off("timerUpdate");
      socket.off("error");
    };
  }, [socket, quizId, router, quiz]);

  const handleStartSession = async () => {
    try {
      const session = await startSession.mutateAsync({ quizId });
      setSessionId(session.id);
    } catch (error) {
      console.error("Failed to start session:", error);
      alert("Failed to start session");
    }
  };

  const handleNextQuestion = async () => {
    if (!sessionId) return;
    try {
      setShowAnswerDetails(false);
      setParticipantAnswers([]);
      await nextQuestion.mutateAsync(sessionId);
      // Update question index after sending next question
      setCurrentQuestionIndex((prev) => prev + 1);
      // Set current question from quiz if available
      if (quiz?.questions && currentQuestionIndex + 1 < quiz.questions.length) {
        setCurrentQuestion(quiz.questions[currentQuestionIndex + 1]);
        setTimeLeft(quiz.questions[currentQuestionIndex + 1].timeLimit || null);
      } else {
        // No more questions
        setCurrentQuestion(null);
      }
    } catch (error) {
      console.error("Failed to move to next question:", error);
      alert("Failed to move to next question");
    }
  };

  const handleShowResults = async () => {
    if (!sessionId) return;
    try {
      await showResults.mutateAsync(sessionId);
    } catch (error) {
      console.error("Failed to show results:", error);
      alert("Failed to show results");
    }
  };

  const handleEndSession = async () => {
    if (!sessionId) return;
    if (!confirm("Are you sure you want to end this session?")) return;

    try {
      await endSession.mutateAsync(sessionId);
      router.push(`/teacher/quizzes/${quizId}`);
    } catch (error) {
      console.error("Failed to end session:", error);
      alert("Failed to end session");
    }
  };

  if (quizLoading) {
    return (
      <AuthGuard roles={[UserRole.TEACHER]}>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
            <p className="text-slate-300 mt-4">Loading quiz...</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (!quiz) {
    return (
      <AuthGuard roles={[UserRole.TEACHER]}>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-400 text-xl">Quiz not found</p>
            <button
              onClick={() => router.push("/teacher/quizzes")}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg"
            >
              Back to Quizzes
            </button>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard roles={[UserRole.TEACHER]}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push(`/teacher/quizzes/${quizId}`)}
              className="mb-4 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition"
            >
              ← Back to Quiz
            </button>
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
              Host Quiz: {quiz.title}
            </h1>
            <p className="text-slate-300 mt-2">
              {quiz.questions?.length || 0} questions ready
            </p>
          </div>

          {/* Session not started */}
          {!sessionId && (
            <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl p-8 border border-purple-400/30">
              <div className="text-center">
                <div className="text-6xl mb-4">🎯</div>
                <h2 className="text-2xl font-bold text-purple-300 mb-4">
                  Ready to Start?
                </h2>
                <p className="text-slate-300 mb-6">
                  Start a live session for your students. They will join using
                  an access code.
                </p>
                <button
                  onClick={handleStartSession}
                  disabled={startSession.isPending || !isConnected}
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold shadow-lg hover:from-purple-700 hover:to-pink-700 transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {startSession.isPending
                    ? "Starting..."
                    : !isConnected
                    ? "Connecting..."
                    : "Start Session"}
                </button>
              </div>
            </div>
          )}

          {/* Session active */}
          {sessionId && session && (
            <div className="space-y-6">
              {/* Access Code Card */}
              <div className="bg-gradient-to-br from-emerald-800 to-teal-800 rounded-xl p-6 border border-emerald-400/50">
                <div className="text-center">
                  <p className="text-emerald-200 text-sm mb-2">Access Code</p>
                  <p className="text-6xl font-black text-white mb-4 font-mono">
                    {session.accessCode}
                  </p>
                  <p className="text-emerald-300 text-sm">
                    Share this code with your students to join
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        isConnected ? "bg-green-500" : "bg-red-500"
                      }`}
                    ></div>
                    <span className="text-sm text-slate-300">
                      {isConnected ? "Connected" : "Disconnected"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Connected Players */}
              {participants.length > 0 && (
                <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-6 border border-cyan-400/30">
                  <h3 className="text-xl font-bold text-cyan-300 mb-4">
                    👥 Connected Players ({participants.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {participants.map((participant) => (
                      <div
                        key={participant.userId}
                        className="flex items-center justify-between p-3 bg-slate-700 rounded-lg"
                      >
                        <span className="text-white font-medium">
                          {participant.name}
                        </span>
                        <span className="text-cyan-400 font-bold">
                          {participant.score} pts
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Current Question */}
              {currentQuestion && (
                <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-6 border border-blue-400/30">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-blue-300">
                      Current Question
                    </h3>
                    {timeLeft !== null && (
                      <div className="text-2xl font-bold text-cyan-400">
                        ⏱️ {timeLeft}s
                      </div>
                    )}
                  </div>
                  <p className="text-white text-lg mb-4">
                    {currentQuestion.text}
                  </p>
                  {currentQuestion.type === "MULTIPLE_CHOICE" &&
                    currentQuestion.options && (
                      <div className="space-y-2">
                        {(
                          currentQuestion.options as { choices: string[] }
                        ).choices.map((choice, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-slate-700 rounded-lg text-slate-200"
                          >
                            {String.fromCharCode(65 + idx)}. {choice}
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              )}

              {/* Answer Details (shown after clicking Show Results) */}
              {showAnswerDetails && participantAnswers.length > 0 && (
                <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-6 border border-purple-400/30">
                  <h3 className="text-xl font-bold text-purple-300 mb-4">
                    📊 Answer Details for Current Question
                  </h3>
                  <div className="space-y-2">
                    {participantAnswers.map((pa) => (
                      <div
                        key={pa.userId}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          pa.answered
                            ? pa.isCorrect
                              ? "bg-green-900/30 border border-green-500/50"
                              : "bg-red-900/30 border border-red-500/50"
                            : "bg-slate-700 border border-slate-500/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">
                            {pa.answered ? (pa.isCorrect ? "✅" : "❌") : "⏳"}
                          </span>
                          <div>
                            <span className="text-white font-semibold">
                              {pa.name}
                            </span>
                            {pa.answered && pa.answer && (
                              <p className="text-sm text-slate-300">
                                Answer: {pa.answer}
                              </p>
                            )}
                            {!pa.answered && (
                              <p className="text-sm text-slate-400">
                                No answer submitted
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <span
                            className={`font-bold ${
                              pa.answered
                                ? pa.isCorrect
                                  ? "text-green-400"
                                  : "text-red-400"
                                : "text-slate-400"
                            }`}
                          >
                            {pa.points > 0 ? `+${pa.points}` : pa.points} pts
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Leaderboard */}
              {leaderboard.length > 0 && (
                <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-6 border border-yellow-400/30">
                  <h3 className="text-xl font-bold text-yellow-300 mb-4">
                    🏆 Leaderboard ({participantCount} participants)
                  </h3>
                  <div className="space-y-2">
                    {leaderboard.map((entry, idx) => (
                      <div
                        key={entry.userId}
                        className="flex items-center justify-between p-3 bg-slate-700 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">
                            {idx === 0
                              ? "🥇"
                              : idx === 1
                              ? "🥈"
                              : idx === 2
                              ? "🥉"
                              : "📊"}
                          </span>
                          <span className="text-white font-semibold">
                            {entry.name}
                          </span>
                        </div>
                        <span className="text-yellow-400 font-bold">
                          {entry.score} pts
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Controls */}
              <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-6 border border-purple-400/30">
                <h3 className="text-lg font-bold text-purple-300 mb-4 text-center">
                  Session Controls
                </h3>
                {quiz && (
                  <p className="text-slate-400 text-sm text-center mb-4">
                    Question {currentQuestionIndex + 1} of{" "}
                    {quiz.questions?.length || 0}
                  </p>
                )}
                <div className="flex flex-wrap gap-4 justify-center">
                  {currentQuestionIndex === -1 && (
                    <button
                      onClick={handleNextQuestion}
                      disabled={nextQuestion.isPending}
                      className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700 transition transform hover:scale-105 disabled:opacity-50 text-lg"
                    >
                      {nextQuestion.isPending
                        ? "Loading..."
                        : "▶️ Start First Question"}
                    </button>
                  )}
                  {currentQuestionIndex >= 0 && (
                    <>
                      <button
                        onClick={handleShowResults}
                        disabled={showResults.isPending}
                        className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-lg font-semibold hover:from-yellow-700 hover:to-orange-700 transition transform hover:scale-105 disabled:opacity-50"
                      >
                        {showResults.isPending
                          ? "Loading..."
                          : "📊 Show Results"}
                      </button>
                      {quiz &&
                        currentQuestionIndex + 1 <
                          (quiz.questions?.length || 0) && (
                          <button
                            onClick={handleNextQuestion}
                            disabled={nextQuestion.isPending}
                            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700 transition transform hover:scale-105 disabled:opacity-50 text-lg"
                          >
                            {nextQuestion.isPending
                              ? "Loading..."
                              : "➡️ Next Question"}
                          </button>
                        )}
                    </>
                  )}
                  <button
                    onClick={handleEndSession}
                    disabled={endSession.isPending}
                    className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-semibold hover:from-red-700 hover:to-red-800 transition transform hover:scale-105 disabled:opacity-50"
                  >
                    {endSession.isPending ? "Ending..." : "⏹️ End Session"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}

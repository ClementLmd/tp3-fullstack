"use client";

/**
 * Join Quiz Session Page (Student)
 *
 * Allows student to:
 * 1. Enter an access code to join a session
 * 2. See and answer questions in real-time
 * 3. See their score and leaderboard
 */

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import { UserRole } from "shared/src/types";
import { useWebSocket } from "@/lib/hooks/useWebSocket";
import { useAuthStore } from "@/lib/store/authStore";
import type { Question } from "shared/src/types";

export default function JoinSessionPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [accessCode, setAccessCode] = useState("");
  const [hasJoined, setHasJoined] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [hasAnswered, setHasAnswered] = useState(false);
  const [leaderboard, setLeaderboard] = useState<
    Array<{ userId: string; score: number; name: string }>
  >([]);
  const [myScore, setMyScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
  const [quizSummary, setQuizSummary] = useState<{
    questions: Array<{
      questionId: string;
      questionText: string;
      correctAnswer: string;
      studentAnswer?: string;
      isCorrect?: boolean;
      points: number;
    }>;
    finalScore: number;
  } | null>(null);

  const { socket, isConnected, joinSession, submitAnswer } = useWebSocket();

  // Listen to WebSocket events
  useEffect(() => {
    if (!socket) return;

    socket.on("sessionStarted", () => {
      setHasJoined(true);
    });

    socket.on("question", (question: Question) => {
      setCurrentQuestion(question);
      setSelectedAnswer("");
      setHasAnswered(false);
      setTimeLeft(question.timeLimit || null);
      setIsTimeUp(false); // Reset time up state for new question
      setCorrectAnswer(null); // Reset correct answer for new question
    });

    socket.on("results", (data) => {
      setLeaderboard(data.leaderboard);
      setCorrectAnswer(data.correctAnswer); // Show correct answer
      // Find my score
      const myEntry = data.leaderboard.find((e) => e.userId === user?.id);
      if (myEntry) {
        setMyScore(myEntry.score);
      }
    });

    socket.on("sessionEnded", (summary) => {
      setQuizSummary(summary);
      setSessionEnded(true);
    });

    socket.on("timerUpdate", (time: number) => {
      // Ensure timer doesn't go negative
      const safeTime = Math.max(0, time);
      setTimeLeft(safeTime);
      // Disable answering when timer reaches 0
      if (safeTime === 0) {
        setIsTimeUp(true);
      }
    });

    socket.on("error", (message: string) => {
      alert(`Erreur: ${message}`);
    });

    return () => {
      socket.off("sessionStarted");
      socket.off("question");
      socket.off("results");
      socket.off("sessionEnded");
      socket.off("timerUpdate");
      socket.off("error");
    };
  }, [socket, user]);

  const handleJoin = () => {
    if (!accessCode.trim()) {
      alert("Please enter an access code");
      return;
    }
    if (!user) {
      alert("You must be logged in");
      return;
    }
    if (!isConnected) {
      alert("Not connected to server. Please wait...");
      return;
    }

    joinSession(accessCode.toUpperCase(), user.id);
  };

  const handleSubmitAnswer = () => {
    if (!currentQuestion || !selectedAnswer) {
      alert("Please select an answer");
      return;
    }
    if (hasAnswered) {
      alert("You have already answered this question");
      return;
    }
    if (isTimeUp) {
      alert("Time is up! You can no longer answer this question.");
      return;
    }

    submitAnswer(currentQuestion.id, selectedAnswer);
    setHasAnswered(true);
  };

  if (sessionEnded) {
    return (
      <AuthGuard roles={[UserRole.STUDENT]}>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-green-300 to-emerald-300 bg-clip-text text-transparent mb-4">
                Quiz Terminé !
              </h2>
              <div className="bg-gradient-to-br from-yellow-800 to-orange-800 rounded-xl p-6 border border-yellow-400/50 inline-block">
                <p className="text-yellow-200 text-sm mb-2">Score Final</p>
                <p className="text-5xl font-black text-white">
                  {quizSummary?.finalScore || myScore}
                </p>
                <p className="text-yellow-300 text-sm mt-2">points</p>
              </div>
            </div>

            {/* Quiz Summary */}
            {quizSummary && quizSummary.questions.length > 0 && (
              <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden mb-8">
                <div className="p-6 border-b border-slate-700">
                  <h3 className="text-2xl font-bold text-white">
                    📋 Récapitulatif des Questions
                  </h3>
                </div>
                <div className="divide-y divide-slate-700">
                  {quizSummary.questions.map((q, index) => (
                    <div key={q.questionId} className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="text-lg font-bold text-blue-300">
                              Question {index + 1}
                            </span>
                            {q.isCorrect !== undefined && (
                              <span
                                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                  q.isCorrect
                                    ? "bg-green-500/20 text-green-300"
                                    : "bg-red-500/20 text-red-300"
                                }`}
                              >
                                {q.isCorrect ? "✅ Correct" : "❌ Incorrect"}
                              </span>
                            )}
                            {q.points > 0 && (
                              <span className="text-yellow-300 text-sm">
                                +{q.points} points
                              </span>
                            )}
                          </div>
                          <p className="text-white text-lg mb-4">
                            {q.questionText}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                          <p className="text-green-300 text-sm font-semibold mb-1">
                            ✅ Bonne réponse:
                          </p>
                          <p className="text-white">{q.correctAnswer}</p>
                        </div>
                        {q.studentAnswer !== undefined && (
                          <div
                            className={`p-3 rounded-lg border ${
                              q.isCorrect
                                ? "bg-green-500/10 border-green-500/30"
                                : "bg-red-500/10 border-red-500/30"
                            }`}
                          >
                            <p
                              className={`text-sm font-semibold mb-1 ${
                                q.isCorrect ? "text-green-300" : "text-red-300"
                              }`}
                            >
                              {q.isCorrect ? "✅" : "❌"} Votre réponse:
                            </p>
                            <p className="text-white">{q.studentAnswer}</p>
                          </div>
                        )}
                        {q.studentAnswer === undefined && (
                          <div className="p-3 bg-slate-700/50 border border-slate-600 rounded-lg">
                            <p className="text-slate-400 text-sm">
                              ⏱️ Aucune réponse soumise (temps écoulé)
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Back Button */}
            <div className="text-center">
              <button
                onClick={() => router.push("/dashboard")}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700 transition transform hover:scale-105"
              >
                Retour au Dashboard
              </button>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard roles={[UserRole.STUDENT]}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
              Join Quiz Session
            </h1>
            <p className="text-slate-300 mt-2">
              Enter the access code provided by your teacher
            </p>
          </div>

          {/* Join Form */}
          {!hasJoined && (
            <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl p-8 border border-cyan-400/30">
              <div className="text-center">
                <div className="text-6xl mb-4">🚀</div>
                <div className="mb-6">
                  <label className="block text-slate-300 mb-2 font-semibold">
                    Access Code
                  </label>
                  <input
                    type="text"
                    value={accessCode}
                    onChange={(e) =>
                      setAccessCode(e.target.value.toUpperCase().slice(0, 6))
                    }
                    placeholder="ABC123"
                    className="w-full max-w-xs mx-auto px-6 py-4 text-center text-3xl font-mono bg-slate-900 border border-cyan-400/50 rounded-lg text-white focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                    maxLength={6}
                  />
                </div>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      isConnected ? "bg-green-500" : "bg-red-500"
                    }`}
                  ></div>
                  <span className="text-sm text-slate-300">
                    {isConnected ? "Connected" : "Connecting..."}
                  </span>
                </div>
                <button
                  onClick={handleJoin}
                  disabled={!isConnected || !accessCode.trim()}
                  className="px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg font-semibold shadow-lg hover:from-cyan-700 hover:to-blue-700 transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Join Session
                </button>
              </div>
            </div>
          )}

          {/* Quiz Interface */}
          {hasJoined && (
            <div className="space-y-6">
              {/* Score Display */}
              <div className="bg-gradient-to-br from-yellow-800 to-orange-800 rounded-xl p-6 border border-yellow-400/50 text-center">
                <p className="text-yellow-200 text-sm mb-2">Your Score</p>
                <p className="text-5xl font-black text-white">{myScore}</p>
                <p className="text-yellow-300 text-sm mt-2">points</p>
              </div>

              {/* Current Question */}
              {currentQuestion && (
                <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-8 border border-blue-400/30">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-blue-300">
                      Question
                    </h3>
                    {timeLeft !== null && (
                      <div className="text-2xl font-bold text-red-400">
                        ⏱️ {timeLeft}s
                      </div>
                    )}
                  </div>
                  <p className="text-white text-xl mb-6">
                    {currentQuestion.text}
                  </p>

                  {/* Multiple Choice Options */}
                  {currentQuestion.type === "MULTIPLE_CHOICE" &&
                    currentQuestion.options && (
                      <div className="space-y-3">
                        {(
                          currentQuestion.options as { choices: string[] }
                        ).choices.map((choice, idx) => (
                          <button
                            key={idx}
                            onClick={() => !isTimeUp && setSelectedAnswer(choice)}
                            disabled={hasAnswered || isTimeUp}
                            className={`w-full p-4 rounded-lg text-left transition ${
                              selectedAnswer === choice
                                ? "bg-blue-600 border-2 border-blue-400"
                                : "bg-slate-700 border-2 border-slate-600 hover:border-blue-500"
                            } ${
                              hasAnswered || isTimeUp
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                          >
                            <span className="text-white font-semibold">
                              {String.fromCharCode(65 + idx)}. {choice}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                  {/* True/False Options */}
                  {currentQuestion.type === "TRUE_FALSE" && (
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => !isTimeUp && setSelectedAnswer("true")}
                        disabled={hasAnswered || isTimeUp}
                        className={`p-6 rounded-lg font-semibold transition ${
                          selectedAnswer === "true"
                            ? "bg-green-600 border-2 border-green-400"
                            : "bg-slate-700 border-2 border-slate-600 hover:border-green-500"
                        } ${
                          hasAnswered || isTimeUp
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        <span className="text-white text-lg">✅ True</span>
                      </button>
                      <button
                        onClick={() => !isTimeUp && setSelectedAnswer("false")}
                        disabled={hasAnswered || isTimeUp}
                        className={`p-6 rounded-lg font-semibold transition ${
                          selectedAnswer === "false"
                            ? "bg-red-600 border-2 border-red-400"
                            : "bg-slate-700 border-2 border-slate-600 hover:border-red-500"
                        } ${
                          hasAnswered || isTimeUp
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        <span className="text-white text-lg">❌ False</span>
                      </button>
                    </div>
                  )}

                  {/* Text Input */}
                  {currentQuestion.type === "TEXT" && (
                    <input
                      type="text"
                      value={selectedAnswer}
                      onChange={(e) => !isTimeUp && setSelectedAnswer(e.target.value)}
                      disabled={hasAnswered || isTimeUp}
                      placeholder="Type your answer..."
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    />
                  )}

                  {/* Time Up Message */}
                  {isTimeUp && !hasAnswered && (
                    <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-center">
                      <p className="text-red-300 font-semibold">
                        ⏱️ Time is up! You can no longer answer this question.
                      </p>
                    </div>
                  )}

                  {/* Correct Answer Display */}
                  {correctAnswer && (
                    <div className="mt-4 p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
                      <p className="text-green-300 font-semibold mb-2">
                        ✅ Correct Answer:
                      </p>
                      <p className="text-white text-lg">{correctAnswer}</p>
                    </div>
                  )}

                  {/* Submit Button */}
                  {!hasAnswered && !isTimeUp && (
                    <button
                      onClick={handleSubmitAnswer}
                      disabled={!selectedAnswer}
                      className="mt-6 w-full px-6 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg font-semibold hover:from-cyan-700 hover:to-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Submit Answer
                    </button>
                  )}

                  {hasAnswered && (
                    <div className="mt-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-center">
                      <p className="text-green-300 font-semibold">
                        ✓ Answer submitted! Waiting for results...
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Waiting for question */}
              {!currentQuestion && (
                <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-12 border border-purple-400/30 text-center">
                  <div className="text-6xl mb-4">⏳</div>
                  <p className="text-purple-300 text-xl font-semibold">
                    Waiting for next question...
                  </p>
                  <p className="text-slate-400 mt-2">
                    The teacher will send questions soon
                  </p>
                </div>
              )}

              {/* Leaderboard */}
              {leaderboard.length > 0 && (
                <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-6 border border-yellow-400/30">
                  <h3 className="text-xl font-bold text-yellow-300 mb-4">
                    🏆 Leaderboard
                  </h3>
                  <div className="space-y-2">
                    {leaderboard.map((entry, idx) => (
                      <div
                        key={entry.userId}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          entry.userId === user?.id
                            ? "bg-yellow-500/20 border border-yellow-500/50"
                            : "bg-slate-700"
                        }`}
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
                          <span
                            className={`font-semibold ${
                              entry.userId === user?.id
                                ? "text-yellow-300"
                                : "text-white"
                            }`}
                          >
                            {entry.name}
                            {entry.userId === user?.id && " (You)"}
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
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}

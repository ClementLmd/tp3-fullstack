"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import { UserRole, QuestionType } from 'shared/src/types';
import { useSession, useStartSession, useEndSession, useBroadcastQuestion } from '@/lib/hooks/useSessions';
import { useQuiz } from '@/lib/hooks/useQuizzes';
import { useTeacherSocket } from '@/lib/hooks/useSocket';

export default function TeacherSessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const { data: session, isLoading: loadingSession } = useSession(sessionId);
  const { data: quiz, isLoading: loadingQuiz } = useQuiz(session?.quizId || null);
  const startSession = useStartSession();
  const endSession = useEndSession();
  const broadcastQuestion = useBroadcastQuestion();

  const {
    isConnected,
    connectedStudents,
    students,
    broadcastQuestion: socketBroadcastQuestion,
    broadcastResults: socketBroadcastResults,
  } = useTeacherSocket(sessionId);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const handleStartSession = async () => {
    try {
      await startSession.mutateAsync(sessionId);
    } catch (err) {
      console.error('Failed to start session:', err);
      alert('Failed to start session');
    }
  };

  const handleBroadcastQuestion = async () => {
    if (!quiz?.questions || currentQuestionIndex >= quiz.questions.length) return;

    const question = quiz.questions[currentQuestionIndex];
    
    try {
      // First, update backend state
      await broadcastQuestion.mutateAsync({
        sessionId,
        questionIndex: currentQuestionIndex,
      });

      // Then broadcast via socket
      socketBroadcastQuestion(question);
      setShowResults(false);
    } catch (err) {
      console.error('Failed to broadcast question:', err);
      alert('Failed to broadcast question');
    }
  };

  const handleShowResults = () => {
    if (!quiz?.questions) return;
    const question = quiz.questions[currentQuestionIndex];
    socketBroadcastResults(question.id);
    setShowResults(true);
  };

  const handleNextQuestion = () => {
    if (!quiz?.questions || currentQuestionIndex >= quiz.questions.length - 1) return;
    setCurrentQuestionIndex((prev) => prev + 1);
    setShowResults(false);
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex <= 0) return;
    setCurrentQuestionIndex((prev) => prev - 1);
    setShowResults(false);
  };

  const handleEndSession = async () => {
    if (!confirm('Are you sure you want to end this session? This cannot be undone.')) {
      return;
    }

    try {
      await endSession.mutateAsync(sessionId);
      router.push('/teacher/quizzes');
    } catch (err) {
      console.error('Failed to end session:', err);
      alert('Failed to end session');
    }
  };

  if (loadingSession || loadingQuiz) {
    return (
      <AuthGuard roles={[UserRole.TEACHER]}>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400 mb-4"></div>
            <p className="text-slate-300 text-lg">Loading session...</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (!session || !quiz) {
    return (
      <AuthGuard roles={[UserRole.TEACHER]}>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-red-400 mb-2">Session Not Found</h2>
            <button
              onClick={() => router.push('/teacher/quizzes')}
              className="mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold"
            >
              Back to Quizzes
            </button>
          </div>
        </div>
      </AuthGuard>
    );
  }

  const currentQuestion = quiz.questions?.[currentQuestionIndex];
  const hasMoreQuestions = quiz.questions && currentQuestionIndex < quiz.questions.length - 1;

  return (
    <AuthGuard roles={[UserRole.TEACHER]}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
                {quiz.title}
              </h1>
              <button
                onClick={handleEndSession}
                className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-semibold hover:from-red-700 hover:to-red-800 transition"
              >
                End Session
              </button>
            </div>

            {/* Session Status Bar */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-4 border border-blue-400/30 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-slate-400 text-sm">Access Code:</span>
                  <div className="text-2xl font-bold text-cyan-300 font-mono">{session.accessCode}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-sm">Status:</span>
                  <div className={`text-lg font-semibold ${session.isActive ? 'text-emerald-400' : 'text-yellow-400'}`}>
                    {session.isActive ? '🔴 Live' : '⏸️ Waiting'}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 text-sm">Socket:</span>
                  <div className={`text-lg font-semibold ${isConnected ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isConnected ? '✓ Connected' : '✗ Disconnected'}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 text-sm">Students:</span>
                  <div className="text-lg font-semibold text-blue-300">👥 {connectedStudents}</div>
                </div>
              </div>

              {!session.isActive && (
                <button
                  onClick={handleStartSession}
                  disabled={startSession.isPending}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg font-semibold shadow-lg hover:from-emerald-700 hover:to-emerald-800 transition transform hover:scale-105 disabled:opacity-50"
                >
                  {startSession.isPending ? 'Starting...' : '▶️ Start Session'}
                </button>
              )}
            </div>
          </div>

          {/* Connected Students */}
          {students.length > 0 && (
            <div className="mb-6 bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-4 border border-blue-400/30">
              <h3 className="text-lg font-semibold text-blue-300 mb-3">Connected Students</h3>
              <div className="flex flex-wrap gap-2">
                {students.map((student) => (
                  <div
                    key={student.userId}
                    className="px-3 py-1 bg-slate-900/50 rounded-full text-sm text-slate-300 border border-cyan-500/30"
                  >
                    {student.userName}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Question Display */}
            <div className="lg:col-span-2">
              <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-8 border border-blue-400/30 shadow-2xl">
                {currentQuestion ? (
                  <>
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-slate-400 text-sm">
                          Question {currentQuestionIndex + 1} of {quiz.questions?.length || 0}
                        </span>
                        {currentQuestion.timeLimit && (
                          <span className="px-3 py-1 bg-cyan-900/50 text-cyan-300 rounded-full text-sm">
                            ⏱️ {currentQuestion.timeLimit}s
                          </span>
                        )}
                      </div>
                      <h2 className="text-2xl font-bold text-white mb-4">{currentQuestion.text}</h2>
                    </div>

                    {/* Options Display */}
                    {currentQuestion.type === QuestionType.MULTIPLE_CHOICE && currentQuestion.options && (
                      <div className="space-y-3 mb-6">
                        {currentQuestion.options.choices.map((choice, idx) => (
                          <div
                            key={idx}
                            className={`p-4 rounded-lg border-2 ${
                              showResults && idx === currentQuestion.options?.correctAnswer
                                ? 'bg-emerald-900/30 border-emerald-500'
                                : 'bg-slate-900/50 border-slate-600'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                                {String.fromCharCode(65 + idx)}
                              </div>
                              <span className="text-white">{choice}</span>
                              {showResults && idx === currentQuestion.options?.correctAnswer && (
                                <span className="ml-auto text-emerald-400 font-bold">✓ Correct</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {currentQuestion.type === QuestionType.TRUE_FALSE && (
                      <div className="space-y-3 mb-6">
                        {['True', 'False'].map((choice) => (
                          <div
                            key={choice}
                            className={`p-4 rounded-lg border-2 ${
                              showResults && choice.toLowerCase() === currentQuestion.correctAnswer?.toLowerCase()
                                ? 'bg-emerald-900/30 border-emerald-500'
                                : 'bg-slate-900/50 border-slate-600'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-white font-semibold">{choice}</span>
                              {showResults && choice.toLowerCase() === currentQuestion.correctAnswer?.toLowerCase() && (
                                <span className="ml-auto text-emerald-400 font-bold">✓ Correct</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {currentQuestion.type === QuestionType.TEXT && showResults && (
                      <div className="mb-6 p-4 bg-emerald-900/30 border-2 border-emerald-500 rounded-lg">
                        <div className="text-sm text-slate-400 mb-1">Correct Answer:</div>
                        <div className="text-white font-semibold">{currentQuestion.correctAnswer}</div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                      {!showResults ? (
                        <>
                          <button
                            onClick={handleBroadcastQuestion}
                            disabled={!session.isActive || broadcastQuestion.isPending}
                            className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold shadow-lg hover:from-blue-700 hover:to-cyan-700 transition transform hover:scale-105 disabled:opacity-50 disabled:transform-none text-lg"
                          >
                            {broadcastQuestion.isPending ? 'Broadcasting...' : '📢 Broadcast Question'}
                          </button>
                          <button
                            onClick={handleShowResults}
                            className="px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg font-semibold shadow-lg hover:from-purple-700 hover:to-purple-800 transition"
                          >
                            📊 Show Results
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={hasMoreQuestions ? handleNextQuestion : undefined}
                          disabled={!hasMoreQuestions}
                          className="flex-1 px-6 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg font-semibold shadow-lg hover:from-emerald-700 hover:to-emerald-800 transition transform hover:scale-105 disabled:opacity-50 disabled:transform-none text-lg"
                        >
                          {hasMoreQuestions ? '➡️ Next Question' : '✓ Quiz Complete'}
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📝</div>
                    <h3 className="text-xl font-bold text-slate-300">No questions available</h3>
                  </div>
                )}
              </div>

              {/* Navigation */}
              {quiz.questions && quiz.questions.length > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <button
                    onClick={handlePreviousQuestion}
                    disabled={currentQuestionIndex === 0}
                    className="px-4 py-2 bg-slate-700 text-white rounded-lg font-semibold hover:bg-slate-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ← Previous
                  </button>
                  <span className="text-slate-400">
                    Question {currentQuestionIndex + 1} / {quiz.questions.length}
                  </span>
                  <button
                    onClick={handleNextQuestion}
                    disabled={!hasMoreQuestions}
                    className="px-4 py-2 bg-slate-700 text-white rounded-lg font-semibold hover:bg-slate-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>

            {/* Sidebar - Quiz Overview */}
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-6 border border-blue-400/30 sticky top-8">
                <h3 className="text-lg font-semibold text-blue-300 mb-4">Quiz Overview</h3>
                
                {quiz.questions && (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {quiz.questions.map((q, idx) => (
                      <button
                        key={q.id}
                        onClick={() => {
                          setCurrentQuestionIndex(idx);
                          setShowResults(false);
                        }}
                        className={`w-full text-left p-3 rounded-lg transition ${
                          idx === currentQuestionIndex
                            ? 'bg-cyan-600 text-white'
                            : 'bg-slate-900/50 text-slate-300 hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">Q{idx + 1}</span>
                          {q.timeLimit && (
                            <span className="text-xs opacity-75">⏱️ {q.timeLimit}s</span>
                          )}
                        </div>
                        <div className="text-sm line-clamp-2">{q.text}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}

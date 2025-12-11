"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import { UserRole } from 'shared/src/types';
import { useQuizzes } from '@/lib/hooks/useQuizzes';
import { useCreateSession } from '@/lib/hooks/useSessions';

function CreateSessionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedQuizId = searchParams.get('quizId');
  
  const { data: quizzes, isLoading: loadingQuizzes } = useQuizzes();
  const createSession = useCreateSession();
  
  const [selectedQuizId, setSelectedQuizId] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (preselectedQuizId) {
      setSelectedQuizId(preselectedQuizId);
    }
  }, [preselectedQuizId]);

  const handleCreateSession = async () => {
    if (!selectedQuizId) {
      setError('Please select a quiz');
      return;
    }

    try {
      const session = await createSession.mutateAsync({ quizId: selectedQuizId });
      // Redirect to the session control page
      router.push(`/teacher/sessions/${session.id}`);
    } catch (err: any) {
      console.error('Failed to create session:', err);
      setError(err.userMessage || 'Failed to create session. Please try again.');
    }
  };

  return (
    <AuthGuard roles={[UserRole.TEACHER]}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push('/teacher/quizzes')}
              className="mb-4 text-slate-300 hover:text-cyan-300 transition flex items-center gap-2"
            >
              ← Back to Quizzes
            </button>
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
              Create Quiz Session
            </h1>
            <p className="text-slate-300 mt-2">Select a quiz to launch a live session</p>
          </div>

          {/* Content */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl p-8 border border-blue-400/30 shadow-2xl">
            {loadingQuizzes ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
                <p className="text-slate-300 mt-4">Loading quizzes...</p>
              </div>
            ) : quizzes && quizzes.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📝</div>
                <h2 className="text-2xl font-bold text-blue-300 mb-2">No quizzes available</h2>
                <p className="text-slate-300 mb-6">Create a quiz first before starting a session</p>
                <button
                  onClick={() => router.push('/teacher/quizzes/new')}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold shadow-lg hover:from-blue-700 hover:to-cyan-700 transition transform hover:scale-105"
                >
                  Create Your First Quiz
                </button>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <label className="block text-slate-300 font-semibold mb-3">
                    Select Quiz
                  </label>
                  <select
                    value={selectedQuizId}
                    onChange={(e) => {
                      setSelectedQuizId(e.target.value);
                      setError('');
                    }}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  >
                    <option value="">-- Select a quiz --</option>
                    {quizzes?.map((quiz) => (
                      <option key={quiz.id} value={quiz.id}>
                        {quiz.title} ({quiz.questions?.length || 0} questions)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selected Quiz Details */}
                {selectedQuizId && quizzes && (
                  <div className="mb-6 p-4 bg-slate-900/50 rounded-lg border border-cyan-500/30">
                    {(() => {
                      const selectedQuiz = quizzes.find((q) => q.id === selectedQuizId);
                      if (!selectedQuiz) return null;
                      return (
                        <>
                          <h3 className="font-bold text-cyan-300 mb-2">{selectedQuiz.title}</h3>
                          {selectedQuiz.description && (
                            <p className="text-slate-300 text-sm mb-2">{selectedQuiz.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-slate-400">
                            <span>📊 {selectedQuiz.questions?.length || 0} questions</span>
                            <span>•</span>
                            <span>⏱️ ~{((selectedQuiz.questions?.length || 0) * 2)} min</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded-lg">
                    <p className="text-red-400 font-semibold">{error}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={() => router.back()}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-lg font-semibold shadow-lg hover:from-slate-700 hover:to-slate-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateSession}
                    disabled={!selectedQuizId || createSession.isPending}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold shadow-lg hover:from-blue-700 hover:to-cyan-700 transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {createSession.isPending ? 'Creating...' : 'Create Session'}
                  </button>
                </div>

                {/* Info Box */}
                <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                  <h4 className="font-semibold text-blue-300 mb-2">ℹ️ What happens next?</h4>
                  <ul className="text-slate-300 text-sm space-y-1">
                    <li>• A unique access code will be generated</li>
                    <li>• You&apos;ll be able to share this code with students</li>
                    <li>• Students can join using the access code</li>
                    <li>• You can start the session and broadcast questions in real-time</li>
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}

export default function CreateSessionPage() {
  return (
    <Suspense fallback={
      <AuthGuard roles={[UserRole.TEACHER]}>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400 mb-4"></div>
            <p className="text-slate-300 text-lg">Loading...</p>
          </div>
        </div>
      </AuthGuard>
    }>
      <CreateSessionForm />
    </Suspense>
  );
}

"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import { UserRole, QuestionType } from 'shared/src/types';
import { useStudentSocket } from '@/lib/hooks/useSocket';

export default function StudentSessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const {
    isConnected,
    currentQuestion,
    timeLeft,
    results,
    answerSubmitted,
    submitAnswer,
    leaveSession,
  } = useStudentSocket();

  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [textAnswer, setTextAnswer] = useState('');

  // Reset answer when new question arrives
  useEffect(() => {
    setSelectedAnswer('');
    setTextAnswer('');
  }, [currentQuestion?.id]);

  const handleSubmitAnswer = () => {
    if (!currentQuestion) return;

    let answer = '';
    if (currentQuestion.type === QuestionType.MULTIPLE_CHOICE) {
      answer = selectedAnswer;
    } else if (currentQuestion.type === QuestionType.TRUE_FALSE) {
      answer = selectedAnswer;
    } else if (currentQuestion.type === QuestionType.TEXT) {
      answer = textAnswer;
    }

    if (!answer) {
      alert('Please select or enter an answer');
      return;
    }

    submitAnswer(currentQuestion.id!, answer);
  };

  const handleLeaveSession = () => {
    if (confirm('Are you sure you want to leave this session?')) {
      leaveSession();
      router.push('/');
    }
  };

  if (!isConnected) {
    return (
      <AuthGuard roles={[UserRole.STUDENT]}>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-purple-400 mb-4"></div>
            <p className="text-slate-300 text-lg">Connecting to session...</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard roles={[UserRole.STUDENT]}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></div>
              <span className="text-slate-300 text-sm">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <button
              onClick={handleLeaveSession}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition text-sm"
            >
              Leave Session
            </button>
          </div>

          {/* Main Content */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl p-6 md:p-8 border border-purple-400/30 shadow-2xl">
            {!currentQuestion && !results ? (
              // Waiting for question
              <div className="text-center py-16">
                <div className="text-6xl mb-4">⏳</div>
                <h2 className="text-2xl font-bold text-purple-300 mb-2">Waiting for next question...</h2>
                <p className="text-slate-400">Your teacher will broadcast the question soon</p>
              </div>
            ) : results ? (
              // Show results
              <div>
                <h2 className="text-3xl font-bold text-purple-300 mb-6 text-center">📊 Results</h2>
                
                {/* Leaderboard */}
                <div className="space-y-3">
                  {results.leaderboard.map((entry, idx) => (
                    <div
                      key={entry.userId}
                      className={`p-4 rounded-lg border-2 flex items-center justify-between ${
                        idx === 0
                          ? 'bg-yellow-900/30 border-yellow-500'
                          : idx === 1
                          ? 'bg-slate-700/50 border-slate-400'
                          : idx === 2
                          ? 'bg-orange-900/30 border-orange-600'
                          : 'bg-slate-900/50 border-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                          idx === 0
                            ? 'bg-yellow-500 text-yellow-900'
                            : idx === 1
                            ? 'bg-slate-400 text-slate-900'
                            : idx === 2
                            ? 'bg-orange-500 text-orange-900'
                            : 'bg-slate-600 text-slate-300'
                        }`}>
                          {entry.rank}
                        </div>
                        <div>
                          <div className="text-white font-semibold">{entry.name}</div>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-purple-300">{entry.score}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 text-center">
                  <p className="text-slate-400">Waiting for next question...</p>
                </div>
              </div>
            ) : currentQuestion && (
              // Show question
              <div>
                {/* Timer */}
                {timeLeft !== null && (
                  <div className="mb-6 text-center">
                    <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full ${
                      timeLeft <= 10 ? 'bg-red-900/50 text-red-300' : 'bg-purple-900/50 text-purple-300'
                    }`}>
                      <span className="text-2xl">⏱️</span>
                      <span className="text-3xl font-bold">{timeLeft}s</span>
                    </div>
                  </div>
                )}

                {/* Question Text */}
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-8 text-center">
                  {currentQuestion.text}
                </h2>

                {/* Answer Submitted Feedback */}
                {answerSubmitted ? (
                  <div className={`p-6 rounded-xl border-2 text-center ${
                    answerSubmitted.isCorrect
                      ? 'bg-emerald-900/30 border-emerald-500'
                      : 'bg-red-900/30 border-red-500'
                  }`}>
                    <div className="text-6xl mb-4">{answerSubmitted.isCorrect ? '✅' : '❌'}</div>
                    <h3 className={`text-2xl font-bold mb-2 ${
                      answerSubmitted.isCorrect ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {answerSubmitted.isCorrect ? 'Correct!' : 'Incorrect'}
                    </h3>
                    <p className="text-slate-300 text-lg">
                      Points earned: <span className="font-bold text-yellow-400">+{answerSubmitted.pointsEarned}</span>
                    </p>
                    <p className="text-slate-400 text-sm mt-4">Waiting for results...</p>
                  </div>
                ) : (
                  <>
                    {/* Multiple Choice Options */}
                    {currentQuestion.type === QuestionType.MULTIPLE_CHOICE && currentQuestion.options && (
                      <div className="space-y-3 mb-6">
                        {currentQuestion.options.choices.map((choice: string, idx: number) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedAnswer(idx.toString())}
                            disabled={timeLeft === 0}
                            className={`w-full p-4 md:p-6 rounded-lg border-2 text-left transition transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                              selectedAnswer === idx.toString()
                                ? 'bg-purple-600 border-purple-400 shadow-lg shadow-purple-500/50'
                                : 'bg-slate-900/50 border-slate-600 hover:border-purple-500'
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                                selectedAnswer === idx.toString() ? 'bg-purple-500' : 'bg-slate-700'
                              }`}>
                                {String.fromCharCode(65 + idx)}
                              </div>
                              <span className="text-white font-semibold text-lg">{choice}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* True/False Options */}
                    {currentQuestion.type === QuestionType.TRUE_FALSE && (
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        {['true', 'false'].map((choice) => (
                          <button
                            key={choice}
                            onClick={() => setSelectedAnswer(choice)}
                            disabled={timeLeft === 0}
                            className={`p-6 md:p-8 rounded-lg border-2 transition transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                              selectedAnswer === choice
                                ? 'bg-purple-600 border-purple-400 shadow-lg shadow-purple-500/50'
                                : 'bg-slate-900/50 border-slate-600 hover:border-purple-500'
                            }`}
                          >
                            <div className="text-center">
                              <div className="text-4xl mb-2">{choice === 'true' ? '✓' : '✗'}</div>
                              <span className="text-white font-bold text-xl capitalize">{choice}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Text Input */}
                    {currentQuestion.type === QuestionType.TEXT && (
                      <div className="mb-6">
                        <textarea
                          value={textAnswer}
                          onChange={(e) => setTextAnswer(e.target.value)}
                          disabled={timeLeft === 0}
                          placeholder="Type your answer here..."
                          rows={4}
                          className="w-full px-4 py-3 bg-slate-900/50 border-2 border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
                        />
                      </div>
                    )}

                    {/* Submit Button */}
                    <button
                      onClick={handleSubmitAnswer}
                      disabled={
                        timeLeft === 0 ||
                        (currentQuestion.type === QuestionType.TEXT && !textAnswer.trim()) ||
                        ((currentQuestion.type === QuestionType.MULTIPLE_CHOICE || currentQuestion.type === QuestionType.TRUE_FALSE) && !selectedAnswer)
                      }
                      className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold shadow-lg hover:from-purple-700 hover:to-pink-700 transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-lg"
                    >
                      {timeLeft === 0 ? '⏰ Time&apos;s Up!' : '✓ Submit Answer'}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}

"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '../../../../components/AuthGuard';
import { useCreateQuiz } from '../../../../lib/hooks/useQuizzes';
import { UserRole, QuestionType } from 'shared/src/types';
import type { CreateQuizPayload } from '../../../../lib/hooks/useQuizzes';

interface QuestionForm {
  text: string;
  type: QuestionType;
  options?: {
    choices: string[];
    correctAnswer: number;
  };
  correctAnswer?: string;
  points: number;
  timeLimit?: number;
  order: number;
}

export default function NewQuizPage() {
  const router = useRouter();
  const createQuiz = useCreateQuiz();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<QuestionForm[]>([
    {
      text: '',
      type: QuestionType.MULTIPLE_CHOICE,
      options: { choices: ['', ''], correctAnswer: 0 },
      points: 10,
      order: 0,
    },
  ]);
  const [error, setError] = useState<string | null>(null);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        text: '',
        type: QuestionType.MULTIPLE_CHOICE,
        options: { choices: ['', ''], correctAnswer: 0 },
        points: 10,
        order: questions.length,
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length === 1) {
      alert('You must have at least one question');
      return;
    }
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: keyof QuestionForm, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const addChoice = (questionIndex: number) => {
    const updated = [...questions];
    if (updated[questionIndex].options) {
      updated[questionIndex].options!.choices.push('');
      setQuestions(updated);
    }
  };

  const removeChoice = (questionIndex: number, choiceIndex: number) => {
    const updated = [...questions];
    if (updated[questionIndex].options && updated[questionIndex].options!.choices.length > 2) {
      updated[questionIndex].options!.choices = updated[questionIndex].options!.choices.filter(
        (_, i) => i !== choiceIndex
      );
      // Adjust correctAnswer if needed
      if (updated[questionIndex].options!.correctAnswer >= choiceIndex) {
        updated[questionIndex].options!.correctAnswer = Math.max(
          0,
          updated[questionIndex].options!.correctAnswer - 1
        );
      }
      setQuestions(updated);
    }
  };

  const updateChoice = (questionIndex: number, choiceIndex: number, value: string) => {
    const updated = [...questions];
    if (updated[questionIndex].options) {
      updated[questionIndex].options!.choices[choiceIndex] = value;
      setQuestions(updated);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Quiz title is required');
      return;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        setError(`Question ${i + 1}: Text is required`);
        return;
      }

      if (q.type === QuestionType.MULTIPLE_CHOICE) {
        if (!q.options || q.options.choices.length < 2) {
          setError(`Question ${i + 1}: Multiple choice needs at least 2 choices`);
          return;
        }
        if (q.options.choices.some((c) => !c.trim())) {
          setError(`Question ${i + 1}: All choices must have text`);
          return;
        }
      }

      if (q.type === QuestionType.TRUE_FALSE) {
        if (!q.correctAnswer) {
          setError(`Question ${i + 1}: True/False answer is required`);
          return;
        }
      }

      if (q.type === QuestionType.TEXT) {
        if (!q.correctAnswer || !q.correctAnswer.trim()) {
          setError(`Question ${i + 1}: Correct answer is required`);
          return;
        }
      }
    }

    const payload: CreateQuizPayload = {
      title: title.trim(),
      description: description.trim() || undefined,
      questions: questions.map((q) => ({
        text: q.text,
        type: q.type,
        options: q.type === QuestionType.MULTIPLE_CHOICE ? q.options : undefined,
        correctAnswer: q.type !== QuestionType.MULTIPLE_CHOICE ? q.correctAnswer : undefined,
        order: q.order,
        points: q.points,
        timeLimit: q.timeLimit,
      })),
    };

    try {
      await createQuiz.mutateAsync(payload);
      router.push('/teacher/quizzes');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create quiz');
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
              className="mb-4 text-cyan-400 hover:text-cyan-300 font-semibold transition"
            >
              ← Back to Quizzes
            </button>
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
              Create New Quiz
            </h1>
            <p className="text-slate-300 mt-2">Add questions with different types</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Quiz Info Card */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-6 border border-blue-400/30">
              <h2 className="text-xl font-bold text-blue-300 mb-4">Quiz Information</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Quiz Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-700 border border-blue-400/30 px-4 py-3 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    placeholder="e.g., Mathematics Quiz 1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-slate-700 border border-blue-400/30 px-4 py-3 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    placeholder="Brief description of this quiz"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Questions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-blue-300">Questions</h2>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-cyan-700 text-white rounded-lg font-semibold hover:from-cyan-700 hover:to-cyan-800 transition text-sm"
                >
                  + Add Question
                </button>
              </div>

              {questions.map((question, qIndex) => (
                <div
                  key={qIndex}
                  className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-6 border border-blue-400/30"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-cyan-300">Question {qIndex + 1}</h3>
                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQuestion(qIndex)}
                        className="text-red-400 hover:text-red-300 font-semibold text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    {/* Question Text */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">
                        Question Text *
                      </label>
                      <input
                        type="text"
                        value={question.text}
                        onChange={(e) => updateQuestion(qIndex, 'text', e.target.value)}
                        className="w-full bg-slate-700 border border-blue-400/30 px-4 py-3 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                        placeholder="Enter your question"
                        required
                      />
                    </div>

                    {/* Question Type */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">
                        Question Type *
                      </label>
                      <select
                        value={question.type}
                        onChange={(e) => {
                          const newType = e.target.value as QuestionType;
                          const updated = { ...question, type: newType };

                          // Initialize appropriate fields based on type
                          if (newType === QuestionType.MULTIPLE_CHOICE) {
                            updated.options = { choices: ['', ''], correctAnswer: 0 };
                            updated.correctAnswer = undefined;
                          } else if (newType === QuestionType.TRUE_FALSE) {
                            updated.options = undefined;
                            updated.correctAnswer = 'true';
                          } else if (newType === QuestionType.TEXT) {
                            updated.options = undefined;
                            updated.correctAnswer = '';
                          }

                          setQuestions(questions.map((q, i) => (i === qIndex ? updated : q)));
                        }}
                        className="w-full bg-slate-700 border border-blue-400/30 px-4 py-3 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                      >
                        <option value={QuestionType.MULTIPLE_CHOICE}>Multiple Choice</option>
                        <option value={QuestionType.TRUE_FALSE}>True/False</option>
                        <option value={QuestionType.TEXT}>Text Answer</option>
                      </select>
                    </div>

                    {/* Multiple Choice Options */}
                    {question.type === QuestionType.MULTIPLE_CHOICE && question.options && (
                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">
                          Answer Choices *
                        </label>
                        <div className="space-y-2">
                          {question.options.choices.map((choice, cIndex) => (
                            <div key={cIndex} className="flex gap-2">
                              <input
                                type="radio"
                                name={`correct-${qIndex}`}
                                checked={question.options!.correctAnswer === cIndex}
                                onChange={() =>
                                  updateQuestion(qIndex, 'options', {
                                    ...question.options!,
                                    correctAnswer: cIndex,
                                  })
                                }
                                className="mt-3"
                              />
                              <input
                                type="text"
                                value={choice}
                                onChange={(e) => updateChoice(qIndex, cIndex, e.target.value)}
                                className="flex-1 bg-slate-700 border border-blue-400/30 px-4 py-2 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                                placeholder={`Choice ${cIndex + 1}`}
                                required
                              />
                              {question.options!.choices.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => removeChoice(qIndex, cIndex)}
                                  className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => addChoice(qIndex)}
                          className="mt-2 text-cyan-400 hover:text-cyan-300 font-semibold text-sm"
                        >
                          + Add Choice
                        </button>
                        <p className="text-xs text-slate-400 mt-2">
                          Select the radio button next to the correct answer
                        </p>
                      </div>
                    )}

                    {/* True/False Options */}
                    {question.type === QuestionType.TRUE_FALSE && (
                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">
                          Correct Answer *
                        </label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name={`tf-${qIndex}`}
                              value="true"
                              checked={question.correctAnswer === 'true'}
                              onChange={(e) => updateQuestion(qIndex, 'correctAnswer', e.target.value)}
                              className="text-cyan-400"
                            />
                            <span className="text-white">True</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name={`tf-${qIndex}`}
                              value="false"
                              checked={question.correctAnswer === 'false'}
                              onChange={(e) => updateQuestion(qIndex, 'correctAnswer', e.target.value)}
                              className="text-cyan-400"
                            />
                            <span className="text-white">False</span>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Text Answer */}
                    {question.type === QuestionType.TEXT && (
                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">
                          Correct Answer *
                        </label>
                        <input
                          type="text"
                          value={question.correctAnswer || ''}
                          onChange={(e) => updateQuestion(qIndex, 'correctAnswer', e.target.value)}
                          className="w-full bg-slate-700 border border-blue-400/30 px-4 py-3 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                          placeholder="Enter the correct answer"
                          required
                        />
                      </div>
                    )}

                    {/* Points and Time Limit */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">
                          Points *
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={question.points}
                          onChange={(e) => updateQuestion(qIndex, 'points', parseInt(e.target.value))}
                          className="w-full bg-slate-700 border border-blue-400/30 px-4 py-3 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">
                          Time Limit (seconds)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={question.timeLimit || ''}
                          onChange={(e) =>
                            updateQuestion(
                              qIndex,
                              'timeLimit',
                              e.target.value ? parseInt(e.target.value) : undefined
                            )
                          }
                          className="w-full bg-slate-700 border border-blue-400/30 px-4 py-3 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                          placeholder="Optional"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4">
                <p className="text-red-400 font-semibold">{error}</p>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.push('/teacher/quizzes')}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-lg font-semibold hover:from-slate-700 hover:to-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createQuiz.isPending}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createQuiz.isPending ? 'Creating...' : 'Create Quiz'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AuthGuard>
  );
}

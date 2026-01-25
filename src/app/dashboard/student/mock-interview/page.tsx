'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import Link from 'next/link'

interface Question {
  question_id: string
  question_text: string
  role_type: string
  topic: string
  difficulty: string
}

interface Evaluation {
  score: number
  strengths: string
  weaknesses: string
  ideal_answer: string
  feedback: string
}

interface Session {
  session_id: string
  started_at: string
  total_score: number | null
}

export default function MockInterviewPage() {
  const { user } = useAuth()
  const [session, setSession] = useState<Session | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [studentAnswer, setStudentAnswer] = useState('')
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({
    role_type: '',
    topic: '',
    difficulty: '',
  })

  useEffect(() => {
    if (user) {
      initializeSession()
    }
  }, [user])

  const initializeSession = async () => {
    if (!user) return

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/interview/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: user.id }),
      })

      if (!response.ok) {
        throw new Error('Failed to initialize session')
      }

      const sessionData = await response.json()
      setSession(sessionData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start session')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchQuestion = async () => {
    if (!user) return

    setIsLoading(true)
    setError('')
    setCurrentQuestion(null)
    setStudentAnswer('')
    setEvaluation(null)

    try {
      const params = new URLSearchParams()
      if (filters.role_type) params.append('role_type', filters.role_type)
      if (filters.topic) params.append('topic', filters.topic)
      if (filters.difficulty) params.append('difficulty', filters.difficulty)

      const response = await fetch(`/api/interview/question?${params.toString()}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch question')
      }

      const question = await response.json()
      setCurrentQuestion(question)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch question')
    } finally {
      setIsLoading(false)
    }
  }

  const submitAnswer = async () => {
    if (!user || !currentQuestion || !studentAnswer.trim()) {
      setError('Please provide an answer')
      return
    }

    setIsEvaluating(true)
    setError('')

    try {
      const response = await fetch('/api/interview/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: user.id,
          student_answer: studentAnswer.trim(),
          question_id: currentQuestion.question_id,
          role_type: currentQuestion.role_type,
          topic: currentQuestion.topic,
          difficulty: currentQuestion.difficulty,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to evaluate answer')
      }

      const result = await response.json()
      setEvaluation(result.evaluation)

      // Update session score
      if (result.session_id && session) {
        setSession({ ...session, total_score: parseFloat(result.evaluation.score) })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to evaluate answer')
    } finally {
      setIsEvaluating(false)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'bg-green-100 text-green-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'hard':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600'
    if (score >= 6) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-200/50 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link
                  href="/dashboard/student"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </Link>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    AI Mock Interview
                  </h1>
                  <p className="text-sm text-gray-600 mt-1">
                    Practice with AI-powered interview questions
                  </p>
                </div>
              </div>
              {session && session.total_score !== null && (
                <div className="text-right bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 rounded-xl border border-blue-200">
                  <p className="text-sm text-gray-600">Session Score</p>
                  <p className={`text-2xl font-bold ${getScoreColor(session.total_score)}`}>
                    {session.total_score.toFixed(1)}/10
                  </p>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Question Filters</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role Type
                </label>
                <select
                  value={filters.role_type}
                  onChange={(e) => setFilters({ ...filters, role_type: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                >
                  <option value="">All</option>
                  <option value="HR">HR</option>
                  <option value="Technical">Technical</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Topic
                </label>
                <select
                  value={filters.topic}
                  onChange={(e) => setFilters({ ...filters, topic: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                >
                  <option value="">All</option>
                  <option value="DSA">DSA</option>
                  <option value="DBMS">DBMS</option>
                  <option value="OOPS">OOPS</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty
                </label>
                <select
                  value={filters.difficulty}
                  onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                >
                  <option value="">All</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>
            <button
              onClick={fetchQuestion}
              disabled={isLoading}
              className="mt-4 w-full md:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading...
                </span>
              ) : (
                'Get New Question'
              )}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl mb-6 shadow-sm">
              {error}
            </div>
          )}

          {/* Question Card */}
          {currentQuestion && (
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 border border-gray-100">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getDifficultyColor(currentQuestion.difficulty)}`}>
                      {currentQuestion.difficulty}
                    </span>
                    <span className="px-4 py-2 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                      {currentQuestion.role_type}
                    </span>
                    <span className="px-4 py-2 rounded-full text-sm font-semibold bg-purple-100 text-purple-800">
                      {currentQuestion.topic}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">Question</h2>
                  <p className="text-gray-700 text-lg leading-relaxed">
                    {currentQuestion.question_text}
                  </p>
                </div>
              </div>

              {/* Answer Input */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Your Answer
                </label>
                <textarea
                  value={studentAnswer}
                  onChange={(e) => setStudentAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  rows={10}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-y transition-all"
                  disabled={isEvaluating || !!evaluation}
                />
                <button
                  onClick={submitAnswer}
                  disabled={!studentAnswer.trim() || isEvaluating || !!evaluation}
                  className="mt-4 w-full md:w-auto px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold"
                >
                  {isEvaluating ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Evaluating...
                    </span>
                  ) : (
                    'Submit Answer'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Evaluation Results */}
          {evaluation && (
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 border border-gray-100">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Evaluation Results</h2>
                <div className="text-right bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 rounded-xl border border-blue-200">
                  <p className="text-sm text-gray-600">Score</p>
                  <p className={`text-4xl font-bold ${getScoreColor(evaluation.score)}`}>
                    {evaluation.score.toFixed(1)}/10
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Strengths */}
                <div>
                  <h3 className="text-lg font-semibold text-green-700 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Strengths
                  </h3>
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <p className="text-gray-700 leading-relaxed">{evaluation.strengths}</p>
                  </div>
                </div>

                {/* Weaknesses */}
                <div>
                  <h3 className="text-lg font-semibold text-red-700 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Areas for Improvement
                  </h3>
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-gray-700 leading-relaxed">{evaluation.weaknesses}</p>
                  </div>
                </div>

                {/* Feedback */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Detailed Feedback
                  </h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-gray-700 leading-relaxed">{evaluation.feedback}</p>
                  </div>
                </div>

                {/* Ideal Answer */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Ideal Answer
                  </h3>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <p className="text-gray-700 leading-relaxed">{evaluation.ideal_answer}</p>
                  </div>
                </div>
              </div>

              <button
                onClick={fetchQuestion}
                className="mt-8 w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold text-lg"
              >
                Next Question
              </button>
            </div>
          )}

          {/* Empty State */}
          {!currentQuestion && !isLoading && (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-xl font-bold text-gray-900">Ready to Start?</h3>
              <p className="mt-2 text-gray-600 mb-6">
                Use the filters above to get a question and start practicing!
              </p>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  )
}


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

interface SimulationSession {
  session_id: string
  started_at: string
  total_score: number | null
  questions_answered: number
}

interface Evaluation {
  score: number
  technical_accuracy: number
  communication_clarity: number
  interview_readiness: number
  strengths: string
  weaknesses: string
  ideal_answer: string
  feedback: string
  code_quality?: string
  algorithm_complexity?: string
  optimization_suggestions?: string
}

export default function TechnicalSimulationPage() {
  const { user } = useAuth()
  const [session, setSession] = useState<SimulationSession | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [studentAnswer, setStudentAnswer] = useState('')
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [error, setError] = useState('')
  const [simulationMode, setSimulationMode] = useState<'coding' | 'system-design' | 'behavioral'>('coding')
  const [timer, setTimer] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)

  useEffect(() => {
    if (user) {
      initializeSession()
    }
  }, [user])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1)
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isTimerRunning])

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
      setSession({
        ...sessionData,
        questions_answered: 0,
      })
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
    setTimer(0)
    setIsTimerRunning(true)

    try {
      const topic = simulationMode === 'coding' ? 'DSA' : simulationMode === 'system-design' ? 'System Design' : 'HR'
      const params = new URLSearchParams()
      params.append('role_type', 'Technical')
      params.append('topic', topic)

      const response = await fetch(`/api/interview/question?${params.toString()}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch question')
      }

      const question = await response.json()
      setCurrentQuestion(question)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch question')
      setIsTimerRunning(false)
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
    setIsTimerRunning(false)
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

      // Update session
      if (session) {
        setSession({
          ...session,
          questions_answered: session.questions_answered + 1,
          total_score: parseFloat(result.evaluation.score),
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to evaluate answer')
    } finally {
      setIsEvaluating(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
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
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-200/50">
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
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    Technical Interview Simulation
                  </h1>
                  <p className="text-sm text-gray-600 mt-1">
                    Real-time technical interview practice with coding challenges
                  </p>
                </div>
              </div>
              {session && (
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Questions Answered</p>
                    <p className="text-2xl font-bold text-green-600">{session.questions_answered}</p>
                  </div>
                  {session.total_score !== null && (
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Avg Score</p>
                      <p className={`text-2xl font-bold ${getScoreColor(session.total_score)}`}>
                        {session.total_score.toFixed(1)}/10
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Simulation Mode Selector */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Simulation Mode</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setSimulationMode('coding')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  simulationMode === 'coding'
                    ? 'border-green-500 bg-green-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    simulationMode === 'coding' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">Coding Challenges</p>
                    <p className="text-sm text-gray-600">DSA & Algorithms</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setSimulationMode('system-design')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  simulationMode === 'system-design'
                    ? 'border-green-500 bg-green-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    simulationMode === 'system-design' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">System Design</p>
                    <p className="text-sm text-gray-600">Architecture & Scalability</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setSimulationMode('behavioral')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  simulationMode === 'behavioral'
                    ? 'border-green-500 bg-green-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    simulationMode === 'behavioral' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">Behavioral</p>
                    <p className="text-sm text-gray-600">STAR Method & Stories</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl mb-6 shadow-sm">
              {error}
            </div>
          )}

          {/* Timer Display */}
          {isTimerRunning && (
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg p-4 mb-6 text-white text-center">
              <p className="text-sm font-medium mb-1">Time Elapsed</p>
              <p className="text-3xl font-bold">{formatTime(timer)}</p>
            </div>
          )}

          {isLoading && !currentQuestion && (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading question...</p>
            </div>
          )}

          {currentQuestion && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Question Panel */}
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
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
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Question</h2>
                    <p className="text-gray-700 text-lg leading-relaxed">
                      {currentQuestion.question_text}
                    </p>
                  </div>
                </div>
              </div>

              {/* Answer Panel */}
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Your Solution</h2>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {simulationMode === 'coding' ? 'Code Solution' : simulationMode === 'system-design' ? 'Design Explanation' : 'Your Answer'}
                  </label>
                  <textarea
                    value={studentAnswer}
                    onChange={(e) => setStudentAnswer(e.target.value)}
                    placeholder={
                      simulationMode === 'coding'
                        ? 'Write your code solution here...\n\nExample:\nfunction solution(input) {\n  // Your code here\n  return result;\n}'
                        : simulationMode === 'system-design'
                        ? 'Describe your system design approach...\n\n- Components\n- Data flow\n- Scalability considerations\n- Trade-offs'
                        : 'Use STAR method:\nSituation\nTask\nAction\nResult'
                    }
                    rows={16}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none font-mono text-sm"
                    disabled={isEvaluating || !!evaluation}
                  />
                </div>

                {!evaluation && (
                  <button
                    onClick={submitAnswer}
                    disabled={!studentAnswer.trim() || isEvaluating}
                    className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold text-lg"
                  >
                    {isEvaluating ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Evaluating...
                      </span>
                    ) : (
                      'Submit Solution'
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Evaluation Results */}
          {evaluation && (
            <div className="mt-6 bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Evaluation Results</h2>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Overall Score</p>
                  <p className={`text-4xl font-bold ${getScoreColor(evaluation.score)}`}>
                    {evaluation.score.toFixed(1)}/10
                  </p>
                </div>
              </div>

              {/* Score Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <p className="text-sm text-blue-600 font-medium mb-1">Technical Accuracy</p>
                  <p className="text-2xl font-bold text-blue-900">{evaluation.technical_accuracy?.toFixed(1) || 'N/A'}/10</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                  <p className="text-sm text-purple-600 font-medium mb-1">Communication Clarity</p>
                  <p className="text-2xl font-bold text-purple-900">{evaluation.communication_clarity?.toFixed(1) || 'N/A'}/10</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                  <p className="text-sm text-green-600 font-medium mb-1">Interview Readiness</p>
                  <p className="text-2xl font-bold text-green-900">{evaluation.interview_readiness?.toFixed(1) || 'N/A'}/10</p>
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

                {/* Areas for Improvement */}
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

                {/* Detailed Feedback */}
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
                    Ideal Solution
                  </h3>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap font-mono text-sm">{evaluation.ideal_answer}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={fetchQuestion}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold text-lg"
                >
                  Next Question
                </button>
                <button
                  onClick={() => {
                    setEvaluation(null)
                    setStudentAnswer('')
                    setCurrentQuestion(null)
                  }}
                  className="px-6 py-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-semibold"
                >
                  Reset
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!currentQuestion && !isLoading && (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h3 className="mt-4 text-2xl font-bold text-gray-900">Ready to Start Simulation?</h3>
              <p className="mt-2 text-gray-600 mb-8 max-w-md mx-auto">
                Select a simulation mode above and click the button below to begin your technical interview practice session.
              </p>
              <button
                onClick={fetchQuestion}
                className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold text-lg"
              >
                Start Simulation
              </button>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  )
}


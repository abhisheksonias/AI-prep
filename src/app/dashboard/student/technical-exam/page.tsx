'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'

type Question = {
  id: number
  questionId: string
  question: string
  topic: string
  difficulty: 'easy' | 'medium' | 'hard'
  options: string[]
}

type TestResult = {
  id: string
  totalQuestions: number
  correctAnswers: number
  incorrectAnswers: number
  scorePercentage: number
  timeTaken?: number
  testDate?: string
}

type HistoryEntry = {
  id: string
  test_date: string
  score_percentage: number
  total_questions: number
  correct_answers: number
  incorrect_answers: number
  time_taken_seconds: number | null
  tab_switches: number | null
  violations: number | null
}

type HistoryStats = {
  totalTests: number
  averageScore: string
  bestScore: string
  latestScore: string | number
  improvementTrend: number
} | null

export default function TechnicalExamPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [topic, setTopic] = useState<'backend' | 'frontend' | ''>('')
  const [testStarted, setTestStarted] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answersHash, setAnswersHash] = useState('')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<{ questionId: number; selectedAnswer: number }[]>([])
  const [startTime, setStartTime] = useState<number | null>(null)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [error, setError] = useState('')
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [stats, setStats] = useState<HistoryStats>(null)
  const [historyLoading, setHistoryLoading] = useState(false)

  const fetchHistory = async () => {
    if (!user?.id) return
    setHistoryLoading(true)
    try {
      const res = await fetch(`/api/technical-exam/submit?studentId=${user.id}&limit=10`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load history')
      setHistory(data.history || [])
      setStats(data.stats || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history')
    } finally {
      setHistoryLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [user?.id])

  const startTest = async () => {
    if (!user?.id) return
    if (!topic) {
      setError('Please select a topic')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/technical-exam/generate?studentId=${user.id}&topic=${topic}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate questions')
      setQuestions(data.questions)
      setAnswersHash(data.answersHash)
      setTestStarted(true)
      setStartTime(Date.now())
      setCurrentQuestionIndex(0)
      setUserAnswers([])
      setTestResult(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start test')
    } finally {
      setLoading(false)
    }
  }

  const selectAnswer = (selectedAnswer: number) => {
    const current = questions[currentQuestionIndex]
    const existingIdx = userAnswers.findIndex(a => a.questionId === current.id)
    if (existingIdx >= 0) {
      const copy = [...userAnswers]
      copy[existingIdx].selectedAnswer = selectedAnswer
      setUserAnswers(copy)
    } else {
      setUserAnswers([...userAnswers, { questionId: current.id, selectedAnswer }])
    }
  }

  const submitTest = async () => {
    if (!user?.id || !startTime) return
    if (userAnswers.length !== questions.length) {
      setError('Please answer all questions before submitting')
      return
    }
    setLoading(true)
    setError('')
    try {
      const timeTaken = Math.floor((Date.now() - startTime) / 1000)
      const res = await fetch('/api/technical-exam/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: user.id,
          answers: userAnswers,
          answersHash,
          timeTakenSeconds: timeTaken,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit test')
      setTestResult(data.result)
      setTestStarted(false)
      fetchHistory()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit test')
    } finally {
      setLoading(false)
    }
  }

  const restart = () => {
    setTestResult(null)
    setQuestions([])
    setAnswersHash('')
    setUserAnswers([])
    setCurrentQuestionIndex(0)
    setStartTime(null)
    setTestStarted(false)
    setError('')
  }

  const currentQuestion = questions[currentQuestionIndex]
  const currentAnswer = userAnswers.find(a => a.questionId === currentQuestion?.id)

  return (
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <div className="min-h-screen bg-secondary">
        <header className="bg-surface/90 backdrop-blur-lg shadow-sm border-b border-secondary-muted sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-ink">Technical Exam</h1>
                <p className="text-sm text-ink/70 mt-0.5">MCQ-based coding & web fundamentals</p>
              </div>
              <Link
                href="/dashboard/student"
                className="px-4 py-2 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-all"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">{error}</div>
          )}

          {/* Start / Config */}
          {!testStarted && !testResult && (
            <div className="bg-surface rounded-2xl shadow-lg p-6 border border-secondary-muted">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-ink">Choose Topic & Start</h2>
                  <p className="text-sm text-ink/70">AI-powered questions tailored to your learning level.</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTopic('backend')}
                    className={`px-4 py-2 rounded-xl border ${topic === 'backend' ? 'bg-primary text-white border-primary' : 'border-secondary-muted text-ink'}`}
                  >
                    Backend
                  </button>
                  <button
                    onClick={() => setTopic('frontend')}
                    className={`px-4 py-2 rounded-xl border ${topic === 'frontend' ? 'bg-primary text-white border-primary' : 'border-secondary-muted text-ink'}`}
                  >
                    Frontend
                  </button>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                  <div className="text-3xl font-bold text-primary mb-1">15</div>
                  <div className="text-sm text-ink/70">Questions</div>
                </div>
                <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                  <div className="text-3xl font-bold text-primary mb-1">3</div>
                  <div className="text-sm text-ink/70">Difficulties</div>
                </div>
                <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                  <div className="text-3xl font-bold text-primary mb-1">AI-Powered</div>
                  <div className="text-sm text-ink/70">Adaptive Assessment</div>
                </div>
              </div>
              <button
                onClick={startTest}
                disabled={loading}
                className="mt-4 w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-all disabled:opacity-50"
              >
                {loading ? 'Generating AI Questions...' : 'Start Technical Exam'}
              </button>
            </div>
          )}

          {/* Question View */}
          {testStarted && currentQuestion && (
            <div className="bg-surface rounded-2xl shadow-lg p-6 border border-secondary-muted">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm text-ink/70">Question {currentQuestionIndex + 1} of {questions.length}</div>
                  <div className="text-xs text-ink/60">Topic: {currentQuestion.topic}</div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  currentQuestion.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                  currentQuestion.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {currentQuestion.difficulty}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-ink mb-4">{currentQuestion.question}</h3>

              <div className="space-y-3 mb-6">
                {currentQuestion.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => selectAnswer(idx)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      currentAnswer?.selectedAnswer === idx ? 'border-primary bg-primary/5' : 'border-secondary-muted hover:border-primary/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        currentAnswer?.selectedAnswer === idx ? 'border-primary bg-primary' : 'border-secondary-muted'
                      }`}>
                        {currentAnswer?.selectedAnswer === idx && (
                          <svg className="w-4 h-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className="text-ink">{opt}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => setCurrentQuestionIndex((i) => Math.max(0, i - 1))}
                  disabled={currentQuestionIndex === 0}
                  className="px-4 py-2 border border-secondary-muted rounded-xl text-ink disabled:opacity-50"
                >
                  ← Previous
                </button>
                <div className="text-sm text-ink/70">Answered {userAnswers.length}/{questions.length}</div>
                {currentQuestionIndex < questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentQuestionIndex((i) => Math.min(questions.length - 1, i + 1))}
                    className="px-4 py-2 bg-primary text-white rounded-xl"
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    onClick={submitTest}
                    disabled={loading || userAnswers.length !== questions.length}
                    className="px-4 py-2 bg-green-600 text-white rounded-xl disabled:opacity-50"
                  >
                    {loading ? 'Submitting...' : 'Submit Test'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Result */}
          {testResult && (
            <div className="bg-surface rounded-2xl shadow-lg p-6 border border-secondary-muted">
              <div className="text-center mb-6">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-4xl font-bold text-primary">{testResult.scorePercentage}%</span>
                </div>
                <h2 className="text-xl font-semibold text-ink">Test Completed</h2>
                <p className="text-sm text-ink/70">Your technical exam result is saved.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="text-3xl font-bold text-green-600">{testResult.correctAnswers}</div>
                  <div className="text-sm text-green-700">Correct</div>
                </div>
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="text-3xl font-bold text-red-600">{testResult.incorrectAnswers}</div>
                  <div className="text-sm text-red-700">Incorrect</div>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="text-3xl font-bold text-blue-600">{testResult.totalQuestions}</div>
                  <div className="text-sm text-blue-700">Total</div>
                </div>
              </div>
              <button
                onClick={restart}
                className="w-full py-3 bg-primary text-white rounded-xl"
              >
                Take Another Test
              </button>
            </div>
          )}

          {/* Progress */}
          {!testStarted && (
            <div className="bg-surface rounded-2xl shadow-lg p-6 border border-secondary-muted">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-ink">Progress & History</h3>
                  <p className="text-sm text-ink/70">Recent technical exam performance</p>
                </div>
                <button
                  onClick={fetchHistory}
                  disabled={historyLoading}
                  className="px-4 py-2 bg-primary text-white rounded-xl text-sm disabled:opacity-50"
                >
                  {historyLoading ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>

              {stats ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                    <div className="text-2xl font-bold text-primary mb-1">{stats.totalTests}</div>
                    <div className="text-sm text-ink/70">Total Tests</div>
                  </div>
                  <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                    <div className="text-2xl font-bold text-primary mb-1">{stats.averageScore}%</div>
                    <div className="text-sm text-ink/70">Average Score</div>
                  </div>
                  <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                    <div className="text-2xl font-bold text-primary mb-1">{stats.bestScore}%</div>
                    <div className="text-sm text-ink/70">Best Score</div>
                  </div>
                  <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                    <div className={`text-2xl font-bold ${Number(stats.improvementTrend) >= 0 ? 'text-green-600' : 'text-red-600'} mb-1`}>
                      {Number(stats.improvementTrend) >= 0 ? '+' : ''}{Number(stats.improvementTrend).toFixed(2)}%
                    </div>
                    <div className="text-sm text-ink/70">Change vs. last test</div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-ink/70">No history yet. Take a technical exam to see progress.</div>
              )}

              {historyLoading && <div className="text-sm text-ink/70">Loading history...</div>}

              {!historyLoading && history.length > 0 && (
                <div className="space-y-3 mt-3">
                  {history.map((item) => {
                    const score = parseFloat(item.score_percentage.toString())
                    return (
                      <div key={item.id} className="p-4 bg-secondary rounded-xl border border-secondary-muted">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm text-ink/70">{new Date(item.test_date).toLocaleString()}</div>
                            <div className="text-lg font-semibold text-ink">Score: {score}%</div>
                            <div className="text-xs text-ink/60">Correct {item.correct_answers}/{item.total_questions}</div>
                          </div>
                          <div className="w-32">
                            <div className="w-full bg-surface rounded-full h-2">
                              <div className="bg-primary h-2 rounded-full" style={{ width: `${Math.min(score, 100)}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  )
}

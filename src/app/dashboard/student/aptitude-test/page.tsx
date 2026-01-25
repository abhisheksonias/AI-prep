'use client'

import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import Link from 'next/link'
import { useState, useEffect } from 'react'

type Question = {
  id: number
  question: string
  type: 'quantitative' | 'logical' | 'verbal'
  options: string[]
  difficulty: 'easy' | 'medium' | 'hard'
}

type TestResult = {
  totalQuestions: number
  correctAnswers: number
  incorrectAnswers: number
  scorePercentage: number
  timeTaken?: number
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

export default function AptitudeTestPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
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
  
  // Proctoring states
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [tabSwitches, setTabSwitches] = useState(0)
  const [violations, setViolations] = useState(0)
  const [showWarning, setShowWarning] = useState(false)

  // Proctoring: Track visibility changes (tab switches)
  useEffect(() => {
    if (!testStarted) return

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitches(prev => prev + 1)
        setViolations(prev => prev + 1)
        setShowWarning(true)
        setTimeout(() => setShowWarning(false), 3000)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [testStarted])

  // Proctoring: Track fullscreen changes
  useEffect(() => {
    if (!testStarted) return

    const handleFullScreenChange = () => {
      const isCurrentlyFullScreen = !!document.fullscreenElement
      setIsFullScreen(isCurrentlyFullScreen)
      
      if (!isCurrentlyFullScreen && testStarted) {
        setViolations(prev => prev + 1)
        setShowWarning(true)
        setTimeout(() => setShowWarning(false), 3000)
      }
    }

    document.addEventListener('fullscreenchange', handleFullScreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange)
  }, [testStarted])

  // Proctoring: Prevent right-click and copy
  useEffect(() => {
    if (!testStarted) return

    const preventContextMenu = (e: MouseEvent) => e.preventDefault()
    const preventCopy = (e: ClipboardEvent) => e.preventDefault()
    const preventKeys = (e: KeyboardEvent) => {
      // Prevent F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
        (e.ctrlKey && e.key === 'U')
      ) {
        e.preventDefault()
        setViolations(prev => prev + 1)
      }
    }

    document.addEventListener('contextmenu', preventContextMenu)
    document.addEventListener('copy', preventCopy)
    document.addEventListener('keydown', preventKeys)

    return () => {
      document.removeEventListener('contextmenu', preventContextMenu)
      document.removeEventListener('copy', preventCopy)
      document.removeEventListener('keydown', preventKeys)
    }
  }, [testStarted])

  const enterFullScreen = async () => {
    try {
      await document.documentElement.requestFullscreen()
      setIsFullScreen(true)
    } catch (error) {
      console.error('Error entering fullscreen:', error)
    }
  }

  const exitFullScreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      }
      setIsFullScreen(false)
    } catch (error) {
      console.error('Error exiting fullscreen:', error)
    }
  }

  const fetchHistory = async () => {
    if (!user?.id) return
    setHistoryLoading(true)
    try {
      const response = await fetch(`/api/aptitude/submit?studentId=${user.id}&limit=10`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch test history')
      }

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
    
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch(`/api/aptitude/generate?studentId=${user.id}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate questions')
      }
      
      setQuestions(data.questions)
      setAnswersHash(data.answersHash)
      setTestStarted(true)
      setStartTime(Date.now())
      setCurrentQuestionIndex(0)
      setUserAnswers([])
      setTabSwitches(0)
      setViolations(0)
      
      // Enter fullscreen mode
      await enterFullScreen()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start test')
    } finally {
      setLoading(false)
    }
  }

  const selectAnswer = (selectedAnswer: number) => {
    const currentQuestion = questions[currentQuestionIndex]
    const existingAnswerIndex = userAnswers.findIndex(a => a.questionId === currentQuestion.id)
    
    if (existingAnswerIndex >= 0) {
      const newAnswers = [...userAnswers]
      newAnswers[existingAnswerIndex].selectedAnswer = selectedAnswer
      setUserAnswers(newAnswers)
    } else {
      setUserAnswers([...userAnswers, { questionId: currentQuestion.id, selectedAnswer }])
    }
  }

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const submitTest = async () => {
    if (!user?.id || !startTime) return
    
    // Check if all questions are answered
    if (userAnswers.length !== questions.length) {
      setError('Please answer all questions before submitting')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      const timeTaken = Math.floor((Date.now() - startTime) / 1000)
      
      const response = await fetch('/api/aptitude/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: user.id,
          answers: userAnswers,
          answersHash,
          timeTakenSeconds: timeTaken,
          tabSwitches,
          violations,
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit test')
      }
      
      setTestResult(data.result)
      setTestStarted(false)

      // Refresh history after submission
      fetchHistory()
      
      // Exit fullscreen
      await exitFullScreen()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit test')
    } finally {
      setLoading(false)
    }
  }

  const restartTest = () => {
    setTestResult(null)
    setQuestions([])
    setUserAnswers([])
    setCurrentQuestionIndex(0)
    setStartTime(null)
    setAnswersHash('')
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
                <h1 className="text-2xl font-bold text-ink">Aptitude Test</h1>
                <p className="text-sm text-ink/70 mt-0.5">Resume-Based Assessment</p>
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

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {showWarning && (
            <div className="fixed top-4 right-4 z-50 bg-red-600 text-white px-6 py-4 rounded-xl shadow-lg animate-bounce">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <div className="font-bold">Warning!</div>
                  <div className="text-sm">Don't switch tabs or exit fullscreen!</div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
              {error}
            </div>
          )}

          {!testStarted && !testResult && (
            <div className="bg-surface rounded-2xl shadow-lg p-8 border border-secondary-muted">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-ink mb-3">Resume-Based Aptitude Test</h2>
                <p className="text-ink/70 mb-6">
                  Take a personalized aptitude test based on your resume. You'll receive 15 questions covering quantitative, logical, and verbal reasoning.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                  <div className="text-3xl font-bold text-primary mb-1">15</div>
                  <div className="text-sm text-ink/70">Questions</div>
                </div>
                <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                  <div className="text-3xl font-bold text-primary mb-1">3</div>
                  <div className="text-sm text-ink/70">Question Types</div>
                </div>
                <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                  <div className="text-3xl font-bold text-primary mb-1">~20</div>
                  <div className="text-sm text-ink/70">Minutes</div>
                </div>
              </div>

              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Proctoring Rules:</h3>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Test will run in fullscreen mode</li>
                  <li>• Don't switch tabs or minimize the window</li>
                  <li>• Right-click and copy are disabled</li>
                  <li>• All violations will be tracked</li>
                  <li>• Excessive violations may invalidate your test</li>
                </ul>
              </div>

              <button
                onClick={startTest}
                disabled={loading}
                className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Generating Questions...' : 'Start Test'}
              </button>
            </div>
          )}

          {/* Progress & History */}
          {!testStarted && (
            <div className="mt-8 space-y-4">
              <div className="bg-surface rounded-2xl shadow-lg p-6 border border-secondary-muted">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-ink">Your Progress</h3>
                    <p className="text-sm text-ink/70">Recent aptitude test performance</p>
                  </div>
                  <button
                    onClick={fetchHistory}
                    disabled={historyLoading}
                    className="px-4 py-2 bg-primary text-white rounded-xl text-sm hover:bg-primary/90 disabled:opacity-50"
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
                  <div className="text-sm text-ink/70">No test history yet. Take your first test to see progress.</div>
                )}

                {historyLoading && (
                  <div className="text-sm text-ink/70">Loading history...</div>
                )}

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
                              <div className="text-right text-xs text-ink/60">Violations: {item.violations ?? 0}</div>
                              <div className="w-full bg-surface rounded-full h-2 mt-1">
                                <div
                                  className="bg-primary h-2 rounded-full"
                                  style={{ width: `${Math.min(score, 100)}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {testStarted && currentQuestion && (
            <div className="bg-surface rounded-2xl shadow-lg p-8 border border-secondary-muted">
              {/* Proctoring Status Bar */}
              <div className="mb-4 p-3 bg-secondary rounded-xl flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <div className={`flex items-center gap-2 ${isFullScreen ? 'text-green-600' : 'text-red-600'}`}>
                    <div className={`w-2 h-2 rounded-full ${isFullScreen ? 'bg-green-600' : 'bg-red-600'} animate-pulse`}></div>
                    <span>{isFullScreen ? 'Fullscreen Active' : 'Not Fullscreen'}</span>
                  </div>
                  <div className="text-ink/70">
                    Tab Switches: <span className={`font-bold ${tabSwitches > 3 ? 'text-red-600' : 'text-ink'}`}>{tabSwitches}</span>
                  </div>
                  <div className="text-ink/70">
                    Violations: <span className={`font-bold ${violations > 5 ? 'text-red-600' : 'text-ink'}`}>{violations}</span>
                  </div>
                </div>
                {!isFullScreen && (
                  <button
                    onClick={enterFullScreen}
                    className="px-3 py-1 bg-primary text-white rounded-lg text-xs hover:bg-primary/90"
                  >
                    Enter Fullscreen
                  </button>
                )}
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-ink/70">
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      currentQuestion.type === 'quantitative' ? 'bg-blue-100 text-blue-700' :
                      currentQuestion.type === 'logical' ? 'bg-purple-100 text-purple-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {currentQuestion.type}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      currentQuestion.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                      currentQuestion.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {currentQuestion.difficulty}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-secondary rounded-full h-2 mb-4">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                  />
                </div>
              </div>

              <h3 className="text-xl font-semibold text-ink mb-6">{currentQuestion.question}</h3>

              <div className="space-y-3 mb-8">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => selectAnswer(index)}
                    className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                      currentAnswer?.selectedAnswer === index
                        ? 'border-primary bg-primary/5'
                        : 'border-secondary-muted hover:border-primary/30 hover:bg-surface/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        currentAnswer?.selectedAnswer === index
                          ? 'border-primary bg-primary'
                          : 'border-secondary-muted'
                      }`}>
                        {currentAnswer?.selectedAnswer === index && (
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className="text-ink">{option}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between gap-4">
                <button
                  onClick={previousQuestion}
                  disabled={currentQuestionIndex === 0}
                  className="px-6 py-2 border-2 border-secondary-muted text-ink rounded-xl hover:bg-secondary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Previous
                </button>
                
                <div className="text-sm text-ink/70">
                  {userAnswers.length} / {questions.length} answered
                </div>

                {currentQuestionIndex < questions.length - 1 ? (
                  <button
                    onClick={nextQuestion}
                    className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all"
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    onClick={submitTest}
                    disabled={loading || userAnswers.length !== questions.length}
                    className="px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Submitting...' : 'Submit Test'}
                  </button>
                )}
              </div>
            </div>
          )}

          {testResult && (
            <div className="bg-surface rounded-2xl shadow-lg p-8 border border-secondary-muted">
              <div className="text-center mb-8">
                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl font-bold text-primary">{testResult.scorePercentage}%</span>
                </div>
                <h2 className="text-2xl font-bold text-ink mb-2">Test Completed!</h2>
                <p className="text-ink/70">Your results have been saved</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                  <div className="text-3xl font-bold text-green-600 mb-1">{testResult.correctAnswers}</div>
                  <div className="text-sm text-green-700">Correct Answers</div>
                </div>
                <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                  <div className="text-3xl font-bold text-red-600 mb-1">{testResult.incorrectAnswers}</div>
                  <div className="text-sm text-red-700">Incorrect Answers</div>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="text-3xl font-bold text-blue-600 mb-1">{testResult.totalQuestions}</div>
                  <div className="text-sm text-blue-700">Total Questions</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {testResult.timeTaken && (
                  <div className="p-4 bg-secondary rounded-xl">
                    <div className="text-sm text-ink/70 mb-1">Time Taken</div>
                    <div className="text-2xl font-bold text-ink">
                      {Math.floor(testResult.timeTaken / 60)}m {testResult.timeTaken % 60}s
                    </div>
                  </div>
                )}
                <div className="p-4 bg-secondary rounded-xl">
                  <div className="text-sm text-ink/70 mb-1">Proctoring Report</div>
                  <div className="text-sm space-y-1">
                    <div>Tab Switches: <span className="font-bold">{tabSwitches}</span></div>
                    <div>Total Violations: <span className="font-bold">{violations}</span></div>
                    <div className={`font-medium ${violations > 5 ? 'text-red-600' : 'text-green-600'}`}>
                      {violations > 5 ? '⚠️ High violations detected' : '✓ Clean test'}
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={restartTest}
                className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-all"
              >
                Take Another Test
              </button>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  )
}

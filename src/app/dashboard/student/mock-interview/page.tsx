'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'

interface Question {
  question_id: string
  question_text: string
  role_type: string
  topic: string
  difficulty: string
}

interface Session {
  session_id: string
  started_at: string
  total_score: number | null
}

interface SpeechAnalysis {
  durationSec: number
  wordCount: number
  wordsPerMinute: number
  fillerCount: number
  clarityScore: number
  notes: string[]
  paceComment: string
  fillerComment: string
}

// Loose SpeechRecognition type to avoid DOM typings in unsupported browsers
type SpeechRecognitionType = {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  onresult: ((event: any) => void) | null
  onerror: ((event: any) => void) | null
} | null

export default function MockInterviewPage() {
  const { user } = useAuth()
  const [session, setSession] = useState<Session | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [transcript, setTranscript] = useState('')
  const [analysis, setAnalysis] = useState<SpeechAnalysis | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({ role_type: '', topic: '', difficulty: '' })
  const [elapsedMs, setElapsedMs] = useState(0)
  const [speechSupported, setSpeechSupported] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recognitionRef = useRef<SpeechRecognitionType>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const recordingStartedAtRef = useRef<number | null>(null)

  useEffect(() => {
    if (!user) return
    initializeSession()
  }, [user])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const SpeechRecognitionConstructor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (SpeechRecognitionConstructor) {
      const recognition = new SpeechRecognitionConstructor()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'
      recognition.onresult = (event: any) => {
        const results = Array.from(event.results)
        const finalTranscript = results.map((result) => (result as any)[0].transcript).join(' ')
        setTranscript(finalTranscript.trim())
      }
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
      }
      recognitionRef.current = recognition
      setSpeechSupported(true)
    }

    return () => {
      recognitionRef.current?.stop()
    }
  }, [])

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
      if (!response.ok) throw new Error('Failed to initialize session')
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
    resetRecordingState()
    setCurrentQuestion(null)
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

  const resetRecordingState = () => {
    setTranscript('')
    setAnalysis(null)
    setAudioUrl(null)
    setElapsedMs(0)
    setIsRecording(false)
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    recognitionRef.current?.stop()
    mediaRecorderRef.current?.stop()
  }

  const startRecording = async () => {
    if (isRecording) return
    setError('')
    setAnalysis(null)
    setTranscript('')
    setAudioUrl(null)
    setElapsedMs(0)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      mediaRecorderRef.current = mediaRecorder
      recognitionRef.current?.start()

      recordingStartedAtRef.current = Date.now()
      timerRef.current = setInterval(() => {
        if (recordingStartedAtRef.current) {
          setElapsedMs(Date.now() - recordingStartedAtRef.current)
        }
      }, 200)

      setIsRecording(true)
    } catch (err) {
      console.error('Recording error:', err)
      setError('Microphone access was blocked. Please allow mic permissions and try again.')
    }
  }

  const stopRecording = () => {
    if (!isRecording) return
    recognitionRef.current?.stop()
    mediaRecorderRef.current?.stop()
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    const durationMs = recordingStartedAtRef.current
      ? Date.now() - recordingStartedAtRef.current
      : elapsedMs
    setElapsedMs(durationMs)
    recordingStartedAtRef.current = null
    setIsRecording(false)

    const durationSec = durationMs / 1000
    const words = transcript.trim() ? transcript.trim().split(/\s+/).length : 0
    const wpm = durationSec > 0 ? (words / durationSec) * 60 : 0
    const fillerWords = ['um', 'uh', 'like', 'you know', 'actually', 'basically', 'literally', 'so']
    const fillerCount = transcript
      .toLowerCase()
      .split(/[^a-zA-Z]+/)
      .filter((w) => fillerWords.includes(w)).length

    const idealWpmRange = [110, 160]
    const paceInRange = wpm >= idealWpmRange[0] && wpm <= idealWpmRange[1]
    const pacePenalty = Math.min(Math.abs(wpm - 135) / 135, 1)
    const fillerPenalty = Math.min(fillerCount * 0.07, 0.7)
    const brevityPenalty = words < 40 ? 0.4 : 0
    const clarityScore = Math.max(10 - (pacePenalty * 3 + fillerPenalty * 4 + brevityPenalty * 3), 1)

    const notes: string[] = []
    if (!paceInRange) notes.push(wpm < idealWpmRange[0] ? 'Pace up a bit; aim for a steady flow.' : 'Slow down slightly to stay clear.')
    if (fillerCount > 2) notes.push('Reduce filler words; add brief pauses instead.')
    if (words < 60) notes.push('Give a bit more detail (examples, trade-offs, steps).')
    if (durationSec < 30) notes.push('Aim for at least 30-60 seconds to cover context, approach, and outcome.')

    setAnalysis({
      durationSec: Number(durationSec.toFixed(1)),
      wordCount: words,
      wordsPerMinute: Number(wpm.toFixed(1)),
      fillerCount,
      clarityScore: Number(clarityScore.toFixed(1)),
      notes,
      paceComment: paceInRange ? 'Great pacing' : wpm < idealWpmRange[0] ? 'Too slow' : 'Too fast',
      fillerComment: fillerCount === 0 ? 'Clean delivery' : fillerCount <= 2 ? 'Light fillers' : 'Trim fillers',
    })
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

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <header className="bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-200/50 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/dashboard/student" className="text-gray-600 hover:text-gray-900 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </Link>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Technical Mock Interview</h1>
                  <p className="text-sm text-gray-600 mt-1">Speak your answer, get instant pacing and clarity feedback. No AI scoring.</p>
                </div>
              </div>
              {session && session.total_score !== null && (
                <div className="text-right bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 rounded-xl border border-blue-200">
                  <p className="text-sm text-gray-600">Active Session</p>
                  <p className={`text-2xl font-bold ${getScoreColor(session.total_score)}`}>
                    {(session.total_score ?? 0).toFixed(1)}/10
                  </p>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Question Filters</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role Type</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Topic</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
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

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl mb-6 shadow-sm">{error}</div>
          )}

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
                  <p className="text-gray-700 text-lg leading-relaxed">{currentQuestion.question_text}</p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-gray-50 border border-gray-200 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Speaking timer</p>
                      <p className="text-2xl font-semibold text-gray-900">{formatTime(elapsedMs)}</p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={startRecording}
                        disabled={isRecording}
                        className="px-4 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow"
                      >
                        Start
                      </button>
                      <button
                        onClick={stopRecording}
                        disabled={!isRecording}
                        className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed shadow"
                      >
                        Stop
                      </button>
                    </div>
                  </div>

                  {!speechSupported && (
                    <div className="mb-4 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-900">
                      Speech-to-text is not available in this browser. We will still track timing, and you can type notes below.
                    </div>
                  )}

                  <label className="block text-sm font-medium text-gray-700 mb-2">Transcript / Notes</label>
                  <textarea
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    placeholder="Your spoken words will appear here. Edit if needed."
                    rows={8}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-y transition-all bg-white"
                  />

                  {audioUrl && (
                    <div className="mt-4 flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-3">
                      <audio controls src={audioUrl} className="w-full" />
                    </div>
                  )}
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 h-full">
                  <h3 className="text-lg font-semibold text-blue-900 mb-3">Speaking checklist</h3>
                  <ul className="space-y-2 text-sm text-blue-900">
                    <li>✓ 30-90 seconds answer</li>
                    <li>✓ Outline: situation → approach → result</li>
                    <li>✓ Mention 1-2 trade-offs</li>
                    <li>✓ Keep pace steady (110-160 wpm)</li>
                    <li>✓ Minimize fillers; short pauses are fine</li>
                  </ul>
                  <button
                    onClick={stopRecording}
                    disabled={!isRecording}
                    className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Stop & Analyze
                  </button>
                </div>
              </div>
            </div>
          )}

          {analysis && (
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 border border-gray-100">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm text-gray-600">Local, non-AI feedback</p>
                  <h2 className="text-2xl font-bold text-gray-900">Speaking summary</h2>
                </div>
                <div className="flex gap-3">
                  <div className="text-right bg-gradient-to-r from-emerald-50 to-emerald-100 px-5 py-3 rounded-xl border border-emerald-200">
                    <p className="text-sm text-gray-600">Clarity score</p>
                    <p className={`text-3xl font-bold ${getScoreColor(analysis.clarityScore)}`}>
                      {analysis.clarityScore.toFixed(1)}/10
                    </p>
                  </div>
                  <div className="text-right bg-gradient-to-r from-blue-50 to-blue-100 px-5 py-3 rounded-xl border border-blue-200">
                    <p className="text-sm text-gray-600">Pace</p>
                    <p className="text-3xl font-bold text-blue-700">{analysis.wordsPerMinute.toFixed(0)} wpm</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="border border-gray-200 rounded-xl p-4">
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="text-xl font-semibold text-gray-900">{analysis.durationSec}s</p>
                </div>
                <div className="border border-gray-200 rounded-xl p-4">
                  <p className="text-sm text-gray-500">Word count</p>
                  <p className="text-xl font-semibold text-gray-900">{analysis.wordCount}</p>
                </div>
                <div className="border border-gray-200 rounded-xl p-4">
                  <p className="text-sm text-gray-500">Filler words</p>
                  <p className="text-xl font-semibold text-gray-900">{analysis.fillerCount} ({analysis.fillerComment})</p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-green-800 mb-2">Pace</h3>
                  <p className="text-gray-800">{analysis.paceComment}. Target 110-160 wpm; you are at {analysis.wordsPerMinute.toFixed(0)} wpm.</p>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-yellow-800 mb-2">Fillers</h3>
                  <p className="text-gray-800">{analysis.fillerCount === 0 ? 'Great job keeping it clean.' : `${analysis.fillerCount} filler${analysis.fillerCount === 1 ? '' : 's'} detected. Replace with a short pause.`}</p>
                </div>
              </div>

              {analysis.notes.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Quick fixes</h3>
                  <ul className="list-disc list-inside text-gray-800 space-y-1">
                    {analysis.notes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  onClick={() => setAnalysis(null)}
                  className="px-5 py-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all"
                >
                  Try Again
                </button>
                <button
                  onClick={fetchQuestion}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md"
                >
                  Next Question
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  )
}


'use client'

import { useState, useEffect, useRef } from 'react'
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

interface VoiceEvaluation {
  score: number
  technical_accuracy: number
  communication_clarity: number
  interview_readiness: number
  strengths: string
  weaknesses: string
  ideal_answer: string
  feedback: string
  voice_analysis?: {
    tone: string
    pace: string
    clarity: string
    confidence_level: string
    filler_words: string[]
    recommendations: string
  }
  behavioral_analysis?: {
    structure: string
    examples_used: string
    body_language_notes: string
    recommendations: string
  }
}

export default function VoiceFeedbackPage() {
  const { user } = useAuth()
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [transcription, setTranscription] = useState('')
  const [evaluation, setEvaluation] = useState<VoiceEvaluation | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [error, setError] = useState('')

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (user) {
      fetchQuestion()
    }
  }, [user])

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isRecording])

  const fetchQuestion = async () => {
    if (!user) return

    setIsLoading(true)
    setError('')
    setCurrentQuestion(null)
    setAudioBlob(null)
    setAudioUrl(null)
    setTranscription('')
    setEvaluation(null)
    setRecordingTime(0)

    try {
      const response = await fetch('/api/interview/question')
      if (!response.ok) {
        throw new Error('Failed to fetch question')
      }
      const question = await response.json()
      setCurrentQuestion(question)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch question')
    } finally {
      setIsLoading(false)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setAudioBlob(audioBlob)
        const url = URL.createObjectURL(audioBlob)
        setAudioUrl(url)

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)
    } catch (err) {
      setError('Failed to access microphone. Please check permissions.')
      console.error('Error accessing microphone:', err)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const submitAnswer = async () => {
    if (!user || !currentQuestion) {
      setError('Question not loaded')
      return
    }

    if (!audioBlob && !transcription.trim()) {
      setError('Please record an answer or provide text transcription')
      return
    }

    setIsEvaluating(true)
    setError('')

    try {
      // For now, we'll use text transcription if available, otherwise we need to upload audio
      // In a real implementation, you'd upload the audio blob to a storage service first
      const transcribedText = transcription.trim() || '[Audio recorded - transcription pending]'

      const response = await fetch('/api/interview/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: user.id,
          transcribed_answer: transcribedText,
          audio_url: audioUrl || null, // In production, this would be the uploaded URL
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
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
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Voice & Behavioral Feedback
                  </h1>
                  <p className="text-sm text-gray-600 mt-1">
                    Record your answers and get AI-powered voice & behavioral analysis
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl mb-6 shadow-sm">
              {error}
            </div>
          )}

          {isLoading && (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading question...</p>
            </div>
          )}

          {!isLoading && currentQuestion && (
            <div className="space-y-6">
              {/* Question Card */}
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
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">Question</h2>
                    <p className="text-gray-700 text-lg leading-relaxed">
                      {currentQuestion.question_text}
                    </p>
                  </div>
                </div>

                {/* Recording Section */}
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Record Your Answer</h3>
                  
                  <div className="flex flex-col items-center gap-6">
                    {/* Recording Button */}
                    <div className="relative">
                      <button
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={isEvaluating || !!evaluation}
                        className={`w-24 h-24 rounded-full flex items-center justify-center text-white font-semibold shadow-2xl transform transition-all ${
                          isRecording
                            ? 'bg-red-500 hover:bg-red-600 animate-pulse scale-110'
                            : 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 hover:scale-105'
                        } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
                      >
                        {isRecording ? (
                          <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 6h12v12H6z" />
                          </svg>
                        ) : (
                          <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                          </svg>
                        )}
                      </button>
                      {isRecording && (
                        <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 text-center">
                          <p className="text-2xl font-bold text-red-600">{formatTime(recordingTime)}</p>
                          <p className="text-sm text-gray-600 mt-1">Recording...</p>
                        </div>
                      )}
                    </div>

                    {/* Audio Playback */}
                    {audioUrl && !isRecording && (
                      <div className="w-full max-w-md">
                        <audio src={audioUrl} controls className="w-full rounded-lg" />
                      </div>
                    )}

                    {/* Transcription Input */}
                    <div className="w-full">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Or Type Your Answer (Optional - for transcription correction)
                      </label>
                      <textarea
                        value={transcription}
                        onChange={(e) => setTranscription(e.target.value)}
                        placeholder="Type your answer here or use voice recording..."
                        rows={6}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-y"
                        disabled={isEvaluating || !!evaluation}
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      onClick={submitAnswer}
                      disabled={!audioBlob && !transcription.trim() || isEvaluating || !!evaluation}
                      className="w-full max-w-md px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold text-lg"
                    >
                      {isEvaluating ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Analyzing...
                        </span>
                      ) : (
                        'Get Feedback'
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Evaluation Results */}
              {evaluation && (
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-gray-900">Feedback & Analysis</h2>
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
                        Ideal Answer
                      </h3>
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                        <p className="text-gray-700 leading-relaxed">{evaluation.ideal_answer}</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={fetchQuestion}
                    className="mt-8 w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold text-lg"
                  >
                    Try Another Question
                  </button>
                </div>
              )}
            </div>
          )}

          {!isLoading && !currentQuestion && (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Ready to Start</h3>
              <p className="mt-2 text-sm text-gray-500 mb-6">
                Click the button below to get a question and start recording!
              </p>
              <button
                onClick={fetchQuestion}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg font-semibold"
              >
                Get Question
              </button>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  )
}


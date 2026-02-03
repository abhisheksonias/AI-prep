'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import Link from 'next/link'

interface ResumeReview {
  id: string
  resume_text: string
  ats_score: number
  overall_rating: string
  analysis: {
    strengths: string[]
    weaknesses: string[]
    key_improvements: Array<{
      category: string
      suggestion: string
      priority: 'High' | 'Medium' | 'Low'
    }>
    ats_analysis: {
      keywords_match: number
      formatting_score: number
      content_quality: number
    }
    confidence_boost: string
  }
  created_at: string
}

export default function ResumeReviewPage() {
  const { user } = useAuth()
  const [resumeText, setResumeText] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [currentReview, setCurrentReview] = useState<ResumeReview | null>(null)
  const [reviewHistory, setReviewHistory] = useState<ResumeReview[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [isSaved, setIsSaved] = useState(false) // Track if current review is saved
  const [resumeLoading, setResumeLoading] = useState(false)
  const [resumeLoadError, setResumeLoadError] = useState('')
  const [resumeSource, setResumeSource] = useState('')
  const [activeTab, setActiveTab] = useState<'current' | 'previous'>('current')

  const fetchReviewHistory = useCallback(
    async (options?: { setLatest?: boolean; scope?: 'user' | 'all' }) => {
      if (options?.scope !== 'all' && !user?.id) return

      try {
        const params = new URLSearchParams()
        if (options?.scope === 'all') {
          params.set('scope', 'all')
        } else if (user?.id) {
          params.set('user_id', user.id)
        }

        const response = await fetch(`/api/resume/review?${params.toString()}`)
        const data = await response.json()

        if (response.ok && Array.isArray(data.reviews)) {
          setReviewHistory(data.reviews)

          if (options?.setLatest && data.reviews.length > 0) {
            setCurrentReview((prev) => prev ?? data.reviews[0])
            setIsSaved(true) // Reviews from history are already saved
          }
        }
      } catch (error) {
        console.error('Error fetching review history:', error)
      }
    },
    [user?.id]
  )

  // Load review history
  useEffect(() => {
    fetchReviewHistory({ setLatest: true, scope: 'user' })
  }, [fetchReviewHistory])

  // Refresh history when switching to Previous tab to ensure all reviews are fetched
  useEffect(() => {
    if (activeTab === 'previous') {
      fetchReviewHistory({ scope: 'all' })
    }
  }, [activeTab, fetchReviewHistory])

  // Load resume text from user profile
  useEffect(() => {
    const fetchResume = async () => {
      if (!user?.id) return

      setResumeLoading(true)
      setResumeLoadError('')

      try {
        const response = await fetch(`/api/student/profile?user_id=${user.id}`)
        const data = await response.json()

        if (response.ok && data.profile?.resume_text) {
          setResumeText(data.profile.resume_text)
          setResumeSource('Loaded from your profile')
        } else {
          setResumeText('')
          setResumeSource('')
          setResumeLoadError('No resume found. Please upload your resume from your profile page.')
        }
      } catch (error) {
        console.error('Error fetching resume:', error)
        setResumeLoadError('Failed to load your resume. Please refresh and try again.')
      } finally {
        setResumeLoading(false)
      }
    }

    fetchResume()
  }, [user])

  const handleAnalyze = async () => {
    if (!user?.id) return

    const trimmedResume = resumeText.trim()

    if (!trimmedResume) {
      setError('No resume found. Please upload your resume from your profile page first.')
      return
    }

    if (trimmedResume.length < 100) {
      setError('Your saved resume must be at least 100 characters long to analyze.')
      return
    }

    setLoading(true)
    setError('')
    setCurrentReview(null)
    setIsSaved(false)

    try {
      // First, analyze without saving
      const response = await fetch('/api/resume/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          resume_text: trimmedResume,
        }),
      })

      const data = await response.json()

      if (response.ok && data.analysis) {
        // Create a review object from analysis (without id, as it's not saved yet)
        const reviewData: ResumeReview = {
          id: 'temp-' + Date.now(), // Temporary ID
          resume_text: trimmedResume,
          ats_score: data.analysis.ats_score,
          overall_rating: data.analysis.overall_rating,
          analysis: {
            strengths: data.analysis.strengths,
            weaknesses: data.analysis.weaknesses,
            key_improvements: data.analysis.key_improvements,
            ats_analysis: data.analysis.ats_analysis,
            confidence_boost: data.analysis.confidence_boost,
          },
          created_at: new Date().toISOString(),
        }
        setCurrentReview(reviewData)
        setIsSaved(false) // Not saved yet
      } else {
        const errorMsg = data.error || 'Failed to analyze resume'
        const details = data.details ? ` (${data.details})` : ''
        setError(`${errorMsg}${details}`)
      }
    } catch (error) {
      console.error('Error analyzing resume:', error)
      setError('An error occurred while analyzing resume')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user?.id || !currentReview || isSaved) return

    setSaving(true)
    setError('')

    try {
      const response = await fetch('/api/resume/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          resume_text: currentReview.resume_text,
        }),
      })

      const data = await response.json()

      if (response.ok && data.review) {
        // Update with saved review (has real ID)
        setCurrentReview(data.review)
        setIsSaved(true)
        // Add to history
        setReviewHistory([data.review, ...reviewHistory.filter(r => r.id !== currentReview.id)])
      } else {
        const errorMsg = data.error || 'Failed to save review'
        let details = data.details ? ` (${data.details})` : ''
        
        // Special handling for foreign key constraint errors
        if (data.code === '23503' || errorMsg.includes('foreign key') || errorMsg.includes('User not found')) {
          setError(
            'User account issue detected. Please log out and log in again, then try saving the review.'
          )
        } else {
          setError(`${errorMsg}${details}`)
        }
      }
    } catch (error) {
      console.error('Error saving review:', error)
      setError('An error occurred while saving review')
    } finally {
      setSaving(false)
    }
  }

  const getRatingColor = (rating: string) => {
    switch (rating?.toLowerCase()) {
      case 'excellent':
        return 'text-green-600 bg-green-100'
      case 'good':
        return 'text-blue-600 bg-blue-100'
      case 'fair':
        return 'text-yellow-600 bg-yellow-100'
      default:
        return 'text-red-600 bg-red-100'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-blue-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300'
    }
  }

  return (
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link
                  href="/dashboard/student"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  ← Back to Dashboard
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Resume Review</h1>
                  <p className="text-sm text-gray-600 mt-1">
                    Get AI-powered resume analysis with ATS score and improvement suggestions
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Resume Input & History */}
            <div className="lg:col-span-1 space-y-6">
              {/* Resume Input Form */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold text-gray-900">Analyze Your Resume</h2>
                  <Link
                    href="/dashboard/student/profile"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Update Profile
                  </Link>
                </div>

                <div className="space-y-4">
                  {/* <div>
                    <p className="text-sm text-gray-700">
                      We loaded the resume you saved in your profile. Review it below and start the analysis.
                    </p>
                    <div className="mt-3">
                      {resumeLoading ? (
                        <div className="h-56 border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center text-sm text-gray-600">
                          Loading your resume...
                        </div>
                      ) : resumeText ? (
                        <div className="h-56 border border-gray-200 rounded-lg bg-gray-50 p-3 overflow-y-auto text-sm text-gray-800 whitespace-pre-wrap">
                          {resumeText}
                        </div>
                      ) : (
                        <div className="h-56 border border-dashed border-gray-300 rounded-lg bg-gray-50 p-3 flex items-center justify-center text-sm text-gray-500 text-center">
                          No resume on file. Please upload your resume from the profile page to analyze it.
                        </div>
                      )}
                      <p className="mt-2 text-xs text-gray-500">
                        {resumeText.length} characters {resumeSource ? `• ${resumeSource}` : ''}
                      </p>
                      {resumeLoadError && (
                        <div className="mt-3 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm">
                          {resumeLoadError}
                        </div>
                      )}
                    </div>
                  </div> */}

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  <button
                    onClick={handleAnalyze}
                    disabled={loading || resumeLoading || resumeText.trim().length < 100}
                    className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? (
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
                        Analyzing...
                      </span>
                    ) : (
                      'Start Analysis'
                    )}
                  </button>
                </div>
              </div>

              {/* Review History */}
              {reviewHistory.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Review History</h2>
                    <button
                      onClick={() => setShowHistory(!showHistory)}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      {showHistory ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {showHistory && (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {reviewHistory.map((review) => (
                        <button
                          key={review.id}
                          onClick={() => {
                            setCurrentReview(review)
                            setIsSaved(true) // Reviews from history are already saved
                          }}
                          className={`w-full text-left p-3 rounded-lg border transition-colors ${
                            currentReview?.id === review.id
                              ? 'bg-blue-50 border-blue-300'
                              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-900">
                              {new Date(review.created_at).toLocaleDateString()}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getScoreColor(review.ats_score)}`}>
                              {review.ats_score}/100
                            </span>
                          </div>
                          <p className="text-xs text-gray-600">
                            {review.overall_rating}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column - Results */}
            <div className="lg:col-span-2">
              <div className="space-y-6">
                {/* Tabs */}
                <div className="bg-white rounded-lg shadow">
                  <div className="flex border-b border-gray-200">
                    <button
                      onClick={() => setActiveTab('current')}
                      className={`flex-1 px-6 py-3 font-medium text-center transition-colors ${
                        activeTab === 'current'
                          ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      📊 Current Analysis
                    </button>
                    <button
                      onClick={() => setActiveTab('previous')}
                      className={`flex-1 px-6 py-3 font-medium text-center transition-colors ${
                        activeTab === 'previous'
                          ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      📈 Previous Scores ({reviewHistory.length})
                    </button>
                  </div>
                </div>

                {/* Current Analysis Tab */}
                {activeTab === 'current' && currentReview && (
                  <div className="space-y-6">
                    {!isSaved && (
                      <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <svg className="w-6 h-6 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <p className="text-yellow-800 font-medium">Review not saved. Click Save to store this analysis.</p>
                          </div>
                          <button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                          >
                            {saving ? (
                              <>
                                <svg
                                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                                Saving...
                              </>
                            ) : (
                              <>
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                </svg>
                                Save Review
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {isSaved && (
                      <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                        <div className="flex items-center">
                          <svg className="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-green-800 font-medium">Review saved successfully!</p>
                        </div>
                      </div>
                    )}

                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-lg p-8 text-white">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h2 className="text-2xl font-bold mb-2">ATS Score</h2>
                          <p className="text-blue-100">Applicant Tracking System Compatibility</p>
                        </div>
                        <div className="text-right">
                          <div className="text-6xl font-bold">{currentReview.ats_score}</div>
                          <div className="text-2xl">/100</div>
                        </div>
                      </div>
                      <div className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${getRatingColor(currentReview.overall_rating)}`}>
                        {currentReview.overall_rating}
                      </div>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                      <div className="flex items-start">
                        <svg className="w-6 h-6 text-green-600 mt-1 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <h3 className="text-lg font-semibold text-green-900 mb-2">Keep Going! 💪</h3>
                          <p className="text-green-800">{currentReview.analysis.confidence_boost}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed ATS Analysis</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className={`text-3xl font-bold mb-2 ${getScoreColor(currentReview.analysis.ats_analysis.keywords_match)}`}>
                            {currentReview.analysis.ats_analysis.keywords_match}
                          </div>
                          <div className="text-sm text-gray-600">Keywords Match</div>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className={`text-3xl font-bold mb-2 ${getScoreColor(currentReview.analysis.ats_analysis.formatting_score)}`}>
                            {currentReview.analysis.ats_analysis.formatting_score}
                          </div>
                          <div className="text-sm text-gray-600">Formatting Score</div>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className={`text-3xl font-bold mb-2 ${getScoreColor(currentReview.analysis.ats_analysis.content_quality)}`}>
                            {currentReview.analysis.ats_analysis.content_quality}
                          </div>
                          <div className="text-sm text-gray-600">Content Quality</div>
                        </div>
                      </div>
                    </div>

                    {currentReview.analysis.strengths.length > 0 && (
                      <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Strengths ✨</h3>
                        <ul className="space-y-2">
                          {currentReview.analysis.strengths.map((strength, index) => (
                            <li key={index} className="flex items-start">
                              <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <span className="text-gray-700">{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {currentReview.analysis.weaknesses.length > 0 && (
                      <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Areas for Improvement</h3>
                        <ul className="space-y-2">
                          {currentReview.analysis.weaknesses.map((weakness, index) => (
                            <li key={index} className="flex items-start">
                              <svg className="w-5 h-5 text-yellow-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              <span className="text-gray-700">{weakness}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {currentReview.analysis.key_improvements.length > 0 && (
                      <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Improvements</h3>
                        <div className="space-y-4">
                          {currentReview.analysis.key_improvements.map((improvement, index) => (
                            <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-gray-900">{improvement.category}</span>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(improvement.priority)}`}>
                                  {improvement.priority} Priority
                                </span>
                              </div>
                              <p className="text-gray-700">{improvement.suggestion}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'current' && !currentReview && (
                  <div className="bg-white rounded-lg shadow p-12 text-center">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Analysis Yet</h3>
                    <p className="text-gray-600">Analyze your resume to see results here.</p>
                  </div>
                )}

                {activeTab === 'previous' && reviewHistory.length > 0 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {reviewHistory.map((review, index) => (
                        <div
                          key={review.id}
                          onClick={() => {
                            setCurrentReview(review)
                            setActiveTab('current')
                            setIsSaved(true)
                          }}
                          className="bg-white rounded-lg shadow p-6 hover:shadow-lg hover:bg-blue-50 cursor-pointer transition-all border-l-4 border-blue-500"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                Review #{reviewHistory.length - index}
                              </h3>
                              <p className="text-sm text-gray-500 mt-1">
                                {new Date(review.created_at).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className={`text-4xl font-bold ${getScoreColor(review.ats_score)}`}>
                                {review.ats_score}
                              </div>
                              <div className="text-xs text-gray-500">/100</div>
                            </div>
                          </div>

                          <div className="mb-4">
                            <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getRatingColor(review.overall_rating)}`}>
                              {review.overall_rating}
                            </div>
                          </div>

                          {review.analysis && (
                            <div className="space-y-2">
                              <div className="flex items-center text-sm text-gray-600">
                                <svg className="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span>{review.analysis.strengths?.length || 0} Strengths</span>
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <svg className="w-4 h-4 mr-2 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <span>{review.analysis.weaknesses?.length || 0} Areas to Improve</span>
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <svg className="w-4 h-4 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M13 7H7v6h6V7z" />
                                </svg>
                                <span>{review.analysis.key_improvements?.length || 0} Key Improvements</span>
                              </div>
                            </div>
                          )}

                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setCurrentReview(review)
                                setActiveTab('current')
                                setIsSaved(true)
                              }}
                              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {reviewHistory.length >= 2 && (
                      <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Score Progression</h3>
                        <div className="space-y-3">
                          {[...reviewHistory].reverse().map((review) => (
                            <div key={review.id} className="flex items-center gap-4">
                              <div className="w-24 text-sm text-gray-600">
                                {new Date(review.created_at).toLocaleDateString()}
                              </div>
                              <div className="flex-1">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full ${
                                      review.ats_score >= 80
                                        ? 'bg-green-600'
                                        : review.ats_score >= 60
                                        ? 'bg-blue-600'
                                        : review.ats_score >= 40
                                        ? 'bg-yellow-600'
                                        : 'bg-red-600'
                                    }`}
                                    style={{ width: `${review.ats_score}%` }}
                                  ></div>
                                </div>
                              </div>
                              <div className="w-16 text-right font-semibold text-gray-900">
                                {review.ats_score}/100
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'previous' && reviewHistory.length === 0 && (
                  <div className="bg-white rounded-lg shadow p-12 text-center">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Previous Reviews</h3>
                    <p className="text-gray-600">Run an analysis to start building history.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}


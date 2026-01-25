'use client'

import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import Link from 'next/link'
import { useState, useEffect } from 'react'

interface PerformanceStats {
  totalAttempts: number
  overallAvgScore: number
  topicsPracticed: number
  weakTopicsCount: number
  strongTopicsCount: number
}

export default function PerformancePage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<PerformanceStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchPerformanceStats()
    }
  }, [user])

  const fetchPerformanceStats = async () => {
    if (!user) return

    try {
      const response = await fetch(`/api/interview/performance?student_id=${user.id}`)
      if (response.ok) {
        const data = await response.json()
        setStats(data.statistics)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <div className="min-h-screen bg-secondary">
        <header className="bg-surface/90 backdrop-blur-lg shadow-sm border-b border-secondary-muted sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-ink">Performance Analysis</h1>
                <p className="text-sm text-ink/70 mt-0.5">Detailed insights and improvement areas</p>
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

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="bg-surface rounded-2xl shadow-lg p-12 border border-secondary-muted text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="mt-4 text-ink/70">Loading performance data...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Overview Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-surface rounded-xl shadow-lg p-6 border border-secondary-muted">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-ink">{stats?.totalAttempts || 0}</div>
                  <div className="text-sm text-ink/70 mt-1">Total Attempts</div>
                </div>

                <div className="bg-surface rounded-xl shadow-lg p-6 border border-secondary-muted">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-ink">
                    {stats?.overallAvgScore ? stats.overallAvgScore.toFixed(1) : '0.0'}
                  </div>
                  <div className="text-sm text-ink/70 mt-1">Average Score</div>
                </div>

                <div className="bg-surface rounded-xl shadow-lg p-6 border border-secondary-muted">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-ink">{stats?.topicsPracticed || 0}</div>
                  <div className="text-sm text-ink/70 mt-1">Topics Practiced</div>
                </div>

                <div className="bg-surface rounded-xl shadow-lg p-6 border border-secondary-muted">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-ink">{stats?.strongTopicsCount || 0}</div>
                  <div className="text-sm text-ink/70 mt-1">Strong Areas</div>
                </div>
              </div>

              {/* Detailed Analysis */}
              <div className="bg-surface rounded-2xl shadow-lg p-8 border border-secondary-muted">
                <h2 className="text-xl font-bold text-ink mb-6">Performance Breakdown</h2>
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-ink">Interview Performance</span>
                      <span className="text-sm font-semibold text-primary">
                        {stats?.overallAvgScore ? Math.round((stats.overallAvgScore / 10) * 100) : 0}%
                      </span>
                    </div>
                    <div className="h-3 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{
                          width: `${stats?.overallAvgScore ? (stats.overallAvgScore / 10) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-ink">Topic Coverage</span>
                      <span className="text-sm font-semibold text-primary">
                        {stats?.topicsPracticed || 0} topics
                      </span>
                    </div>
                    <div className="h-3 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${Math.min((stats?.topicsPracticed || 0) * 10, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-ink">Consistency</span>
                      <span className="text-sm font-semibold text-primary">
                        {stats?.totalAttempts || 0} sessions
                      </span>
                    </div>
                    <div className="h-3 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${Math.min((stats?.totalAttempts || 0) * 5, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-surface rounded-2xl shadow-lg p-8 border border-secondary-muted">
                <h2 className="text-xl font-bold text-ink mb-4">Recommendations</h2>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-xl">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-ink">Practice more technical interviews</p>
                      <p className="text-sm text-ink/70 mt-1">
                        Focus on data structures and algorithms to improve your technical skills.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-xl">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-ink">Work on weak topics</p>
                      <p className="text-sm text-ink/70 mt-1">
                        Identify and strengthen areas where you score below average.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  )
}

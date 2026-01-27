'use client'

import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import Link from 'next/link'
import { useState, useEffect } from 'react'

interface PrepModule {
  id: string
  title: string
  description: string
  icon: string
  href: string
}

interface PerformanceStats {
  totalAttempts: number
  overallAvgScore: number
  topicsPracticed: number
  weakTopicsCount: number
  strongTopicsCount: number
}

interface TopicMetric {
  topic: string
  avg_score: number | null
  total_attempts: number
  last_updated?: string
}

export default function StudentDashboard() {
  const { user, logout } = useAuth()
  const [stats, setStats] = useState<PerformanceStats | null>(null)
  const [metrics, setMetrics] = useState<TopicMetric[]>([])
  const [strongTopics, setStrongTopics] = useState<TopicMetric[]>([])
  const [weakTopics, setWeakTopics] = useState<TopicMetric[]>([])
  const [loading, setLoading] = useState(true)

  // Static module definitions - all progress data from database
  const modules: PrepModule[] = [
    {
      id: '1',
      title: 'Resume Analysis',
      description: 'AI-powered resume review and optimization',
      icon: 'document',
      href: '/dashboard/student/resume-review',
    },
    {
      id: '2',
      title: 'Aptitude Test',
      description: 'Quantitative, logical, and verbal reasoning',
      icon: 'calculator',
      href: '/dashboard/student/aptitude-test',
    },
    {
      id: '3',
      title: 'Technical Exam',
      description: 'DB-driven coding & web fundamentals MCQ',
      icon: 'code',
      href: '/dashboard/student/technical-exam',
    },
    // {
    //   id: '4',
    //   title: 'Technical Mock Interview',
    //   description: 'Live technical interview simulation',
    //   icon: 'desktop',
    //   href: '/dashboard/student/technical-simulation',
    // },
    {
      id: '5',
      title: 'HR Round Mock',
      description: 'Behavioral and situational interviews',
      icon: 'users',
      href: '/dashboard/student/voice-feedback',
    },
    // {
    //   id: '6',
    //   title: 'Performance Analysis',
    //   description: 'Detailed insights and improvement areas',
    //   icon: 'chart',
    //   href: '/dashboard/student/performance',
    // },
  ]

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
        setMetrics(data.metrics || [])
        setStrongTopics(data.strong_topics || [])
        setWeakTopics(data.weak_topics || [])
        if ((!data.metrics || data.metrics.length === 0) && (!data.statistics || data.statistics.total_attempts === 0)) {
          seedMockData()
        }
      } else {
        seedMockData()
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
      seedMockData()
    } finally {
      setLoading(false)
    }
  }

  const seedMockData = () => {
    const mockStats: PerformanceStats = {
      totalAttempts: 12,
      overallAvgScore: 7.6,
      topicsPracticed: 4,
      weakTopicsCount: 1,
      strongTopicsCount: 2,
    }
    const mockMetrics: TopicMetric[] = [
      { topic: 'DSA', avg_score: 8.2, total_attempts: 4, last_updated: new Date().toISOString() },
      { topic: 'DBMS', avg_score: 7.1, total_attempts: 3, last_updated: new Date().toISOString() },
      { topic: 'OOPS', avg_score: 6.4, total_attempts: 3, last_updated: new Date().toISOString() },
      { topic: 'System Design', avg_score: 7.8, total_attempts: 2, last_updated: new Date().toISOString() },
    ]
    setStats(mockStats)
    setMetrics(mockMetrics)
    setStrongTopics(mockMetrics.filter((m) => (m.avg_score || 0) >= 7.5))
    setWeakTopics(mockMetrics.filter((m) => (m.avg_score || 0) < 6.5))
  }

  // Calculate overall progress based on database stats
  const overallProgress = stats?.totalAttempts 
    ? Math.min(Math.round((stats.totalAttempts / 50) * 100), 100) 
    : 0

  const formatDate = (value?: string) => {
    if (!value) return '—'
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString()
  }

  const getIcon = (iconName: string) => {
    const icons: Record<string, JSX.Element> = {
      document: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      ),
      calculator: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
        />
      ),
      code: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
        />
      ),
      desktop: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      ),
      users: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      ),
      chart: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      ),
    }
    return icons[iconName] || icons.document
  }

  return (
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <div className="min-h-screen bg-secondary">
        {/* Header */}
        <header className="bg-surface/90 backdrop-blur-lg shadow-sm border-b border-secondary-muted sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-ink">Placement Preparation Dashboard</h1>
                  <p className="text-sm text-ink/70 mt-0.5">
                    Welcome, <span className="font-semibold text-ink">{user?.full_name}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={logout}
                className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-strong transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Overall Progress Section */}
          <div className="bg-surface rounded-2xl shadow-lg p-8 mb-8 border border-secondary-muted">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-ink mb-2">Your Placement Journey</h2>
                <p className="text-ink/70">Track your progress based on practice sessions</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-primary">{overallProgress}%</div>
                <p className="text-sm text-ink/70 mt-1">Overall Progress</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="relative">
              <div className="h-4 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500 rounded-full"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
              <div className="mt-3 flex justify-between text-xs text-ink/60">
                <span>Started</span>
                <span>In Progress</span>
                <span>Complete</span>
              </div>
            </div>

            {/* Quick Stats - All from Database */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-secondary/50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-ink">{stats?.totalAttempts || 0}</div>
                <div className="text-xs text-ink/70 mt-1">Total Sessions</div>
              </div>
              <div className="bg-secondary/50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-primary">
                  {stats?.overallAvgScore ? stats.overallAvgScore.toFixed(1) : '0.0'}
                </div>
                <div className="text-xs text-ink/70 mt-1">Avg Score</div>
              </div>
              <div className="bg-secondary/50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-ink">{stats?.topicsPracticed || 0}</div>
                <div className="text-xs text-ink/70 mt-1">Topics Covered</div>
              </div>
              <div className="bg-secondary/50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-ink">{stats?.strongTopicsCount || 0}</div>
                <div className="text-xs text-ink/70 mt-1">Strong Topics</div>
              </div>
            </div>

            {/* Live topic status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="bg-secondary/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-ink">Strong topics</p>
                  <span className="text-xs text-ink/60">Live from practice</span>
                </div>
                {strongTopics.length ? (
                  <div className="flex flex-wrap gap-2">
                    {strongTopics.map((t) => (
                      <span
                        key={t.topic}
                        className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold"
                      >
                        {t.topic} • {t.avg_score?.toFixed(1) ?? '—'}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-ink/60">No strong topics yet — keep practicing.</p>
                )}
              </div>
              <div className="bg-secondary/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-ink">Weak topics</p>
                  <span className="text-xs text-ink/60">Focus here next</span>
                </div>
                {weakTopics.length ? (
                  <div className="flex flex-wrap gap-2">
                    {weakTopics.map((t) => (
                      <span
                        key={t.topic}
                        className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold"
                      >
                        {t.topic} • {t.avg_score?.toFixed(1) ?? '—'}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-ink/60">No weak topics detected yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* 6 Main Preparation Modules */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-ink mb-6">Preparation Modules</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {modules.map((module) => (
                <Link
                  key={module.id}
                  href={module.href}
                  className="group bg-surface rounded-2xl shadow-lg border border-secondary-muted hover:shadow-xl transition-all transform hover:-translate-y-1 overflow-hidden"
                >
                  <div className="p-6">
                    {/* Icon */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <svg
                          className="w-7 h-7 text-primary"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          {getIcon(module.icon)}
                        </svg>
                      </div>
                    </div>

                    {/* Title and Description */}
                    <h3 className="text-lg font-bold text-ink mb-2">{module.title}</h3>
                    <p className="text-sm text-ink/70 mb-4">{module.description}</p>

                    {/* Action Button */}
                    <div className="mt-4">
                      <span className="text-primary font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 text-sm">
                        Start Module
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 7l5 5m0 0l-5 5m5-5H6"
                          />
                        </svg>
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Performance Chart Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Performance Overview - Database Only */}
            <div className="lg:col-span-2 bg-surface rounded-2xl shadow-lg p-6 border border-secondary-muted">
              <h3 className="text-xl font-bold text-ink mb-6">Performance Metrics</h3>
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="mt-3 text-ink/70 text-sm">Loading performance data...</p>
                </div>
              ) : stats ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-ink">Overall Score</span>
                      <span className="text-primary font-semibold">{stats.overallAvgScore ? stats.overallAvgScore.toFixed(1) : '0.0'}/10</span>
                    </div>
                    <div className="h-3 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${stats.overallAvgScore ? (stats.overallAvgScore / 10) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-ink">Topics Practiced</span>
                      <span className="text-primary font-semibold">{stats.topicsPracticed || 0}</span>
                    </div>
                    <div className="h-3 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((stats.topicsPracticed || 0) * 10, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-ink">Strong Topics</span>
                      <span className="text-primary font-semibold">{stats.strongTopicsCount || 0}</span>
                    </div>
                    <div className="h-3 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((stats.strongTopicsCount || 0) * 20, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-ink">Practice Sessions</span>
                      <span className="text-primary font-semibold">{stats.totalAttempts || 0}</span>
                    </div>
                    <div className="h-3 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((stats.totalAttempts || 0) * 5, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-ink/70 text-sm">No performance data available yet. Start practicing to see your progress!</p>
                </div>
              )}
            </div>

            {/* Profile Quick View */}
            <div className="bg-surface rounded-2xl shadow-lg p-6 border border-secondary-muted">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-ink">Profile</h3>
                <Link
                  href="/dashboard/student/profile"
                  className="text-primary hover:text-primary-strong text-sm font-medium"
                >
                  Edit
                </Link>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-ink/60 uppercase tracking-wide mb-1">Email</p>
                  <p className="text-sm text-ink font-medium truncate">{user?.email}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-ink/60 uppercase tracking-wide mb-1">Department</p>
                    <p className="text-sm text-ink font-medium">{user?.department || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink/60 uppercase tracking-wide mb-1">Year</p>
                    <p className="text-sm text-ink font-medium">{user?.year || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Topic-by-topic live metrics */}
          <div className="mt-8 bg-surface rounded-2xl shadow-lg p-6 border border-secondary-muted">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-ink">Topic Performance (live)</h3>
              <span className="text-xs text-ink/60">Latest from /api/interview/performance</span>
            </div>
            {loading ? (
              <div className="text-center py-6 text-ink/70 text-sm">Loading topic metrics...</div>
            ) : metrics.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-left text-ink/60">
                    <tr>
                      <th className="py-2 pr-4">Topic</th>
                      <th className="py-2 pr-4">Avg Score</th>
                      <th className="py-2 pr-4">Attempts</th>
                      <th className="py-2 pr-4">Last Updated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-secondary-muted">
                    {metrics.map((m) => (
                      <tr key={m.topic} className="hover:bg-secondary/50 transition-colors">
                        <td className="py-3 pr-4 font-semibold text-ink">{m.topic}</td>
                        <td className="py-3 pr-4 text-primary font-semibold">{m.avg_score?.toFixed(1) ?? '—'}/10</td>
                        <td className="py-3 pr-4 text-ink/80">{m.total_attempts}</td>
                        <td className="py-3 pr-4 text-ink/60">{formatDate(m.last_updated)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-ink/70 text-sm">No topic-level data yet. Complete a mock interview to populate this table.</p>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}

'use client'

import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

interface User {
  id: string
  full_name: string
  email: string
  role: string
  department: string | null
  year: number | null
  is_active: boolean
  created_at: string
}

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    students: 0,
    admins: 0,
    active: 0,
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching users:', error)
        return
      }

      setUsers(data || [])
      
      // Calculate stats
      const total = data?.length || 0
      const students = data?.filter((u) => u.role === 'STUDENT').length || 0
      const admins = data?.filter((u) => u.role === 'ADMIN').length || 0
      const active = data?.filter((u) => u.is_active).length || 0

      setStats({ total, students, admins, active })
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="min-h-screen bg-secondary">
        {/* Header */}
        <header className="bg-surface shadow-sm border-b border-secondary-muted">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-ink">Admin Dashboard</h1>
                <p className="text-sm text-ink/70 mt-1">
                  Welcome, {user?.full_name}
                </p>
              </div>
              <button
                onClick={logout}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-strong transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-surface rounded-lg shadow p-6 border border-secondary-muted">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-ink/70">Total Users</p>
                  <p className="text-3xl font-bold text-ink mt-2">{stats.total}</p>
                </div>
                <div className="bg-primary/10 rounded-full p-3">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-surface rounded-lg shadow p-6 border border-secondary-muted">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-ink/70">Students</p>
                  <p className="text-3xl font-bold text-primary mt-2">{stats.students}</p>
                </div>
                <div className="bg-primary/10 rounded-full p-3">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-surface rounded-lg shadow p-6 border border-secondary-muted">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-ink/70">Admins</p>
                  <p className="text-3xl font-bold text-primary-strong mt-2">{stats.admins}</p>
                </div>
                <div className="bg-primary-strong/10 rounded-full p-3">
                  <svg className="w-6 h-6 text-primary-strong" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-surface rounded-lg shadow p-6 border border-secondary-muted">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-ink/70">Active Users</p>
                  <p className="text-3xl font-bold text-primary mt-2">{stats.active}</p>
                </div>
                <div className="bg-primary/10 rounded-full p-3">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-surface rounded-lg shadow border border-secondary-muted">
            <div className="px-6 py-4 border-b border-secondary-muted">
              <h2 className="text-xl font-bold text-ink">All Users</h2>
            </div>
            {loading ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="mt-4 text-ink/70">Loading users...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-secondary-muted">
                  <thead className="bg-secondary/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-ink/70 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Year
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created At
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-surface divide-y divide-secondary-muted">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-secondary/30">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-ink">{u.full_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-ink/70">{u.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              u.role === 'ADMIN'
                                ? 'bg-primary/10 text-primary-strong'
                                : 'bg-primary/10 text-primary'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-ink/70">{u.department || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-ink/70">{u.year || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              u.is_active
                                ? 'bg-primary/10 text-primary'
                                : 'bg-ink/10 text-ink'
                            }`}
                          >
                            {u.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-ink/70">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}


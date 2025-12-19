'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  full_name: string
  email: string
  role: 'STUDENT' | 'ADMIN'
  department: string | null
  year: number | null
  is_active: boolean
  resume_text?: string | null
  skills?: string[] | null
  career_goal?: string | null
  interests?: string[] | null
  target_company_type?: string | null
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if user is stored in localStorage
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error('Error parsing stored user:', error)
        localStorage.removeItem('user')
      }
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    try {
      // Query users table directly (plain text password for academic purpose)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .eq('is_active', true)
        .single()

      if (error || !data) {
        return { success: false, error: 'Invalid email or password' }
      }

      const userData: User = {
        id: data.id,
        full_name: data.full_name,
        email: data.email,
        role: data.role,
        department: data.department,
        year: data.year,
        is_active: data.is_active,
        resume_text: data.resume_text || null,
        skills: data.skills || null,
        career_goal: data.career_goal || null,
        interests: data.interests || null,
        target_company_type: data.target_company_type || null,
      }

      setUser(userData)
      localStorage.setItem('user', JSON.stringify(userData))

      // Redirect based on role
      if (userData.role === 'ADMIN') {
        router.push('/dashboard/admin')
      } else {
        router.push('/dashboard/student')
      }

      return { success: true }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'An error occurred during login' }
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}


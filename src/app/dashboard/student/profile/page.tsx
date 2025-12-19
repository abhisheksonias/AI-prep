'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface ProfileData {
  resume_text: string
  skills: string[]
  career_goal: string
  interests: string[]
  target_company_type: string
}

export default function ProfilePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [profileData, setProfileData] = useState<ProfileData>({
    resume_text: '',
    skills: [],
    career_goal: '',
    interests: [],
    target_company_type: '',
  })

  const [skillInput, setSkillInput] = useState('')
  const [interestInput, setInterestInput] = useState('')

  // Load profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return

      try {
        const response = await fetch(`/api/student/profile?user_id=${user.id}`)
        const data = await response.json()

        if (response.ok && data.profile) {
          setProfileData({
            resume_text: data.profile.resume_text ?? '',
            skills: Array.isArray(data.profile.skills) ? data.profile.skills : [],
            career_goal: data.profile.career_goal ?? '',
            interests: Array.isArray(data.profile.interests) ? data.profile.interests : [],
            target_company_type: data.profile.target_company_type ?? '',
          })
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [user])

  const addSkill = () => {
    if (skillInput.trim() && !profileData.skills.includes(skillInput.trim())) {
      setProfileData({
        ...profileData,
        skills: [...profileData.skills, skillInput.trim()],
      })
      setSkillInput('')
    }
  }

  const removeSkill = (skill: string) => {
    setProfileData({
      ...profileData,
      skills: profileData.skills.filter((s) => s !== skill),
    })
  }

  const addInterest = () => {
    if (interestInput.trim() && !profileData.interests.includes(interestInput.trim())) {
      setProfileData({
        ...profileData,
        interests: [...profileData.interests, interestInput.trim()],
      })
      setInterestInput('')
    }
  }

  const removeInterest = (interest: string) => {
    setProfileData({
      ...profileData,
      interests: profileData.interests.filter((i) => i !== interest),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)

    try {
      const response = await fetch('/api/student/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user?.id,
          resume_text: profileData.resume_text || null,
          skills: profileData.skills.length > 0 ? profileData.skills : null,
          career_goal: profileData.career_goal || null,
          interests: profileData.interests.length > 0 ? profileData.interests : null,
          target_company_type: profileData.target_company_type || null,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Profile updated successfully!')
        // Update user in localStorage
        if (user) {
          const updatedUser = { ...user, ...data.profile }
          localStorage.setItem('user', JSON.stringify(updatedUser))
        }
        // Scroll to top to show success message
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        setError(data.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      setError('An error occurred while updating profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['STUDENT']}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading profile...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
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
                  <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
                  <p className="text-sm text-gray-600 mt-1">
                    Update your profile information for personalized interviews
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Success/Error Messages */}
          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
              {success}
            </div>
          )}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Resume Text */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Resume / Bio</h2>
              <textarea
                id="resume_text"
                rows={8}
                value={profileData.resume_text}
                onChange={(e) =>
                  setProfileData({ ...profileData, resume_text: e.target.value })
                }
                placeholder="Paste your resume text or write a brief bio about yourself, your education, experience, and achievements..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              />
              <p className="mt-2 text-sm text-gray-500">
                This helps AI generate personalized interview questions for you.
              </p>
            </div>

            {/* Skills */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Skills</h2>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addSkill()
                    }
                  }}
                  placeholder="e.g., DSA, Java, React, Python"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <button
                  type="button"
                  onClick={addSkill}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add
                </button>
              </div>
              {profileData.skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {profileData.skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Career Goal */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Career Goal</h2>
              <select
                id="career_goal"
                value={profileData.career_goal || ''}
                onChange={(e) =>
                  setProfileData({ ...profileData, career_goal: e.target.value || '' })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="">Select your career goal</option>
                <option value="SDE">Software Development Engineer (SDE)</option>
                <option value="Full Stack Developer">Full Stack Developer</option>
                <option value="Backend Developer">Backend Developer</option>
                <option value="Frontend Developer">Frontend Developer</option>
                <option value="Data Scientist">Data Scientist</option>
                <option value="Data Analyst">Data Analyst</option>
                <option value="DevOps Engineer">DevOps Engineer</option>
                <option value="Product Manager">Product Manager</option>
                <option value="Business Analyst">Business Analyst</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Interests */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Interests</h2>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={interestInput}
                  onChange={(e) => setInterestInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addInterest()
                    }
                  }}
                  placeholder="e.g., Backend, AI, Mobile Development"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <button
                  type="button"
                  onClick={addInterest}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add
                </button>
              </div>
              {profileData.interests.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {profileData.interests.map((interest) => (
                    <span
                      key={interest}
                      className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                    >
                      {interest}
                      <button
                        type="button"
                        onClick={() => removeInterest(interest)}
                        className="ml-2 text-purple-600 hover:text-purple-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Target Company Type */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Target Company Type</h2>
              <select
                id="target_company_type"
                value={profileData.target_company_type || ''}
                onChange={(e) =>
                  setProfileData({ ...profileData, target_company_type: e.target.value || '' })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="">Select company type</option>
                <option value="Product">Product-based Company</option>
                <option value="Service">Service-based Company</option>
                <option value="Startup">Startup</option>
                <option value="MNC">Multinational Corporation (MNC)</option>
                <option value="Both">Both Product and Service</option>
              </select>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Link
                href="/dashboard/student"
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {saving ? (
                  <span className="flex items-center">
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
                    Saving...
                  </span>
                ) : (
                  'Save Profile'
                )}
              </button>
            </div>
          </form>
        </main>
      </div>
    </ProtectedRoute>
  )
}


'use client'

import { useState } from 'react'

export default function ResumeAPITestPage() {
  const [testResult, setTestResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [testType, setTestType] = useState<'health' | 'full'>('health')

  const runHealthCheck = async () => {
    setLoading(true)
    setTestResult(null)
    try {
      const response = await fetch('/api/resume/health')
      const data = await response.json()
      setTestResult({
        success: response.ok,
        status: response.status,
        data,
      })
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setLoading(false)
    }
  }

  const runFullTest = async () => {
    setLoading(true)
    setTestResult(null)
    try {
      const testResume = `John Doe
Software Engineer
Email: john@example.com
Phone: 123-456-7890

EXPERIENCE
Software Engineer at Tech Corp (2020-2024)
- Developed web applications using React and Node.js
- Led a team of 3 developers
- Improved application performance by 40%

EDUCATION
Bachelor of Science in Computer Science
University of Technology (2016-2020)

SKILLS
JavaScript, React, Node.js, Python, SQL`

      const response = await fetch('/api/resume/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: 'test-user-' + Date.now(),
          resume_text: testResume,
        }),
      })

      const data = await response.json()
      setTestResult({
        success: response.ok,
        status: response.status,
        data,
      })
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '1rem' }}>Resume API Test Page</h1>
      
      <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
        <button
          onClick={runHealthCheck}
          disabled={loading}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
          }}
        >
          {loading && testType === 'health' ? 'Testing...' : 'Health Check'}
        </button>
        
        <button
          onClick={runFullTest}
          disabled={loading}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
          }}
        >
          {loading && testType === 'full' ? 'Testing...' : 'Full API Test'}
        </button>
      </div>

      {testResult && (
        <div
          style={{
            padding: '1.5rem',
            backgroundColor: testResult.success ? '#d1fae5' : '#fee2e2',
            border: `2px solid ${testResult.success ? '#10b981' : '#ef4444'}`,
            borderRadius: '8px',
            marginTop: '1rem',
          }}
        >
          <h2 style={{ marginTop: 0, color: testResult.success ? '#065f46' : '#991b1b' }}>
            {testResult.success ? '✅ Test Passed' : '❌ Test Failed'}
          </h2>
          
          {testResult.status && (
            <p>
              <strong>Status Code:</strong> {testResult.status}
            </p>
          )}

          {testResult.error ? (
            <div>
              <strong>Error:</strong>
              <pre style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '4px', overflow: 'auto' }}>
                {JSON.stringify(testResult.error, null, 2)}
              </pre>
            </div>
          ) : (
            <div>
              <strong>Response:</strong>
              <pre style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '4px', overflow: 'auto', maxHeight: '500px' }}>
                {JSON.stringify(testResult.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
        <h3 style={{ marginTop: 0 }}>Test Instructions:</h3>
        <ul>
          <li>
            <strong>Health Check:</strong> Tests Supabase connection, Gemini API, and resume analysis function
            without creating database records
          </li>
          <li>
            <strong>Full API Test:</strong> Tests the complete POST endpoint by creating an actual resume review
            (creates a test record in database)
          </li>
        </ul>
      </div>
    </div>
  )
}


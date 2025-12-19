import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { analyzeResume } from '@/lib/resume-analyzer'

// Health check endpoint - Tests all components quickly
export async function GET(request: NextRequest) {
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      supabase: { status: 'unknown', message: '' },
      gemini: { status: 'unknown', message: '' },
      resume_analysis: { status: 'unknown', message: '' },
    },
    overall: true,
  }

  // 1. Test Supabase Connection
  try {
    const { data, error } = await supabase
      .from('resume_reviews')
      .select('id')
      .limit(1)

    if (error) {
      healthStatus.checks.supabase = {
        status: 'error',
        message: error.message || 'Database connection failed',
      }
      healthStatus.overall = false
    } else {
      healthStatus.checks.supabase = {
        status: 'ok',
        message: 'Database connection successful',
      }
    }
  } catch (error) {
    healthStatus.checks.supabase = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown database error',
    }
    healthStatus.overall = false
  }

  // 2. Test Gemini API with a minimal request
  try {
    const apiKey = 'AIzaSyDaG_tKNdzDNnXuDHbsduAp0kTxR6YSBag'
    const testResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: 'Say "OK" if you can read this.',
                },
              ],
            },
          ],
        }),
      }
    )

    if (!testResponse.ok) {
      const errorText = await testResponse.text()
      healthStatus.checks.gemini = {
        status: 'error',
        message: `API returned ${testResponse.status}: ${errorText.substring(0, 100)}`,
      }
      healthStatus.overall = false
    } else {
      const data = await testResponse.json()
      if (data.candidates && data.candidates.length > 0) {
        healthStatus.checks.gemini = {
          status: 'ok',
          message: 'Gemini API is responding correctly',
        }
      } else {
        healthStatus.checks.gemini = {
          status: 'error',
          message: 'Gemini API returned empty response',
        }
        healthStatus.overall = false
      }
    }
  } catch (error) {
    healthStatus.checks.gemini = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown Gemini API error',
    }
    healthStatus.overall = false
  }

  // 3. Test Resume Analysis Function (with minimal resume text)
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
University of Technology (2016-2020)`

    const analysis = await analyzeResume(testResume)

    if (analysis && analysis.ats_score !== undefined) {
      healthStatus.checks.resume_analysis = {
        status: 'ok',
        message: `Resume analysis working (test score: ${analysis.ats_score})`,
      }
    } else {
      healthStatus.checks.resume_analysis = {
        status: 'error',
        message: 'Resume analysis returned invalid response',
      }
      healthStatus.overall = false
    }
  } catch (error) {
    healthStatus.checks.resume_analysis = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Resume analysis failed',
    }
    healthStatus.overall = false
  }

  // Update overall status
  if (!healthStatus.overall) {
    healthStatus.status = 'unhealthy'
  }

  return NextResponse.json(healthStatus, {
    status: healthStatus.overall ? 200 : 503,
  })
}


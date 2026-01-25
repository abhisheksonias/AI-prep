import { NextRequest, NextResponse } from 'next/server'
import { analyzeResumeAndGenerateFeedback } from '@/ai/flows/analyze-resume-and-generate-feedback'
import { supabase } from '@/lib/supabaseClient'

// POST - Analyze resume and save to database
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, resume_text, career_goal, jobDescription } = body

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      )
    }

    // Prefer provided resume_text, otherwise fetch from user profile
    let resumeText = typeof resume_text === 'string' ? resume_text.trim() : ''

    if (!resumeText) {
      const { data: userProfile, error: userError } = await supabase
        .from('users')
        .select('resume_text, resume_url')
        .eq('id', user_id)
        .single()

      if (userError) {
        console.error('Error fetching user resume:', userError)
        return NextResponse.json(
          { error: 'Failed to fetch user resume', details: userError.message },
          { status: 500 }
        )
      }

      resumeText = (userProfile?.resume_text || '').trim()
    }

    if (!resumeText) {
      return NextResponse.json(
        { error: 'Resume not found. Please add your resume to your profile first.' },
        { status: 400 }
      )
    }

    if (resumeText.length < 100) {
      return NextResponse.json(
        { error: 'Resume text must be at least 100 characters long' },
        { status: 400 }
      )
    }

    // Use provided job description or default message
    const jobDesc = typeof jobDescription === 'string' 
      ? jobDescription.trim() 
      : 'General software development role'

    // Analyze resume using Genkit
    let analysis
    try {
      analysis = await analyzeResumeAndGenerateFeedback({
        resumeText,
        jobDescription: jobDesc
      })
    } catch (error) {
      console.error('Error analyzing resume:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return NextResponse.json(
        { 
          error: 'Failed to analyze resume. Please try again.',
          details: errorMessage 
        },
        { status: 500 }
      )
    }

    // Do not save to DB for now; map analysis to UI structure and return
    const keywordsMatch = analysis.metrics?.totalKeywordsInJobDescription
      ? Math.round(
          (analysis.metrics.keywordsInResume /
            Math.max(analysis.metrics.totalKeywordsInJobDescription, 1)) * 100
        )
      : Math.min(Math.max(analysis.matchScore, 0), 100)

    const overallRating = (() => {
      const s = analysis.matchScore
      if (s >= 85) return 'Excellent'
      if (s >= 70) return 'Good'
      if (s >= 50) return 'Fair'
      return 'Needs Improvement'
    })()

    const improvements = (analysis.keyImprovements || []).map((it) => ({
      category: it.title || 'Improvement',
      suggestion: it.suggestion || '',
      priority: analysis.matchScore < 50 ? 'High' : analysis.matchScore < 70 ? 'Medium' : 'Low',
    }))

    const weaknesses = (() => {
      const text = (analysis.missingSkills || '').trim()
      if (!text) return [] as string[]
      // Split by newline or comma for simple bullets
      const parts = text.split(/\n+|,\s*/).map((p) => p.trim()).filter(Boolean)
      return parts.slice(0, 10)
    })()

    const mapped = {
      id: 'temp-' + Date.now(),
      resume_text: resumeText,
      ats_score: analysis.matchScore,
      overall_rating: overallRating,
      strengths: (analysis.matchedKeywords || []).slice(0, 10),
      weaknesses,
      key_improvements: improvements,
      ats_analysis: {
        keywords_match: keywordsMatch,
        formatting_score: 70, // placeholder until formatting analysis exists
        content_quality: Math.max(60, Math.min(95, Math.round(analysis.matchScore))),
      },
      confidence_boost: analysis.feedback || 'Keep refining your resume for better alignment.',
      created_at: new Date().toISOString(),
    }

    return NextResponse.json({
      success: true,
      analysis: mapped,
      message: 'Resume analyzed successfully',
    })

  } catch (error) {
    console.error('Error in POST resume analyze:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}

// GET - Fetch latest analysis for user
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('user_id')

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('resume_reviews')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) {
      console.error('Error fetching analysis:', error)
      return NextResponse.json(
        { error: 'Failed to fetch analysis', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      analysis: data && data.length > 0 ? data[0] : null,
    })
  } catch (error) {
    console.error('Error in GET analysis:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}


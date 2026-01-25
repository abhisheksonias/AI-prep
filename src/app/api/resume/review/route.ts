import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { analyzeResumeAndGenerateFeedback } from '@/ai/flows/analyze-resume-and-generate-feedback'

// POST /api/resume/review - analyze and save a review
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, resume_text, jobDescription } = body || {}

    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 })
    }
    const trimmed = (resume_text || '').trim()
    if (!trimmed || trimmed.length < 100) {
      return NextResponse.json(
        { error: 'resume_text must be at least 100 characters' },
        { status: 400 }
      )
    }

    // Verify user exists to avoid foreign key violation
    const { data: userRow, error: userErr } = await supabase
      .from('users')
      .select('id')
      .eq('id', user_id)
      .single()
    if (userErr || !userRow) {
      return NextResponse.json(
        { error: 'User not found', details: userErr?.message },
        { status: 404 }
      )
    }

    // Re-analyze before saving (or use provided jobDescription if present)
    const jobDesc = typeof jobDescription === 'string' && jobDescription.trim()
      ? jobDescription.trim()
      : 'General software development role'

    let analysis
    try {
      analysis = await analyzeResumeAndGenerateFeedback({
        resumeText: trimmed,
        jobDescription: jobDesc,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      return NextResponse.json(
        { error: 'Failed to analyze resume', details: msg },
        { status: 500 }
      )
    }

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
      const parts = text.split(/\n+|,\s*/).map((p) => p.trim()).filter(Boolean)
      return parts.slice(0, 10)
    })()

    // Build analysis JSONB structure per schema
    const analysisJson = {
      strengths: (analysis.matchedKeywords || []).slice(0, 10),
      weaknesses,
      key_improvements: improvements,
      ats_analysis: {
        keywords_match: keywordsMatch,
        formatting_score: 70,
        content_quality: Math.max(60, Math.min(95, Math.round(analysis.matchScore))),
      },
      confidence_boost: analysis.feedback || 'Keep refining your resume for better alignment.',
    }

    const { data: inserted, error: dbErr } = await supabase
      .from('resume_reviews')
      .insert({
        user_id,
        resume_text: trimmed,
        ats_score: analysis.matchScore,
        overall_rating: overallRating,
        analysis: analysisJson,
      })
      .select()

    if (dbErr) {
      return NextResponse.json(
        { error: 'Failed to save review', details: dbErr.message },
        { status: 500 }
      )
    }

    const review = Array.isArray(inserted) ? inserted[0] : inserted
    return NextResponse.json({ success: true, review })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Internal server error', details: msg },
      { status: 500 }
    )
  }
}

// GET /api/resume/review?user_id=... - list reviews for a user
export async function GET(request: NextRequest) {
  try {
    const scope = request.nextUrl.searchParams.get('scope')
    const userId = request.nextUrl.searchParams.get('user_id')

    if (scope === 'all') {
      const { data, error } = await supabase
        .from('resume_reviews')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        return NextResponse.json(
          { error: 'Failed to fetch reviews', details: error.message },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, reviews: data || [] })
    }

    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('resume_reviews')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch reviews', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, reviews: data || [] })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Internal server error', details: msg },
      { status: 500 }
    )
  }
}


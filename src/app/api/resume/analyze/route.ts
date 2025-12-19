import { NextRequest, NextResponse } from 'next/server'
import { analyzeResume } from '@/lib/resume-analyzer'

// POST - Analyze resume without saving to database
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { resume_text } = body

    if (!resume_text) {
      return NextResponse.json(
        { error: 'resume_text is required' },
        { status: 400 }
      )
    }

    if (resume_text.trim().length < 100) {
      return NextResponse.json(
        { error: 'Resume text must be at least 100 characters long' },
        { status: 400 }
      )
    }

    // Analyze resume using Gemini (without saving)
    let analysis
    try {
      analysis = await analyzeResume(resume_text)
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

    // Return analysis without saving to database
    return NextResponse.json({
      success: true,
      analysis: {
        ats_score: analysis.ats_score,
        overall_rating: analysis.overall_rating,
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
        key_improvements: analysis.key_improvements,
        ats_analysis: analysis.ats_analysis,
        confidence_boost: analysis.confidence_boost,
      },
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


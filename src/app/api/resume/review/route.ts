import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { analyzeResume } from '@/lib/resume-analyzer'

// POST - Create new resume review
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, resume_text } = body

    if (!user_id || !resume_text) {
      return NextResponse.json(
        { error: 'user_id and resume_text are required' },
        { status: 400 }
      )
    }

    if (resume_text.trim().length < 100) {
      return NextResponse.json(
        { error: 'Resume text must be at least 100 characters long' },
        { status: 400 }
      )
    }

    // Analyze resume using Gemini
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

    // Verify user exists before saving
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', user_id)
      .single()

    if (userError || !userData) {
      console.error('User verification error:', userError)
      return NextResponse.json(
        { 
          error: 'User not found. Please make sure you are logged in with a valid account.',
          details: userError?.message || 'User does not exist in database',
          code: userError?.code
        },
        { status: 404 }
      )
    }

    // Store review in database
    try {
      const { data, error } = await supabase
        .from('resume_reviews')
        .insert([
          {
            user_id,
            resume_text: resume_text.trim(),
            ats_score: analysis.ats_score,
            overall_rating: analysis.overall_rating,
            analysis: {
              strengths: analysis.strengths,
              weaknesses: analysis.weaknesses,
              key_improvements: analysis.key_improvements,
              ats_analysis: analysis.ats_analysis,
              confidence_boost: analysis.confidence_boost,
            },
          },
        ])
        .select()
        .single()

      if (error) {
        console.error('Error saving review:', error)
        // Check if table doesn't exist
        if (error.code === '42P01' || error.message.includes('does not exist')) {
          return NextResponse.json(
            { 
              error: 'Database table not found. Please run the SQL schema from resume_review_schema.sql in Supabase.',
              details: error.message 
            },
            { status: 500 }
          )
        }
        // Check for foreign key constraint violation
        if (error.code === '23503' || error.message.includes('foreign key constraint')) {
          return NextResponse.json(
            { 
              error: 'User not found in database. Please log out and log in again.',
              details: error.message,
              code: error.code,
              hint: 'The user_id does not exist in the users table. This might happen if the user account was deleted or the ID is incorrect.'
            },
            { status: 400 }
          )
        }
        return NextResponse.json(
          { error: 'Failed to save review', details: error.message, code: error.code },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        review: data,
        message: 'Resume reviewed successfully',
      })
    } catch (dbError) {
      console.error('Database error:', dbError)
      const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown database error'
      return NextResponse.json(
        { error: 'Database error', details: errorMessage },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error in POST resume review:', error)
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

// GET - Fetch resume review history
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
      .limit(20)

    if (error) {
      console.error('Error fetching reviews:', error)
      return NextResponse.json(
        { error: 'Failed to fetch reviews' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      reviews: data || [],
    })
  } catch (error) {
    console.error('Error in GET resume reviews:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


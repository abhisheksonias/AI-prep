import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { buildInterviewContext } from '@/lib/gemini-enhanced'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { student_id } = body

    if (!student_id) {
      return NextResponse.json(
        { error: 'student_id is required' },
        { status: 400 }
      )
    }

    // Fetch student profile
    const { data: student, error: studentError } = await supabase
      .from('users')
      .select('resume_text, skills, career_goal, interests, target_company_type')
      .eq('id', student_id)
      .single()

    if (studentError || !student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    // Fetch performance metrics
    const { data: metrics, error: metricsError } = await supabase
      .from('user_performance_metrics')
      .select('topic, avg_score, total_attempts')
      .eq('student_id', student_id)
      .order('last_updated', { ascending: false })

    if (metricsError) {
      console.error('Error fetching metrics:', metricsError)
    }

    // Build AI context
    const context = await buildInterviewContext(
      {
        resume_text: student.resume_text,
        skills: student.skills,
        career_goal: student.career_goal,
        interests: student.interests,
        target_company_type: student.target_company_type,
      },
      metrics || []
    )

    // Get or create active session
    const { data: activeSession, error: sessionError } = await supabase
      .from('mock_interview_sessions')
      .select('*')
      .eq('student_id', student_id)
      .is('ended_at', null)
      .order('started_at', { ascending: false })
      .limit(1)
      .single()

    let sessionId: string

    if (sessionError && sessionError.code !== 'PGRST116') {
      // Create new session
      const { data: newSession, error: createError } = await supabase
        .from('mock_interview_sessions')
        .insert([
          {
            student_id,
            started_at: new Date().toISOString(),
            ai_context: { context, profile: student },
          },
        ])
        .select()
        .single()

      if (createError) {
        return NextResponse.json(
          { error: 'Failed to create session' },
          { status: 500 }
        )
      }

      sessionId = newSession.id
    } else if (activeSession) {
      // Update existing session with context
      const { error: updateError } = await supabase
        .from('mock_interview_sessions')
        .update({
          ai_context: { context, profile: student },
        })
        .eq('id', activeSession.id)

      if (updateError) {
        console.error('Error updating session:', updateError)
      }

      sessionId = activeSession.id
    } else {
      // Create new session
      const { data: newSession, error: createError } = await supabase
        .from('mock_interview_sessions')
        .insert([
          {
            student_id,
            started_at: new Date().toISOString(),
            ai_context: { context, profile: student },
          },
        ])
        .select()
        .single()

      if (createError) {
        return NextResponse.json(
          { error: 'Failed to create session' },
          { status: 500 }
        )
      }

      sessionId = newSession.id
    }

    return NextResponse.json({
      session_id: sessionId,
      context,
      profile: student,
      performance_metrics: metrics || [],
    })
  } catch (error) {
    console.error('Context building error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}


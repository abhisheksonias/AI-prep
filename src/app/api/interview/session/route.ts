import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

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

    // Check if there's an active session (not ended)
    const { data: activeSession, error: sessionError } = await supabase
      .from('mock_interview_sessions')
      .select('*')
      .eq('student_id', student_id)
      .is('ended_at', null)
      .order('started_at', { ascending: false })
      .limit(1)
      .single()

    if (sessionError && sessionError.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is fine
      console.error('Error checking active session:', sessionError)
      return NextResponse.json(
        { error: 'Failed to check active session' },
        { status: 500 }
      )
    }

    // If active session exists, return it
    if (activeSession) {
      return NextResponse.json({
        session_id: activeSession.id,
        started_at: activeSession.started_at,
        total_score: activeSession.total_score,
      })
    }

    // Create new session
    const { data: newSession, error: createError } = await supabase
      .from('mock_interview_sessions')
      .insert([
        {
          student_id,
          started_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (createError) {
      console.error('Error creating session:', createError)
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      session_id: newSession.id,
      started_at: newSession.started_at,
      total_score: newSession.total_score,
    })
  } catch (error) {
    console.error('Session creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const student_id = searchParams.get('student_id')

    if (!student_id) {
      return NextResponse.json(
        { error: 'student_id is required' },
        { status: 400 }
      )
    }

    // Get active session
    const { data: session, error } = await supabase
      .from('mock_interview_sessions')
      .select('*')
      .eq('student_id', student_id)
      .is('ended_at', null)
      .order('started_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching session:', error)
      return NextResponse.json(
        { error: 'Failed to fetch session' },
        { status: 500 }
      )
    }

    if (!session) {
      return NextResponse.json({ session: null })
    }

    return NextResponse.json({
      session_id: session.id,
      started_at: session.started_at,
      total_score: session.total_score,
    })
  } catch (error) {
    console.error('Session fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


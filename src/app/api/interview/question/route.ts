import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const role_type = searchParams.get('role_type')
    const topic = searchParams.get('topic')
    const difficulty = searchParams.get('difficulty')

    // Build query
    let query = supabase
      .from('interview_questions')
      .select('*')
      .eq('is_active', true)

    if (role_type) {
      query = query.eq('role_type', role_type)
    }

    if (topic) {
      query = query.eq('topic', topic)
    }

    if (difficulty) {
      query = query.eq('difficulty', difficulty)
    }

    // Get random question
    const { data: questions, error } = await query

    if (error) {
      console.error('Error fetching questions:', error)
      return NextResponse.json(
        { error: 'Failed to fetch questions' },
        { status: 500 }
      )
    }

    if (!questions || questions.length === 0) {
      return NextResponse.json(
        { error: 'No questions found with the specified criteria' },
        { status: 404 }
      )
    }

    // Return a random question
    const randomQuestion = questions[Math.floor(Math.random() * questions.length)]

    return NextResponse.json({
      question_id: randomQuestion.id,
      question_text: randomQuestion.question_text,
      role_type: randomQuestion.role_type,
      topic: randomQuestion.topic,
      difficulty: randomQuestion.difficulty,
    })
  } catch (error) {
    console.error('Question fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


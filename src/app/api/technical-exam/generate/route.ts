import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Server-side Supabase client (service role if available)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseServer = supabaseServiceKey && supabaseUrl
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : supabase

/**
 * GET /api/technical-exam/generate?studentId=...&topic=frontend|backend
 * Returns 15 randomized technical MCQs from DB (5 easy, 7 medium, 3 hard)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const topic = searchParams.get('topic') || undefined // optional filter

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 })
    }

    // Verify student exists
    const { data: student, error: studentError } = await supabaseServer
      .from('users')
      .select('id, role')
      .eq('id', studentId)
      .eq('role', 'STUDENT')
      .single()

    if (studentError || !student) {
      return NextResponse.json({ error: 'Invalid student ID' }, { status: 404 })
    }

    // Helper to fetch questions by difficulty (and optional topic)
    const fetchByDifficulty = async (difficulty: 'easy' | 'medium' | 'hard', limit: number) => {
      let query = supabaseServer
        .from('technical_questions')
        .select('*')
        .eq('difficulty', difficulty)
        .eq('is_active', true)

      // Apply topic filter if specified
      if (topic) {
        query = query.eq('topic', topic)
      }

      const { data, error } = await query.limit(100)
      if (error) throw error
      
      console.log(`Fetched ${(data || []).length} questions for difficulty=${difficulty}, topic=${topic || 'all'}`)
      
      const shuffled = (data || []).sort(() => 0.5 - Math.random())
      return shuffled.slice(0, limit)
    }

    // Distribution similar to aptitude: 5 easy, 7 medium, 3 hard
    const [easy, medium, hard] = await Promise.all([
      fetchByDifficulty('easy', 5),
      fetchByDifficulty('medium', 7),
      fetchByDifficulty('hard', 3),
    ])

    const allQuestions = [...easy, ...medium, ...hard]

    console.log(`Total questions collected: ${allQuestions.length} (easy: ${easy.length}, medium: ${medium.length}, hard: ${hard.length})`)

    if (allQuestions.length < 15) {
      return NextResponse.json(
        { 
          error: `Not enough technical questions available. Required: 5 easy + 7 medium + 3 hard. Got: ${easy.length} easy + ${medium.length} medium + ${hard.length} hard ${topic ? `for topic: ${topic}` : 'across all topics'}`,
          details: { easy: easy.length, medium: medium.length, hard: hard.length }
        },
        { status: 500 }
      )
    }

    const shuffled = allQuestions.sort(() => 0.5 - Math.random())

    const questionsForClient = shuffled.map((q, idx) => ({
      id: idx + 1,
      questionId: q.id,
      question: q.question_text,
      topic: q.topic,
      difficulty: q.difficulty,
      options: [q.option_a, q.option_b, q.option_c, q.option_d],
    }))

    const answersHash = Buffer.from(
      JSON.stringify(
        shuffled.map((q, idx) => ({ id: idx + 1, correctAnswer: q.correct_answer }))
      )
    ).toString('base64')

    return NextResponse.json({
      success: true,
      questions: questionsForClient,
      totalQuestions: questionsForClient.length,
      summary: `Generated ${questionsForClient.length} technical questions` ,
      answersHash,
    })
  } catch (error) {
    console.error('Error generating technical exam:', error)
    return NextResponse.json(
      { error: 'Failed to generate technical exam', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

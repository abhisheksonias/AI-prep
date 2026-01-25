import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseServer = supabaseServiceKey && supabaseUrl
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : supabase

/**
 * POST /api/technical-exam/submit
 * Evaluates answers and stores result
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studentId, answers, answersHash, timeTakenSeconds, tabSwitches, violations } = body

    if (!studentId || !answers || !answersHash) {
      return NextResponse.json(
        { error: 'Student ID, answers, and answers hash are required' },
        { status: 400 }
      )
    }

    const { data: student, error: studentError } = await supabaseServer
      .from('users')
      .select('id, role')
      .eq('id', studentId)
      .single()

    if (studentError || !student || student.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Invalid student ID' }, { status: 404 })
    }

    let correctAnswers: { id: number; correctAnswer: number }[]
    try {
      correctAnswers = JSON.parse(Buffer.from(answersHash, 'base64').toString('utf-8'))
    } catch (error) {
      return NextResponse.json({ error: 'Invalid answers hash' }, { status: 400 })
    }

    let correctCount = 0
    let incorrectCount = 0

    for (const answer of answers as { questionId: number; selectedAnswer: number }[]) {
      const correct = correctAnswers.find(c => c.id === answer.questionId)
      if (!correct) continue
      if (answer.selectedAnswer === correct.correctAnswer) correctCount++
      else incorrectCount++
    }

    const totalQuestions = correctAnswers.length
    const scorePercentage = ((correctCount / totalQuestions) * 100).toFixed(2)

    const { data: testResult, error: insertError } = await supabaseServer
      .from('technical_test_results')
      .insert({
        student_id: studentId,
        total_questions: totalQuestions,
        correct_answers: correctCount,
        incorrect_answers: incorrectCount,
        score_percentage: parseFloat(scorePercentage),
        time_taken_seconds: timeTakenSeconds || null,
        tab_switches: tabSwitches || 0,
        violations: violations || 0,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error storing technical result:', insertError)
      return NextResponse.json({ error: 'Failed to store test result' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      result: {
        id: testResult.id,
        totalQuestions,
        correctAnswers: correctCount,
        incorrectAnswers: incorrectCount,
        scorePercentage: parseFloat(scorePercentage),
        timeTaken: timeTakenSeconds,
        testDate: testResult.test_date,
      },
      message: `Test completed! You scored ${scorePercentage}%`,
    })
  } catch (error) {
    console.error('Error submitting technical exam:', error)
    return NextResponse.json(
      { error: 'Failed to submit technical exam', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/technical-exam/submit?studentId=...&limit=10
 * Returns history and stats for the student
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 })
    }

    const { data: history, error } = await supabaseServer
      .from('technical_test_results')
      .select('*')
      .eq('student_id', studentId)
      .order('test_date', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching technical history:', error)
      return NextResponse.json({ error: 'Failed to fetch test history' }, { status: 500 })
    }

    const stats = history.length > 0 ? {
      totalTests: history.length,
      averageScore: (history.reduce((sum, t) => sum + parseFloat(t.score_percentage.toString()), 0) / history.length).toFixed(2),
      bestScore: Math.max(...history.map(t => parseFloat(t.score_percentage.toString()))).toFixed(2),
      latestScore: parseFloat(history[0].score_percentage.toString()).toFixed(2),
      improvementTrend: history.length >= 2
        ? parseFloat(history[0].score_percentage.toString()) - parseFloat(history[1].score_percentage.toString())
        : 0,
    } : null

    return NextResponse.json({ success: true, history, stats })
  } catch (error) {
    console.error('Error in GET technical history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch technical history', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

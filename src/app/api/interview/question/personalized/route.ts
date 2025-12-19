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

    // Fetch student profile
    const { data: student, error: studentError } = await supabase
      .from('users')
      .select('skills, career_goal, interests, target_company_type')
      .eq('id', student_id)
      .single()

    if (studentError || !student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    // Fetch performance metrics to identify weak areas
    const { data: metrics, error: metricsError } = await supabase
      .from('user_performance_metrics')
      .select('topic, avg_score, total_attempts')
      .eq('student_id', student_id)
      .order('avg_score', { ascending: true }) // Start with weakest topics
      .limit(5)

    if (metricsError) {
      console.error('Error fetching metrics:', metricsError)
    }

    // Build query based on profile and performance
    let query = supabase
      .from('interview_questions')
      .select('*')
      .eq('is_active', true)

    // Prioritize topics from student's skills/interests
    const preferredTopics: string[] = []
    if (student.skills && student.skills.length > 0) {
      preferredTopics.push(...student.skills)
    }
    if (student.interests && student.interests.length > 0) {
      preferredTopics.push(...student.interests)
    }

    // If we have weak performance areas, prioritize those
    const weakTopics = metrics?.filter((m) => (m.avg_score || 0) < 6).map((m) => m.topic) || []
    
    // Get all questions first
    const { data: allQuestions, error: questionsError } = await query

    if (questionsError || !allQuestions || allQuestions.length === 0) {
      return NextResponse.json(
        { error: 'No questions found' },
        { status: 404 }
      )
    }

    // Score and prioritize questions
    const scoredQuestions = allQuestions.map((q) => {
      let score = 0

      // Boost score for topics in student's skills/interests
      if (preferredTopics.some((topic) => q.topic.toLowerCase().includes(topic.toLowerCase()))) {
        score += 3
      }

      // Boost score for weak performance areas (need more practice)
      if (weakTopics.includes(q.topic)) {
        score += 5
      }

      // Boost score for topics matching career goal
      if (student.career_goal && q.topic.toLowerCase().includes(student.career_goal.toLowerCase())) {
        score += 2
      }

      // Slight preference for medium difficulty (good learning curve)
      if (q.difficulty === 'Medium') {
        score += 1
      }

      return { ...q, priority_score: score }
    })

    // Sort by priority score and get a random question from top 5
    scoredQuestions.sort((a, b) => b.priority_score - a.priority_score)
    const topQuestions = scoredQuestions.slice(0, Math.min(5, scoredQuestions.length))
    const randomQuestion = topQuestions[Math.floor(Math.random() * topQuestions.length)]

    return NextResponse.json({
      question_id: randomQuestion.id,
      question_text: randomQuestion.question_text,
      role_type: randomQuestion.role_type,
      topic: randomQuestion.topic,
      difficulty: randomQuestion.difficulty,
      priority_reason: weakTopics.includes(randomQuestion.topic)
        ? 'Selected based on areas needing improvement'
        : preferredTopics.some((t) => randomQuestion.topic.toLowerCase().includes(t.toLowerCase()))
        ? 'Selected based on your skills/interests'
        : 'Selected for balanced practice',
    })
  } catch (error) {
    console.error('Personalized question error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


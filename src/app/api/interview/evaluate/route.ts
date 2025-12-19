import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { evaluateAnswerWithProfile } from '@/lib/gemini-enhanced'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      student_id, 
      student_answer, 
      transcribed_answer,  // Voice transcription
      audio_url,            // Audio file URL
      question_id, 
      role_type, 
      topic, 
      difficulty 
    } = body

    // Validate required fields
    if (!student_id || (!student_answer && !transcribed_answer) || !question_id) {
      return NextResponse.json(
        { error: 'student_id, student_answer (or transcribed_answer), and question_id are required' },
        { status: 400 }
      )
    }

    // Use transcribed_answer if available, otherwise use student_answer
    const answerText = transcribed_answer || student_answer

    // Get or create active session
    let sessionId: string

    const { data: activeSession, error: sessionError } = await supabase
      .from('mock_interview_sessions')
      .select('*')
      .eq('student_id', student_id)
      .is('ended_at', null)
      .order('started_at', { ascending: false })
      .limit(1)
      .single()

    if (sessionError && sessionError.code !== 'PGRST116') {
      console.error('Error checking session:', sessionError)
      return NextResponse.json(
        { error: 'Failed to check session' },
        { status: 500 }
      )
    }

    if (activeSession) {
      sessionId = activeSession.id
    } else {
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

      sessionId = newSession.id
    }

    // Fetch the question details
    const { data: question, error: questionError } = await supabase
      .from('interview_questions')
      .select('*')
      .eq('id', question_id)
      .eq('is_active', true)
      .single()

    if (questionError || !question) {
      return NextResponse.json(
        { error: 'Question not found or inactive' },
        { status: 404 }
      )
    }

    // Fetch student profile for personalized evaluation
    const { data: student, error: studentError } = await supabase
      .from('users')
      .select('resume_text, skills, career_goal, interests, target_company_type')
      .eq('id', student_id)
      .single()

    if (studentError) {
      console.error('Error fetching student profile:', studentError)
    }

    // Fetch performance metrics
    const { data: metrics, error: metricsError } = await supabase
      .from('user_performance_metrics')
      .select('topic, avg_score, total_attempts')
      .eq('student_id', student_id)

    if (metricsError) {
      console.error('Error fetching metrics:', metricsError)
    }

    // Evaluate answer with Gemini (using profile context)
    let evaluation
    try {
      evaluation = await evaluateAnswerWithProfile(
        question.question_text,
        answerText,
        role_type || question.role_type,
        topic || question.topic,
        difficulty || question.difficulty,
        student || {
          resume_text: null,
          skills: null,
          career_goal: null,
          interests: null,
          target_company_type: null,
        },
        metrics || []
      )
    } catch (geminiError) {
      console.error('Gemini evaluation error:', geminiError)
      return NextResponse.json(
        { error: 'Failed to evaluate answer with AI', details: geminiError instanceof Error ? geminiError.message : 'Unknown error' },
        { status: 500 }
      )
    }

    // Store the response in interview_responses
    const { data: response, error: responseError } = await supabase
      .from('interview_responses')
      .insert([
        {
          session_id: sessionId,
          question_id: question_id,
          student_answer: answerText,
          transcribed_answer: transcribed_answer || null,
          audio_url: audio_url || null,
          ai_score: evaluation.score,
          ai_feedback: evaluation.feedback,
          ideal_answer: evaluation.ideal_answer,
        },
      ])
      .select()
      .single()

    if (responseError) {
      console.error('Error saving response:', responseError)
      return NextResponse.json(
        { error: 'Failed to save response' },
        { status: 500 }
      )
    }

    // Calculate and update session total_score
    const { data: allResponses, error: responsesError } = await supabase
      .from('interview_responses')
      .select('ai_score')
      .eq('session_id', sessionId)

    if (responsesError) {
      console.error('Error fetching responses:', responsesError)
    } else {
      const scores = allResponses.map((r) => Number(r.ai_score) || 0)
      const averageScore = scores.length > 0
        ? scores.reduce((sum, score) => sum + score, 0) / scores.length
        : 0

      const { error: updateError } = await supabase
        .from('mock_interview_sessions')
        .update({ total_score: averageScore.toFixed(2) })
        .eq('id', sessionId)

      if (updateError) {
        console.error('Error updating session score:', updateError)
      }
    }

    // Update performance metrics for this topic
    const questionTopic = topic || question.topic
    const { data: existingMetric, error: metricFetchError } = await supabase
      .from('user_performance_metrics')
      .select('*')
      .eq('student_id', student_id)
      .eq('topic', questionTopic)
      .single()

    if (metricFetchError && metricFetchError.code !== 'PGRST116') {
      console.error('Error fetching metric:', metricFetchError)
    }

    if (existingMetric) {
      // Update existing metric
      const totalAttempts = existingMetric.total_attempts + 1
      const currentAvg = Number(existingMetric.avg_score) || 0
      const newAvg = ((currentAvg * (totalAttempts - 1)) + evaluation.score) / totalAttempts

      const { error: updateMetricError } = await supabase
        .from('user_performance_metrics')
        .update({
          avg_score: newAvg.toFixed(2),
          total_attempts: totalAttempts,
          last_updated: new Date().toISOString(),
        })
        .eq('id', existingMetric.id)

      if (updateMetricError) {
        console.error('Error updating metric:', updateMetricError)
      }
    } else {
      // Create new metric
      const { error: createMetricError } = await supabase
        .from('user_performance_metrics')
        .insert([
          {
            student_id,
            topic: questionTopic,
            avg_score: evaluation.score.toFixed(2),
            total_attempts: 1,
          },
        ])

      if (createMetricError) {
        console.error('Error creating metric:', createMetricError)
      }
    }

    // Return structured feedback
    return NextResponse.json({
      success: true,
      response_id: response.id,
      evaluation: {
        score: evaluation.score,
        technical_accuracy: evaluation.technical_accuracy,
        communication_clarity: evaluation.communication_clarity,
        interview_readiness: evaluation.interview_readiness,
        strengths: evaluation.strengths,
        weaknesses: evaluation.weaknesses,
        ideal_answer: evaluation.ideal_answer,
        feedback: evaluation.feedback,
      },
      session_id: sessionId,
    })
  } catch (error) {
    console.error('Evaluation error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}


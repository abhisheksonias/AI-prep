import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Server-side Supabase client using service role key to bypass RLS for trusted operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseServer = supabaseServiceKey && supabaseUrl
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : supabase;

/**
 * POST /api/aptitude/submit
 * Submit and evaluate aptitude test results
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      studentId, 
      answers, // Array of user answers { questionId: number, selectedAnswer: number }
      answersHash, // Hash containing correct answers
      timeTakenSeconds,
      tabSwitches,
      violations
    } = body;

    // Validate input
    if (!studentId || !answers || !answersHash) {
      return NextResponse.json(
        { error: 'Student ID, answers, and answers hash are required' },
        { status: 400 }
      );
    }

    // Verify student exists
    const { data: student, error: studentError } = await supabaseServer
      .from('users')
      .select('id, role')
      .eq('id', studentId)
      .single();

    if (studentError || !student || student.role !== 'STUDENT') {
      return NextResponse.json(
        { error: 'Invalid student ID' },
        { status: 404 }
      );
    }

    // Decode correct answers from hash
    let correctAnswers: { id: number; correctAnswer: number }[];
    try {
      correctAnswers = JSON.parse(
        Buffer.from(answersHash, 'base64').toString('utf-8')
      );
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid answers hash' },
        { status: 400 }
      );
    }

    // Evaluate answers
    let correctCount = 0;
    let incorrectCount = 0;
    const evaluation = [];

    for (const answer of answers) {
      const correctAnswer = correctAnswers.find(ca => ca.id === answer.questionId);
      if (!correctAnswer) continue;

      const isCorrect = answer.selectedAnswer === correctAnswer.correctAnswer;
      if (isCorrect) {
        correctCount++;
      } else {
        incorrectCount++;
      }

      evaluation.push({
        questionId: answer.questionId,
        isCorrect,
        userAnswer: answer.selectedAnswer,
        correctAnswer: correctAnswer.correctAnswer,
      });
    }

    const totalQuestions = correctAnswers.length;
    const scorePercentage = ((correctCount / totalQuestions) * 100).toFixed(2);

    // Store result in database
    const { data: testResult, error: insertError } = await supabaseServer
      .from('aptitude_test_results')
      .insert({
        student_id: studentId,
        total_questions: totalQuestions,
        correct_answers: correctCount,
        incorrect_answers: incorrectCount,
        score_percentage: parseFloat(scorePercentage),
        time_taken_seconds: timeTakenSeconds || null,
        resume_analyzed: false,
        tab_switches: tabSwitches || 0,
        violations: violations || 0,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error storing test result:', insertError);
      return NextResponse.json(
        { error: 'Failed to store test result' },
        { status: 500 }
      );
    }

    // Return result (without detailed evaluation for security)
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
    });

  } catch (error) {
    console.error('Error submitting aptitude test:', error);
    return NextResponse.json(
      { 
        error: 'Failed to submit aptitude test',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/aptitude/submit?studentId=xxx
 * Get student's aptitude test history
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const limit = searchParams.get('limit') || '10';

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    // Fetch test history
    const { data: testHistory, error } = await supabaseServer
      .from('aptitude_test_results')
      .select('*')
      .eq('student_id', studentId)
      .order('test_date', { ascending: false })
      .limit(parseInt(limit));

    if (error) {
      console.error('Error fetching test history:', error);
      return NextResponse.json(
        { error: 'Failed to fetch test history' },
        { status: 500 }
      );
    }

    // Calculate statistics
    const stats = testHistory.length > 0 ? {
      totalTests: testHistory.length,
      averageScore: (testHistory.reduce((sum, test) => sum + parseFloat(test.score_percentage.toString()), 0) / testHistory.length).toFixed(2),
      bestScore: Math.max(...testHistory.map(test => parseFloat(test.score_percentage.toString()))).toFixed(2),
      latestScore: testHistory[0] ? parseFloat(testHistory[0].score_percentage.toString()).toFixed(2) : 0,
      improvementTrend: testHistory.length >= 2 
        ? parseFloat(testHistory[0].score_percentage.toString()) - parseFloat(testHistory[1].score_percentage.toString())
        : 0,
    } : null;

    return NextResponse.json({
      success: true,
      history: testHistory,
      stats,
    });

  } catch (error) {
    console.error('Error in GET test history:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch test history',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

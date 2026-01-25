import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/aptitude/generate?studentId=xxx
 * Get 15 random questions from database
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    // Verify student exists
    const { data: student, error: studentError } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', studentId)
      .eq('role', 'STUDENT')
      .single();

    if (studentError || !student) {
      return NextResponse.json(
        { error: 'Invalid student ID' },
        { status: 404 }
      );
    }

    // Fetch 5 questions of each type randomly
    const questionTypes = ['quantitative', 'logical', 'verbal'];
    const allQuestions = [];

    for (const type of questionTypes) {
      const { data: questions, error: questionsError } = await supabase
        .from('aptitude_questions')
        .select('*')
        .eq('question_type', type)
        .eq('is_active', true)
        .limit(100); // Get more to randomize from

      if (questionsError) {
        console.error(`Error fetching ${type} questions:`, questionsError);
        continue;
      }

      // Randomly select 5 questions of this type
      const shuffled = questions?.sort(() => 0.5 - Math.random()) || [];
      const selected = shuffled.slice(0, 5);
      allQuestions.push(...selected);
    }

    if (allQuestions.length < 15) {
      return NextResponse.json(
        { error: 'Not enough questions available in database. Please add more questions.' },
        { status: 500 }
      );
    }

    // Shuffle all questions
    const shuffledQuestions = allQuestions.sort(() => 0.5 - Math.random());

    // Prepare questions for client (without correct answers)
    const questionsForClient = shuffledQuestions.map((q, index) => ({
      id: index + 1,
      questionId: q.id,
      question: q.question_text,
      type: q.question_type,
      options: [q.option_a, q.option_b, q.option_c, q.option_d],
      difficulty: q.difficulty,
    }));

    // Store correct answers hash
    const answersData = shuffledQuestions.map((q, index) => ({
      id: index + 1,
      correctAnswer: q.correct_answer,
    }));

    const answersHash = Buffer.from(JSON.stringify(answersData)).toString('base64');

    return NextResponse.json({
      success: true,
      questions: questionsForClient,
      summary: `Generated 15 questions: 5 Quantitative, 5 Logical, 5 Verbal`,
      totalQuestions: questionsForClient.length,
      answersHash,
    });

  } catch (error) {
    console.error('Error generating aptitude test:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate aptitude test',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

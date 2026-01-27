import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export const dynamic = 'force-dynamic'

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

    // Fetch performance metrics
    const { data: metrics, error } = await supabase
      .from('user_performance_metrics')
      .select('*')
      .eq('student_id', student_id)
      .order('last_updated', { ascending: false })

    if (error) {
      console.error('Error fetching performance metrics:', error)
      return NextResponse.json(
        { error: 'Failed to fetch performance metrics' },
        { status: 500 }
      )
    }

    // Calculate overall statistics
    const totalAttempts = metrics?.reduce((sum, m) => sum + m.total_attempts, 0) || 0
    const avgScore = metrics && metrics.length > 0
      ? metrics.reduce((sum, m) => sum + (Number(m.avg_score) || 0) * m.total_attempts, 0) / totalAttempts
      : 0

    const weakTopics = metrics?.filter((m) => (Number(m.avg_score) || 0) < 6) || []
    const strongTopics = metrics?.filter((m) => (Number(m.avg_score) || 0) >= 7) || []

    return NextResponse.json({
      metrics: metrics || [],
      statistics: {
        total_attempts: totalAttempts,
        overall_avg_score: avgScore.toFixed(2),
        topics_practiced: metrics?.length || 0,
        weak_topics_count: weakTopics.length,
        strong_topics_count: strongTopics.length,
      },
      weak_topics: weakTopics,
      strong_topics: strongTopics,
    })
  } catch (error) {
    console.error('Performance fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


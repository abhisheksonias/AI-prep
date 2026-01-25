import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

// GET user profile
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('user_id')

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, email, department, year, resume_text, resume_url, skills, career_goal, interests, target_company_type')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ profile: data })
  } catch (error) {
    console.error('Error in GET profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// UPDATE user profile
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      user_id,
      resume_text,
      resume_url,
      skills,
      career_goal,
      interests,
      target_company_type
    } = body

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      )
    }

    // Build update object with only provided fields
    // Convert empty strings to null for database consistency
    const updateData: any = {}
    if (resume_text !== undefined) {
      updateData.resume_text = resume_text === '' ? null : resume_text
    }
    if (resume_url !== undefined) {
      updateData.resume_url = resume_url === '' ? null : resume_url
    }
    if (skills !== undefined) {
      updateData.skills = Array.isArray(skills) && skills.length > 0 ? skills : null
    }
    if (career_goal !== undefined) {
      updateData.career_goal = career_goal === '' ? null : career_goal
    }
    if (interests !== undefined) {
      updateData.interests = Array.isArray(interests) && interests.length > 0 ? interests : null
    }
    if (target_company_type !== undefined) {
      updateData.target_company_type = target_company_type === '' ? null : target_company_type
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user_id)
      .select('id, full_name, email, department, year, resume_text, resume_url, skills, career_goal, interests, target_company_type')
      .single()

    if (error) {
      console.error('Error updating profile:', error)
      return NextResponse.json(
        { error: 'Failed to update profile', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      profile: data,
      message: 'Profile updated successfully'
    })
  } catch (error) {
    console.error('Error in PUT profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


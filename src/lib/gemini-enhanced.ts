interface StudentProfile {
  resume_text: string | null
  skills: string[] | null
  career_goal: string | null
  interests: string[] | null
  target_company_type: string | null
}

interface PerformanceMetrics {
  topic: string
  avg_score: number | null
  total_attempts: number
}

interface GeminiEvaluationResponse {
  score: number
  strengths: string
  weaknesses: string
  ideal_answer: string
  feedback: string
  technical_accuracy: number
  communication_clarity: number
  interview_readiness: number
}

interface GeminiAPIResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string
      }>
    }
  }>
}

export async function evaluateAnswerWithProfile(
  question: string,
  studentAnswer: string,
  roleType: string,
  topic: string,
  difficulty: string,
  studentProfile: StudentProfile,
  performanceMetrics?: PerformanceMetrics[]
): Promise<GeminiEvaluationResponse> {
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENAI_API_KEY

  if (!apiKey) {
    throw new Error('Gemini API key is not configured')
  }

  // Build performance context
  let performanceContext = ''
  if (performanceMetrics && performanceMetrics.length > 0) {
    const metricsText = performanceMetrics
      .map((m) => `${m.topic}: ${m.avg_score?.toFixed(1) || 'N/A'}/10 (${m.total_attempts} attempts)`)
      .join(', ')
    performanceContext = `\n\nPast Performance:\n${metricsText}`
  }

  // Build profile context
  const skillsText = studentProfile.skills?.join(', ') || 'Not specified'
  const interestsText = studentProfile.interests?.join(', ') || 'Not specified'
  const resumeSummary = studentProfile.resume_text
    ? `\nResume Summary: ${studentProfile.resume_text.substring(0, 500)}...`
    : ''

  const prompt = `You are an experienced ${roleType} interviewer evaluating a candidate's response to a technical interview question.

CANDIDATE PROFILE:
- Career Goal: ${studentProfile.career_goal || 'Not specified'}
- Skills: ${skillsText}
- Interests: ${interestsText}
- Target Company Type: ${studentProfile.target_company_type || 'Not specified'}
${resumeSummary}${performanceContext}

INTERVIEW QUESTION:
Topic: ${topic}
Difficulty: ${difficulty}
Question: ${question}

CANDIDATE'S ANSWER (Transcribed from Voice):
${studentAnswer}

Please evaluate this answer considering:
1. The candidate's background, skills, and career goals
2. Technical accuracy and depth
3. Communication clarity (especially important for voice responses)
4. Interview readiness for their target role
5. Alignment with their career aspirations

Provide a comprehensive assessment in the following JSON format:
{
  "score": <number between 0 and 10>,
  "technical_accuracy": <number between 0 and 10>,
  "communication_clarity": <number between 0 and 10>,
  "interview_readiness": <number between 0 and 10>,
  "strengths": "<comma-separated list of what the candidate did well, considering their profile>",
  "weaknesses": "<comma-separated list of areas that need improvement, personalized to their career goals>",
  "ideal_answer": "<a comprehensive ideal answer tailored to their skill level and career goals>",
  "feedback": "<detailed, personalized feedback explaining the score, how it relates to their profile, and actionable steps to improve for their target role>"
}

Be thorough, constructive, and personalized. Consider:
- How well the answer demonstrates their stated skills
- Whether the answer aligns with their career goals
- Communication effectiveness (voice clarity, structure)
- Technical depth appropriate for their experience level
- Specific recommendations for their target role/company type

Return ONLY valid JSON, no additional text.`

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      }
    )

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Gemini API error:', errorData)
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`)
    }

    const data: GeminiAPIResponse = await response.json()

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No response from Gemini API')
    }

    const responseText = data.candidates[0].content.parts[0].text.trim()

    // Try to extract JSON from the response
    let jsonText = responseText
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      jsonText = jsonMatch[0]
    }

    const evaluation: GeminiEvaluationResponse = JSON.parse(jsonText)

    // Validate and normalize the response
    return {
      score: Math.max(0, Math.min(10, Number(evaluation.score) || 0)),
      technical_accuracy: Math.max(0, Math.min(10, Number(evaluation.technical_accuracy) || 0)),
      communication_clarity: Math.max(0, Math.min(10, Number(evaluation.communication_clarity) || 0)),
      interview_readiness: Math.max(0, Math.min(10, Number(evaluation.interview_readiness) || 0)),
      strengths: evaluation.strengths || 'No specific strengths identified',
      weaknesses: evaluation.weaknesses || 'No specific weaknesses identified',
      ideal_answer: evaluation.ideal_answer || 'Ideal answer not provided',
      feedback: evaluation.feedback || 'No feedback provided',
    }
  } catch (error) {
    console.error('Error calling Gemini API:', error)
    if (error instanceof SyntaxError) {
      throw new Error('Failed to parse Gemini API response as JSON')
    }
    throw error
  }
}

export async function buildInterviewContext(
  studentProfile: StudentProfile,
  performanceMetrics?: PerformanceMetrics[]
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENAI_API_KEY

  if (!apiKey) {
    throw new Error('Gemini API key is not configured')
  }

  let performanceContext = ''
  if (performanceMetrics && performanceMetrics.length > 0) {
    const weakTopics = performanceMetrics
      .filter((m) => (m.avg_score || 0) < 6)
      .map((m) => m.topic)
    const strongTopics = performanceMetrics
      .filter((m) => (m.avg_score || 0) >= 7)
      .map((m) => m.topic)

    performanceContext = `\n\nPerformance Analysis:
- Strong Topics: ${strongTopics.length > 0 ? strongTopics.join(', ') : 'None identified'}
- Areas Needing Practice: ${weakTopics.length > 0 ? weakTopics.join(', ') : 'None identified'}`
  }

  const prompt = `Based on the following student profile, generate a comprehensive interview context that will help select appropriate questions and personalize the interview experience.

STUDENT PROFILE:
- Career Goal: ${studentProfile.career_goal || 'Not specified'}
- Skills: ${studentProfile.skills?.join(', ') || 'Not specified'}
- Interests: ${studentProfile.interests?.join(', ') || 'Not specified'}
- Target Company Type: ${studentProfile.target_company_type || 'Not specified'}
- Resume: ${studentProfile.resume_text || 'Not provided'}${performanceContext}

Generate a concise interview context (2-3 sentences) that summarizes:
1. The student's technical background and career aspirations
2. Key areas to focus on during the interview
3. Appropriate difficulty level and topics

Return ONLY the context text, no additional formatting or labels.`

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data: GeminiAPIResponse = await response.json()
    const context = data.candidates[0].content.parts[0].text.trim()
    return context
  } catch (error) {
    console.error('Error building interview context:', error)
    // Return a fallback context
    return `Interview context for student with career goal: ${studentProfile.career_goal || 'General'}, skills: ${studentProfile.skills?.join(', ') || 'Various'}`
  }
}


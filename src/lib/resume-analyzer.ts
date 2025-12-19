interface ResumeAnalysisResponse {
  ats_score: number
  overall_rating: string
  strengths: string[]
  weaknesses: string[]
  key_improvements: Array<{
    category: string
    suggestion: string
    priority: 'High' | 'Medium' | 'Low'
  }>
  ats_analysis: {
    keywords_match: number
    formatting_score: number
    content_quality: number
  }
  confidence_boost: string
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

export async function analyzeResume(resumeText: string): Promise<ResumeAnalysisResponse> {
  const apiKey = 'AIzaSyDaG_tKNdzDNnXuDHbsduAp0kTxR6YSBag'

  const prompt = `You are an expert ATS (Applicant Tracking System) resume reviewer and career coach. Analyze the following resume and provide comprehensive feedback.

RESUME TO ANALYZE:
${resumeText}

Please provide a detailed analysis in the following JSON format (return ONLY valid JSON, no additional text):
{
  "ats_score": <number between 0 and 100, representing how well the resume will pass through ATS systems>,
  "overall_rating": "<one of: 'Excellent', 'Good', 'Fair', 'Needs Improvement'>",
  "strengths": [
    "<specific strength 1>",
    "<specific strength 2>",
    "<specific strength 3>"
  ],
  "weaknesses": [
    "<specific weakness 1>",
    "<specific weakness 2>"
  ],
  "key_improvements": [
    {
      "category": "<e.g., 'Formatting', 'Content', 'Keywords', 'Structure'>",
      "suggestion": "<specific, actionable improvement suggestion>",
      "priority": "<High/Medium/Low>"
    }
  ],
  "ats_analysis": {
    "keywords_match": <number 0-100, how well resume matches common job keywords>,
    "formatting_score": <number 0-100, ATS-friendly formatting quality>,
    "content_quality": <number 0-100, overall content quality and impact>
  },
  "confidence_boost": "<A motivational, encouraging message (2-3 sentences) highlighting what the candidate is doing well, even if scores are lower. Make them feel confident and motivated to improve. Focus on their potential and growth mindset. Be positive and supportive.>"
}

CRITICAL ANALYSIS CRITERIA:
1. ATS Score (0-100): Consider keyword optimization, format compatibility, file type, section organization, contact information placement, and parsability
2. Strengths: Identify genuine positive aspects - technical skills, experience, achievements, education, projects, certifications
3. Weaknesses: Be constructive - identify areas that could be improved but frame them as opportunities
4. Key Improvements: Provide specific, actionable suggestions with clear priorities
5. Confidence Boost: ALWAYS include this, even if resume needs work. Focus on potential, willingness to improve, and positive aspects. Make the candidate feel encouraged and confident.

Be thorough, constructive, and encouraging. Remember: the goal is to help the candidate improve while maintaining their confidence.`

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

    // Extract JSON from response
    let jsonText = responseText
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      jsonText = jsonMatch[0]
    } else {
      console.error('No JSON found in Gemini response:', responseText.substring(0, 500))
      throw new Error('Invalid response format from Gemini API - no JSON found')
    }

    let analysis: ResumeAnalysisResponse
    try {
      analysis = JSON.parse(jsonText)
    } catch (parseError) {
      console.error('Failed to parse JSON from Gemini:', jsonText.substring(0, 500))
      throw new Error('Failed to parse JSON response from Gemini API')
    }

    // Validate and normalize the response
    return {
      ats_score: Math.max(0, Math.min(100, Number(analysis.ats_score) || 0)),
      overall_rating: analysis.overall_rating || 'Fair',
      strengths: Array.isArray(analysis.strengths) ? analysis.strengths : [],
      weaknesses: Array.isArray(analysis.weaknesses) ? analysis.weaknesses : [],
      key_improvements: Array.isArray(analysis.key_improvements) ? analysis.key_improvements : [],
      ats_analysis: {
        keywords_match: Math.max(0, Math.min(100, Number(analysis.ats_analysis?.keywords_match) || 0)),
        formatting_score: Math.max(0, Math.min(100, Number(analysis.ats_analysis?.formatting_score) || 0)),
        content_quality: Math.max(0, Math.min(100, Number(analysis.ats_analysis?.content_quality) || 0)),
      },
      confidence_boost: analysis.confidence_boost || 'Your resume shows potential. Keep working on it, and you\'ll see great improvements!',
    }
  } catch (error) {
    console.error('Error calling Gemini API for resume analysis:', error)
    if (error instanceof SyntaxError) {
      throw new Error('Failed to parse Gemini API response as JSON')
    }
    throw error
  }
}


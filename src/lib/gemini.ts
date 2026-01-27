interface GeminiEvaluationResponse {
  score: number
  strengths: string
  weaknesses: string
  ideal_answer: string
  feedback: string
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

export async function evaluateAnswerWithGemini(
  question: string,
  studentAnswer: string,
  roleType: string,
  topic: string,
  difficulty: string
): Promise<GeminiEvaluationResponse> {
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENAI_API_KEY

  if (!apiKey) {
    throw new Error('Gemini API key is not configured')
  }

  const prompt = `You are an experienced ${roleType} interviewer evaluating a candidate's response to a technical interview question.

Question: ${question}
Topic: ${topic}
Difficulty Level: ${difficulty}

Candidate's Answer: ${studentAnswer}

Please evaluate this answer and provide a detailed assessment in the following JSON format:
{
  "score": <number between 0 and 10>,
  "strengths": "<comma-separated list of what the candidate did well>",
  "weaknesses": "<comma-separated list of areas that need improvement>",
  "ideal_answer": "<a comprehensive ideal answer to this question>",
  "feedback": "<detailed feedback explaining the score and how to improve>"
}

Be thorough and constructive. Consider:
- Technical accuracy
- Completeness of the answer
- Clarity and communication
- Problem-solving approach
- Code quality (if applicable)
- Best practices

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

    // Try to extract JSON from the response (handle cases where Gemini adds extra text)
    let jsonText = responseText
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      jsonText = jsonMatch[0]
    }

    const evaluation: GeminiEvaluationResponse = JSON.parse(jsonText)

    // Validate and normalize the response
    return {
      score: Math.max(0, Math.min(10, Number(evaluation.score) || 0)),
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


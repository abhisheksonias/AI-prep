export interface ResumeAnalysisResponse {
  matchScore: number
  metrics: {
    keywordsInResume: number
    totalKeywordsInJobDescription: number
  }
  matchedKeywords: string[]
  missingSkills: string
  keyImprovements: Array<{
    title: string
    suggestion: string
  }>
  feedback: string
}

// Re-export from Genkit flows for compatibility
export { analyzeResumeAndGenerateFeedback } from '@/ai/flows/analyze-resume-and-generate-feedback'
export type { AnalyzeResumeAndGenerateFeedbackOutput as ResumeAnalysisOutput } from '@/ai/flows/analyze-resume-and-generate-feedback'



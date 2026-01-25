'use server';

import { analyzeResumeAndGenerateFeedback, type AnalyzeResumeAndGenerateFeedbackOutput } from '@/ai/flows/analyze-resume-and-generate-feedback';

export type AnalysisResult = AnalyzeResumeAndGenerateFeedbackOutput;

export async function analyzeResume(
  resumeText: string,
  jobDescription: string
): Promise<{ success: boolean; data?: AnalysisResult; error?: string }> {
  try {
    if (!resumeText || !jobDescription) {
      return {
        success: false,
        error: 'Resume and job description are required',
      };
    }

    const result = await analyzeResumeAndGenerateFeedback({
      resumeText,
      jobDescription,
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('Error analyzing resume:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to analyze resume';
    return {
      success: false,
      error: errorMessage,
    };
  }
}

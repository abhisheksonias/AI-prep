'use server';
/**
 * @fileOverview A resume analysis and feedback generation AI agent.
 *
 * - analyzeResumeAndGenerateFeedback - A function that handles the resume analysis and feedback generation process.
 * - AnalyzeResumeAndGenerateFeedbackInput - The input type for the analyzeResumeAndGenerateFeedback function.
 * - AnalyzeResumeAndGenerateFeedbackOutput - The return type for the analyzeResumeAndGenerateFeedback function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeResumeAndGenerateFeedbackInputSchema = z.object({
  resumeText: z.string().describe('The text extracted from the user\'s resume.'),
  jobDescription: z.string().describe('The job description for which the resume is being analyzed.'),
});
export type AnalyzeResumeAndGenerateFeedbackInput = z.infer<typeof AnalyzeResumeAndGenerateFeedbackInputSchema>;

const AnalyzeResumeAndGenerateFeedbackOutputSchema = z.object({
  matchScore: z.number().describe('A numerical score representing how well the resume matches the job description (0-100).'),
  metrics: z.object({
      keywordsInResume: z.number().describe("Number of keywords from the job description found in the resume."),
      totalKeywordsInJobDescription: z.number().describe("Total number of relevant keywords extracted from the job description."),
  }).describe("Detailed metrics about the analysis."),
  matchedKeywords: z.array(z.string()).describe('List of keywords and skills that match between the resume and the job description.'),
  missingSkills: z.string().describe('A comma-separated list of important skills present in the job description but missing from the resume.'),
  keyImprovements: z.array(z.object({
    title: z.string().describe('Title of the improvement area (e.g., "Quantify Achievements", "Add Technical Skills").'),
    suggestion: z.string().describe('Specific, actionable suggestion for improvement.'),
  })).describe('A list of the top 3-5 key areas for improvement.'),
  feedback: z.string().describe('A summary of the analysis and overall personalized feedback.'),
});
export type AnalyzeResumeAndGenerateFeedbackOutput = z.infer<typeof AnalyzeResumeAndGenerateFeedbackOutputSchema>;

export async function analyzeResumeAndGenerateFeedback(
  input: AnalyzeResumeAndGenerateFeedbackInput
): Promise<AnalyzeResumeAndGenerateFeedbackOutput> {
  return analyzeResumeAndGenerateFeedbackFlow(input);
}

const analyzeResumeAndGenerateFeedbackPrompt = ai.definePrompt({
  name: 'analyzeResumeAndGenerateFeedbackPrompt',
  input: {schema: AnalyzeResumeAndGenerateFeedbackInputSchema},
  output: {schema: AnalyzeResumeAndGenerateFeedbackOutputSchema},
  prompt: `You are a resume expert providing feedback to job seekers.

  Analyze the provided resume text and job description. Provide a comprehensive analysis including:
  1. A match score from 0 to 100.
  2. Detailed metrics: number of keywords from the job description found in the resume, and total number of relevant keywords in the job description.
  3. A list of keywords found in both the resume and the job description.
  4. A comma-separated list of important skills from the job description that are missing in the resume.
  5. A list of 3-5 key improvement suggestions, each with a title and a specific, actionable suggestion.
  6. A final summary feedback paragraph.

  Resume Text: {{{resumeText}}}
  Job Description: {{{jobDescription}}}

  Output should be formatted as JSON as described by the schema.
  `,
});

const analyzeResumeAndGenerateFeedbackFlow = ai.defineFlow(
  {
    name: 'analyzeResumeAndGenerateFeedbackFlow',
    inputSchema: AnalyzeResumeAndGenerateFeedbackInputSchema,
    outputSchema: AnalyzeResumeAndGenerateFeedbackOutputSchema,
  },
  async input => {
    const {output} = await analyzeResumeAndGenerateFeedbackPrompt(input);
    return output!;
  }
);

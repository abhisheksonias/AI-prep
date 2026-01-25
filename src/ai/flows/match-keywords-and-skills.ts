'use server';

/**
 * @fileOverview A flow to match keywords and skills between a resume and a job description.
 *
 * - matchKeywordsAndSkills - A function that handles the keyword and skill matching process.
 * - MatchKeywordsAndSkillsInput - The input type for the matchKeywordsAndSkills function.
 * - MatchKeywordsAndSkillsOutput - The return type for the matchKeywordsAndSkills function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MatchKeywordsAndSkillsInputSchema = z.object({
  resumeText: z
    .string()
    .describe('The text extracted from the resume.'),
  jobDescription: z
    .string()
    .describe('The job description to compare against the resume.'),
});
export type MatchKeywordsAndSkillsInput = z.infer<typeof MatchKeywordsAndSkillsInputSchema>;

const MatchKeywordsAndSkillsOutputSchema = z.object({
  matchScore: z
    .number()
    .describe('A score indicating the degree of match between the resume and the job description (0-100).'),
  matchedKeywords: z.array(
    z.string().describe('Keywords and skills found in both the resume and the job description.')
  ).
  describe('List of keywords and skills that match between the resume and the job description'),
});
export type MatchKeywordsAndSkillsOutput = z.infer<typeof MatchKeywordsAndSkillsOutputSchema>;

export async function matchKeywordsAndSkills(input: MatchKeywordsAndSkillsInput): Promise<MatchKeywordsAndSkillsOutput> {
  return matchKeywordsAndSkillsFlow(input);
}

const matchKeywordsAndSkillsPrompt = ai.definePrompt({
  name: 'matchKeywordsAndSkillsPrompt',
  input: {schema: MatchKeywordsAndSkillsInputSchema},
  output: {schema: MatchKeywordsAndSkillsOutputSchema},
  prompt: `You are an AI-powered resume analyzer. Your task is to compare a resume against a job description and identify matching keywords and skills.

  Resume:
  {{resumeText}}

  Job Description:
  {{jobDescription}}

  Based on the resume and job description, provide:
  1.  A match score (0-100) indicating how well the resume aligns with the job requirements.
  2.  A list of keywords and skills found in both the resume and the job description.

  Ensure the output is formatted as a JSON object matching the following schema:
  ${JSON.stringify(MatchKeywordsAndSkillsOutputSchema.describe(''))}
`,
});

const matchKeywordsAndSkillsFlow = ai.defineFlow(
  {
    name: 'matchKeywordsAndSkillsFlow',
    inputSchema: MatchKeywordsAndSkillsInputSchema,
    outputSchema: MatchKeywordsAndSkillsOutputSchema,
  },
  async input => {
    const {output} = await matchKeywordsAndSkillsPrompt(input);
    return output!;
  }
);

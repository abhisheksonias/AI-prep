'use server';

/**
 * @fileOverview Identifies skills and experiences present in the job description but missing from the resume.
 *
 * - identifySkillsGap - A function that identifies the skills gap between a resume and a job description.
 * - IdentifySkillsGapInput - The input type for the identifySkillsGap function.
 * - IdentifySkillsGapOutput - The return type for the identifySkillsGap function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IdentifySkillsGapInputSchema = z.object({
  resumeText: z
    .string()
    .describe('The text extracted from the uploaded resume.'),
  jobDescription: z.string().describe('The job description for comparison.'),
});
export type IdentifySkillsGapInput = z.infer<typeof IdentifySkillsGapInputSchema>;

const IdentifySkillsGapOutputSchema = z.object({
  missingSkills: z
    .string()
    .describe(
      'A list of skills and experiences present in the job description but missing from the resume.'
    ),
});
export type IdentifySkillsGapOutput = z.infer<typeof IdentifySkillsGapOutputSchema>;

export async function identifySkillsGap(input: IdentifySkillsGapInput): Promise<IdentifySkillsGapOutput> {
  return identifySkillsGapFlow(input);
}

const prompt = ai.definePrompt({
  name: 'identifySkillsGapPrompt',
  input: {schema: IdentifySkillsGapInputSchema},
  output: {schema: IdentifySkillsGapOutputSchema},
  prompt: `You are an expert career coach. Your task is to identify the skills and experiences present in the job description that are missing from the resume.

  Resume:
  {{resumeText}}

  Job Description:
  {{jobDescription}}

  Identify the key skills and experiences mentioned in the job description that are not evident or sufficiently detailed in the resume. Provide a concise list of these missing skills and experiences.
  Format the output as a string.
  `,
});

const identifySkillsGapFlow = ai.defineFlow(
  {
    name: 'identifySkillsGapFlow',
    inputSchema: IdentifySkillsGapInputSchema,
    outputSchema: IdentifySkillsGapOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

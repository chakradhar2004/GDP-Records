'use server';
/**
 * @fileOverview An AI-powered tool to analyze GDP data and identify growth trends and potential economic insights.
 *
 * - analyzeGDPTrends - A function that handles the GDP trends analysis process.
 * - AnalyzeGDPTrendsInput - The input type for the analyzeGDPTrends function.
 * - AnalyzeGDPTrendsOutput - The return type for the analyzeGDPTrends function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeGDPTrendsInputSchema = z.array(
  z.object({
    year: z.number().describe('The year of the GDP record.'),
    value: z.number().describe('The GDP value for the given year.'),
  })
).describe('An array of GDP records, each containing a year and a value.');

export type AnalyzeGDPTrendsInput = z.infer<typeof AnalyzeGDPTrendsInputSchema>;

const AnalyzeGDPTrendsOutputSchema = z.object({
  summary: z.string().describe('A summary of the GDP trends, including growth patterns and potential economic insights.'),
});

export type AnalyzeGDPTrendsOutput = z.infer<typeof AnalyzeGDPTrendsOutputSchema>;

export async function analyzeGDPTrends(input: AnalyzeGDPTrendsInput): Promise<AnalyzeGDPTrendsOutput> {
  return analyzeGDPTrendsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeGDPTrendsPrompt',
  input: {schema: AnalyzeGDPTrendsInputSchema},
  output: {schema: AnalyzeGDPTrendsOutputSchema},
  prompt: `You are an expert economic analyst. Analyze the provided GDP data to identify growth trends and potential economic insights. Provide a detailed summary of your findings.

GDP Data:
{{#each this}}
Year: {{year}}, Value: {{value}}
{{/each}}`,
});

const analyzeGDPTrendsFlow = ai.defineFlow(
  {
    name: 'analyzeGDPTrendsFlow',
    inputSchema: AnalyzeGDPTrendsInputSchema,
    outputSchema: AnalyzeGDPTrendsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

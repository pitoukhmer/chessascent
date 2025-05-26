'use server';
/**
 * @fileOverview Provides personalized feedback and explanations after each chess match.
 *
 * - analyzeGame - A function that analyzes a chess game and provides feedback.
 * - AnalyzeGameInput - The input type for the analyzeGame function.
 * - AnalyzeGameOutput - The return type for the analyzeGame function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeGameInputSchema = z.object({
  gameHistory: z.string().describe('The complete game history in a standard notation like PGN.'),
  playerRating: z.number().describe('The player rating before the match.'),
  opponentRating: z.number().describe('The opponent rating before the match.'),
  userName: z.string().describe('The name of the user who played the game.'),
});
export type AnalyzeGameInput = z.infer<typeof AnalyzeGameInputSchema>;

const AnalyzeGameOutputSchema = z.object({
  summary: z.string().describe('A summary of the game, including key moments and turning points.'),
  strengths: z.array(z.string()).describe('List of strengths demonstrated by the player.'),
  weaknesses: z.array(z.string()).describe('List of weaknesses demonstrated by the player.'),
  keyMistakes: z.array(z.string()).describe('List of key mistakes made by the player with explanations.'),
  improvementTips: z.array(z.string()).describe('Actionable tips for improving the player’s game.'),
});
export type AnalyzeGameOutput = z.infer<typeof AnalyzeGameOutputSchema>;

export async function analyzeGame(input: AnalyzeGameInput): Promise<AnalyzeGameOutput> {
  return analyzeGameFlow(input);
}

const analyzeGamePrompt = ai.definePrompt({
  name: 'analyzeGamePrompt',
  input: {schema: AnalyzeGameInputSchema},
  output: {schema: AnalyzeGameOutputSchema},
  prompt: `You are an expert chess coach providing personalized feedback to players after their games.

  Analyze the following chess game, played by {{userName}}, and provide feedback.
  The player's rating is {{playerRating}}, and their opponent's rating was {{opponentRating}}.

  Game History:
  {{gameHistory}}

  Provide a summary of the game, identify strengths and weaknesses, point out key mistakes with explanations, and offer actionable improvement tips.
  The output should be formatted as a JSON object that conforms to the AnalyzeGameOutputSchema schema.
  `,
});

const analyzeGameFlow = ai.defineFlow(
  {
    name: 'analyzeGameFlow',
    inputSchema: AnalyzeGameInputSchema,
    outputSchema: AnalyzeGameOutputSchema,
  },
  async input => {
    const {output} = await analyzeGamePrompt(input);
    return output!;
  }
);

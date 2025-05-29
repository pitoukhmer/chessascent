
'use server';

/**
 * @fileOverview AI move suggestions during chess tutorials, with a coach persona.
 *
 * - getMoveSuggestion - Provides AI-powered move suggestions for a given chess position.
 * - MoveSuggestionInput - The input type for the getMoveSuggestion function.
 * - MoveSuggestionOutput - The return type for the getMoveSuggestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MoveSuggestionInputSchema = z.object({
  fen: z.string().describe('The current board state in Forsyth–Edwards Notation (FEN).'),
  moveHistory: z.string().describe('The history of moves of the current game, if any. Can be empty.'),
  tutorialStep: z.string().describe('Current step or topic of the tutorial.'),
  playerQuery: z.string().optional().describe('A specific question or request from the player to the coach.'),
});
export type MoveSuggestionInput = z.infer<typeof MoveSuggestionInputSchema>;

const MoveSuggestionOutputSchema = z.object({
  move: z.string().describe('The suggested move in algebraic notation. If no specific move can be suggested based on the query, this might be a general tip or "N/A".'),
  explanation: z.string().describe('The AI coach\'s explanation for the suggested move or response to the player\'s query.'),
});
export type MoveSuggestionOutput = z.infer<typeof MoveSuggestionOutputSchema>;

export async function getMoveSuggestion(input: MoveSuggestionInput): Promise<MoveSuggestionOutput> {
  return getMoveSuggestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'moveSuggestionCoachPrompt',
  input: {schema: MoveSuggestionInputSchema},
  output: {schema: MoveSuggestionOutputSchema},
  prompt: `You are a friendly, encouraging, and insightful chess coach. You are helping a player with a tutorial.

Current tutorial topic: {{{tutorialStep}}}
Current board state (FEN): {{{fen}}}
Move history so far: {{#if moveHistory}}{{{moveHistory}}}{{else}}No moves yet.{{/if}}

{{#if playerQuery}}
The player specifically asked: "{{{playerQuery}}}"
Please address their question directly in your explanation.
{{else}}
The player is looking for a general move suggestion.
{{/if}}

Suggest the best possible move for the current player (usually White in tutorials) in algebraic notation.
Provide a clear, step-by-step explanation for your suggested move, considering the tutorial context and any specific question the player asked.
If the player's query is very general or doesn't relate to a specific move, provide helpful advice related to the board state and tutorial topic.
Be supportive and help them learn. Ensure your explanation is easy to understand for a beginner to intermediate player.

Output the suggested move and your coaching explanation.
  `,
});

const getMoveSuggestionFlow = ai.defineFlow(
  {
    name: 'getMoveSuggestionCoachFlow',
    inputSchema: MoveSuggestionInputSchema,
    outputSchema: MoveSuggestionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);


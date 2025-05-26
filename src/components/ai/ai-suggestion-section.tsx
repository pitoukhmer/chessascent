'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, Loader2 } from 'lucide-react';
import { getMoveSuggestion, type MoveSuggestionInput, type MoveSuggestionOutput } from '@/ai/flows/ai-move-suggestions';
import { useToast } from '@/hooks/use-toast';

interface AiSuggestionSectionProps {
  fen: string;
  moveHistory?: string;
  tutorialStep: string;
}

export function AiSuggestionSection({ fen, moveHistory = "", tutorialStep }: AiSuggestionSectionProps) {
  const [suggestion, setSuggestion] = useState<MoveSuggestionOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGetSuggestion = async () => {
    setIsLoading(true);
    setSuggestion(null);
    try {
      const input: MoveSuggestionInput = { fen, moveHistory, tutorialStep };
      const result = await getMoveSuggestion(input);
      setSuggestion(result);
    } catch (error) {
      console.error("Error getting AI suggestion:", error);
      toast({
        title: "Error",
        description: "Failed to get AI suggestion. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mt-6 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center"><Lightbulb className="mr-2 h-6 w-6 text-accent" /> AI Move Suggestion</CardTitle>
        <CardDescription>Stuck? Let our AI suggest a move and explain its reasoning.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleGetSuggestion} disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Getting Suggestion...
            </>
          ) : (
            'Get AI Suggestion'
          )}
        </Button>
        {suggestion && (
          <div className="p-4 bg-secondary/50 rounded-md border border-secondary space-y-2 animate-fadeIn">
            <p className="text-lg font-semibold">
              Suggested Move: <span className="text-primary">{suggestion.move}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Explanation:</strong> {suggestion.explanation}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Add fadeIn animation to globals.css or tailwind.config.js if not present
// Example for tailwind.config.js:
// theme: {
//   extend: {
//     keyframes: {
//       fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
//     },
//     animation: {
//       fadeIn: 'fadeIn 0.5s ease-in-out',
//     },
//   },
// },
// Make sure to add this keyframe to your tailwind.config.ts animation section
// 'fadeIn': 'fadeIn 0.5s ease-in-out'
// keyframes: {
//   fadeIn: {
//     from: { opacity: '0' },
//     to: { opacity: '1' },
//   },
// ... other keyframes
// }
// animation: {
//   fadeIn: 'fadeIn 0.5s ease-in-out',
// ... other animations
// }
// For simplicity, assuming 'animate-fadeIn' will be handled if custom animations are added.
// Standard ShadCN animations like animate-in should suffice.
// Let's use ShadCN's animation classes, so the above notes are for context.
// The `animate-in` class usually comes from `tailwindcss-animate` with `data-[state=open]` or similar.
// For a simple reveal, we might just rely on conditional rendering or a simple CSS transition.
// Using a simple conditional render for now.

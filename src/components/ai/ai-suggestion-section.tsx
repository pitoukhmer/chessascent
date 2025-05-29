
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Lightbulb, Loader2, Sparkles, MessageCircle } from 'lucide-react';
import { getMoveSuggestion, type MoveSuggestionInput, type MoveSuggestionOutput } from '@/ai/flows/ai-move-suggestions';
import { useToast } from '@/hooks/use-toast';

interface AiSuggestionSectionProps {
  fen: string;
  moveHistory?: string;
  tutorialStep: string;
}

export function AiSuggestionSection({ fen, moveHistory = "", tutorialStep }: AiSuggestionSectionProps) {
  const [suggestion, setSuggestion] = useState<MoveSuggestionOutput | null>(null);
  const [playerQuery, setPlayerQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGetSuggestion = async () => {
    setIsLoading(true);
    setSuggestion(null);
    try {
      const input: MoveSuggestionInput = { fen, moveHistory, tutorialStep, playerQuery };
      const result = await getMoveSuggestion(input);
      setSuggestion(result);
    } catch (error) {
      console.error("Error getting AI coach suggestion:", error);
      toast({
        title: "Error",
        description: "Failed to get coach's suggestion. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mt-6 shadow-md rounded-lg overflow-hidden">
      <CardHeader className="bg-primary/10">
        <div className="flex items-center space-x-3">
          <Avatar className="h-12 w-12 border-2 border-primary">
            <AvatarImage src="https://placehold.co/100x100.png?text=Coach" alt="Chess Coach" data-ai-hint="coach avatar" />
            <AvatarFallback className="bg-primary text-primary-foreground text-lg">
              <MessageCircle className="h-6 w-6" />
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-xl flex items-center text-primary">Chat with Coach</CardTitle>
            <CardDescription className="text-sm text-primary/80">Ask for help or a move suggestion.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <Textarea
          placeholder="Ask a question (e.g., 'What should I do with my rook?' or 'Is there a good attacking move?'). Leave blank for a general suggestion."
          value={playerQuery}
          onChange={(e) => setPlayerQuery(e.target.value)}
          className="min-h-[80px] focus:border-accent"
        />
        <Button onClick={handleGetSuggestion} disabled={isLoading} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Coach is thinking...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Ask Coach
            </>
          )}
        </Button>
        {suggestion && (
          <div className="mt-4 p-4 bg-secondary/50 rounded-md border border-secondary space-y-3 animate-fadeIn">
            {suggestion.move && suggestion.move.toLowerCase() !== 'n/a' && (
              <p className="text-lg font-semibold">
                Coach suggests: <span className="text-primary">{suggestion.move}</span>
              </p>
            )}
            <div>
              <h4 className="font-medium text-md mb-1 text-foreground">Coach's Explanation:</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{suggestion.explanation}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

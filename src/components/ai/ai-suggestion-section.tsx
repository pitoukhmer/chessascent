
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Lightbulb, Loader2, Sparkles, MessageCircle, Volume2, Square } from 'lucide-react';
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
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { toast } = useToast();
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speakText = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel(); // Stop current speech before starting new
      }

      const newUtterance = new SpeechSynthesisUtterance(text);
      utteranceRef.current = newUtterance;
      
      newUtterance.onstart = () => setIsSpeaking(true);
      newUtterance.onend = () => {
        setIsSpeaking(false);
        utteranceRef.current = null;
      };
      newUtterance.onerror = (event) => {
        console.error("Speech synthesis error:", event);
        setIsSpeaking(false);
        utteranceRef.current = null;
        toast({
          title: "Speech Error",
          description: "Could not play coach's voice.",
          variant: "destructive",
        });
      };
      window.speechSynthesis.speak(newUtterance);
    } else {
      toast({
        title: "Speech Not Supported",
        description: "Your browser does not support text-to-speech.",
        variant: "destructive",
      });
    }
  };

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      if (utteranceRef.current) {
        utteranceRef.current.onend = null; 
        utteranceRef.current = null;
      }
    }
  };
  
  useEffect(() => {
    // Cleanup speech on component unmount
    return () => {
      stopSpeaking();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Removed useEffect that auto-played speech on suggestion change.
  // Speech is now only triggered by the button.

  const handleGetSuggestion = async () => {
    setIsLoading(true);
    setSuggestion(null);
    stopSpeaking(); 
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
          disabled={isLoading || isSpeaking}
        />
        <Button onClick={handleGetSuggestion} disabled={isLoading || isSpeaking} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
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
              <div className="flex justify-between items-center mb-1">
                <h4 className="font-medium text-md text-foreground">Coach's Explanation:</h4>
                {suggestion.explanation && (
                  isSpeaking ? (
                    <Button variant="ghost" size="icon" onClick={stopSpeaking} aria-label="Stop speaking" className="h-7 w-7">
                      <Square className="h-4 w-4 text-red-500" />
                    </Button>
                  ) : (
                    <Button variant="ghost" size="icon" onClick={() => speakText(suggestion.explanation)} aria-label="Speak explanation"  className="h-7 w-7" disabled={isLoading}>
                      <Volume2 className="h-4 w-4 text-primary" />
                    </Button>
                  )
                )}
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{suggestion.explanation}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

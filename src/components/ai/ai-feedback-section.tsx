'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Brain, Loader2, ThumbsUp, ThumbsDown, AlertTriangle, Zap } from 'lucide-react';
import { analyzeGame, type AnalyzeGameInput, type AnalyzeGameOutput } from '@/ai/flows/ai-powered-feedback';
import { useToast } from '@/hooks/use-toast';

interface AiFeedbackSectionProps {
  gameHistoryPgn: string;
  playerRating: number;
  opponentRating: number;
  userName: string;
}

export function AiFeedbackSection({ gameHistoryPgn, playerRating, opponentRating, userName }: AiFeedbackSectionProps) {
  const [feedback, setFeedback] = useState<AnalyzeGameOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGetFeedback = async () => {
    setIsLoading(true);
    setFeedback(null);
    try {
      const input: AnalyzeGameInput = { 
        gameHistory: gameHistoryPgn, 
        playerRating, 
        opponentRating, 
        userName 
      };
      const result = await analyzeGame(input);
      setFeedback(result);
    } catch (error) {
      console.error("Error getting AI feedback:", error);
      toast({
        title: "Error",
        description: "Failed to get AI feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mt-6 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center"><Brain className="mr-2 h-6 w-6 text-accent" /> AI Game Analysis</CardTitle>
        <CardDescription>Get personalized feedback on your game, including strengths, weaknesses, and improvement tips.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={handleGetFeedback} disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing Game...
            </>
          ) : (
            'Get AI Feedback'
          )}
        </Button>
        
        {feedback && (
          <div className="mt-6 space-y-6 animate-fadeIn">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Game Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feedback.summary}</p>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl flex items-center"><ThumbsUp className="mr-2 h-5 w-5 text-green-500" /> Strengths</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    {feedback.strengths.map((item, index) => <li key={index}>{item}</li>)}
                  </ul>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl flex items-center"><ThumbsDown className="mr-2 h-5 w-5 text-red-500" /> Weaknesses</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    {feedback.weaknesses.map((item, index) => <li key={index}>{item}</li>)}
                  </ul>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center"><AlertTriangle className="mr-2 h-5 w-5 text-yellow-500" /> Key Mistakes</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  {feedback.keyMistakes.map((item, index) => <li key={index}>{item}</li>)}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center"><Zap className="mr-2 h-5 w-5 text-blue-500" /> Improvement Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  {feedback.improvementTips.map((item, index) => <li key={index}>{item}</li>)}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Remember to add keyframes for 'fadeIn' to tailwind.config.ts if not already present
// keyframes: { ..., fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } } }
// animation: { ..., fadeIn: 'fadeIn 0.5s ease-in-out forwards' }
// Using 'animate-in' from shadcn if available.

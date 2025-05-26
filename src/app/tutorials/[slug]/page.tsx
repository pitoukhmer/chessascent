'use client'; // This page needs client-side interactivity for board and AI calls

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { TUTORIALS_DATA, createPiece } from '@/lib/constants';
import type { BoardState, ChessPiece, SquareCoord, Tutorial } from '@/components/chess/types';
import { Chessboard } from '@/components/chess/chessboard';
import { AiSuggestionSection } from '@/components/ai/ai-suggestion-section';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, Lightbulb, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function TutorialPage() {
  const router = useRouter();
  const params = useParams();
  const slug = typeof params.slug === 'string' ? params.slug : '';
  
  const [tutorial, setTutorial] = useState<Tutorial | null>(null);
  const [currentBoard, setCurrentBoard] = useState<BoardState | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<SquareCoord | null>(null);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const foundTutorial = TUTORIALS_DATA.find((t) => t.slug === slug);
    if (foundTutorial) {
      setTutorial(foundTutorial);
      setCurrentBoard(JSON.parse(JSON.stringify(foundTutorial.initialBoard))); // Deep copy
      setMessage(`Welcome to the ${foundTutorial.title} tutorial! Try to make a move or get an AI suggestion.`);
    } else {
      router.push('/tutorials'); // Redirect if tutorial not found
    }
  }, [slug, router]);

  const handleSquareClick = (coord: SquareCoord) => {
    if (!currentBoard || !tutorial) return;

    setMessage(''); // Clear previous messages

    if (selectedSquare) {
      // Attempt to move piece
      const pieceToMove = currentBoard[selectedSquare.row][selectedSquare.col];
      if (pieceToMove) {
        // Super simplified move logic for demo: just move it, no validation
        const newBoard = currentBoard.map(row => row.slice());
        newBoard[coord.row][coord.col] = pieceToMove;
        newBoard[selectedSquare.row][selectedSquare.col] = null;
        setCurrentBoard(newBoard);
        setMessage(`Moved ${pieceToMove.color} ${pieceToMove.type} from (${selectedSquare.row},${selectedSquare.col}) to (${coord.row},${coord.col}). This is a simplified move. For real game logic, validation is needed.`);
        // In a real scenario, you'd update FEN here if the board changes due to player moves.
        // For this tutorial, AI suggestions are based on initialFen or a fixed FEN for the lesson.
      }
      setSelectedSquare(null);
    } else {
      // Select piece
      if (currentBoard[coord.row][coord.col]) {
        setSelectedSquare(coord);
        setMessage(`Selected piece at (${coord.row},${coord.col}). Click another square to move.`);
      } else {
        setMessage(`Empty square selected at (${coord.row},${coord.col}). Select a square with a piece.`);
      }
    }
  };

  if (!tutorial || !currentBoard) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <p>Loading tutorial...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Button variant="outline" asChild className="mb-6">
        <Link href="/tutorials">
          <ChevronLeft className="mr-2 h-4 w-4" /> Back to Tutorials
        </Link>
      </Button>

      <header className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-primary">{tutorial.title}</h1>
        <p className="text-lg text-muted-foreground">{tutorial.description}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        <div className="md:col-span-2">
          <Chessboard 
            boardState={currentBoard} 
            onSquareClick={handleSquareClick}
            selectedSquare={selectedSquare}
          />
          {message && (
            <p className="mt-4 text-sm text-center p-3 bg-blue-100 text-blue-700 rounded-md border border-blue-300">
              {message}
            </p>
          )}
        </div>

        <div className="space-y-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center"><CheckCircle className="mr-2 h-6 w-6 text-green-500" />Learning Objectives</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                {tutorial.learningObjectives.map((obj, index) => (
                  <li key={index}>{obj}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
          
          <AiSuggestionSection 
            fen={tutorial.initialFen} 
            tutorialStep={`Learning about ${tutorial.title.toLowerCase()}`}
          />
        </div>
      </div>
    </div>
  );
}

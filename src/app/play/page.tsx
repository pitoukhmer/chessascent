'use client';

import { useState, useEffect } from 'react';
import { Chessboard } from '@/components/chess/chessboard';
import { AiFeedbackSection } from '@/components/ai/ai-feedback-section';
import type { BoardState, SquareCoord, ChessPiece } from '@/components/chess/types';
import { createInitialBoard, createPiece, INITIAL_FEN_STANDARD } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RotateCcw, Info, Check } from 'lucide-react';

// This is a very simplified mock of game play.
// A real chess game would require a proper chess engine/library.

export default function PlayPage() {
  const [board, setBoard] = useState<BoardState>(createInitialBoard());
  const [selectedSquare, setSelectedSquare] = useState<SquareCoord | null>(null);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true); // Player is White
  const [gameStatus, setGameStatus] = useState<'ongoing' | 'player_win' | 'ai_win' | 'draw'>('ongoing');
  const [moveHistory, setMoveHistory] = useState<string[]>([]); // Simplified move history
  const [showFeedbackButton, setShowFeedbackButton] = useState(false);

  // Mock AI move
  const makeAiMove = () => {
    if (gameStatus !== 'ongoing') return;

    // Super simple AI: finds first black piece and tries to move it one step forward if pawn, or randomly.
    const newBoard = board.map(row => row.slice());
    let moved = false;
    
    // Try to find a pawn to move
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = newBoard[r][c];
        if (piece && piece.color === 'black' && piece.type === 'P' && r + 1 < 8 && !newBoard[r+1][c]) {
          newBoard[r+1][c] = piece;
          newBoard[r][c] = null;
          moved = true;
          setMoveHistory(prev => [...prev, `AI moves ${piece.type} from (${r},${c}) to (${r+1},${c})`]);
          break;
        }
      }
      if (moved) break;
    }

    // If no pawn move, try any other random valid move (very simplified)
    if (!moved) {
      const blackPieces: {piece: ChessPiece, r: number, c: number}[] = [];
      newBoard.forEach((row, r_idx) => row.forEach((p, c_idx) => {
        if (p && p.color === 'black') blackPieces.push({piece: p, r: r_idx, c: c_idx});
      }));

      if (blackPieces.length > 0) {
        const randomPiece = blackPieces[Math.floor(Math.random() * blackPieces.length)];
        // Try to move to an empty adjacent square (very basic)
        const possibleAiMoves = [[-1,0], [1,0], [0,-1], [0,1]].map(([dr, dc]) => ({r:randomPiece.r+dr, c:randomPiece.c+dc}));
        for (const move of possibleAiMoves) {
          if (move.r >=0 && move.r < 8 && move.c >=0 && move.c < 8 && !newBoard[move.r][move.c]) {
            newBoard[move.r][move.c] = randomPiece.piece;
            newBoard[randomPiece.r][randomPiece.c] = null;
            moved = true;
            setMoveHistory(prev => [...prev, `AI moves ${randomPiece.piece.type} from (${randomPiece.r},${randomPiece.c}) to (${move.r},${move.c})`]);
            break;
          }
        }
      }
    }

    if (moved) {
      setBoard(newBoard);
    } else {
      // If AI cannot move, it's a potential stalemate or win for player
      setGameStatus('player_win'); // Simplified
      setShowFeedbackButton(true);
      return;
    }
    
    setIsPlayerTurn(true);
  };

  const handleSquareClick = (coord: SquareCoord) => {
    if (!isPlayerTurn || gameStatus !== 'ongoing') return;

    if (selectedSquare) {
      const piece = board[selectedSquare.row][selectedSquare.col];
      if (piece && piece.color === 'white') { // Player controls white
        // Simplified move logic: allow any move to an empty square or capture
        const targetPiece = board[coord.row][coord.col];
        if (targetPiece && targetPiece.color === 'white') { // Can't move to square with own piece
             setSelectedSquare(coord); // Reselect
             return;
        }

        const newBoard = board.map(row => row.slice());
        newBoard[coord.row][coord.col] = piece;
        newBoard[selectedSquare.row][selectedSquare.col] = null;
        setBoard(newBoard);
        setMoveHistory(prev => [...prev, `Player moves ${piece.type} from (${selectedSquare.row},${selectedSquare.col}) to (${coord.row},${coord.col})`]);
        
        // Check for simple "win" condition: e.g. player takes AI king
        if (targetPiece && targetPiece.type === 'K' && targetPiece.color === 'black') {
            setGameStatus('player_win');
            setShowFeedbackButton(true);
        } else {
            setIsPlayerTurn(false);
            // Trigger AI move after a short delay
            setTimeout(makeAiMove, 500);
        }
      }
      setSelectedSquare(null);
    } else {
      // Select piece
      const piece = board[coord.row][coord.col];
      if (piece && piece.color === 'white') {
        setSelectedSquare(coord);
      }
    }
  };
  
  const resetGame = () => {
    setBoard(createInitialBoard());
    setSelectedSquare(null);
    setIsPlayerTurn(true);
    setGameStatus('ongoing');
    setMoveHistory([]);
    setShowFeedbackButton(false);
  };

  // Mock PGN
  const generateMockPgn = () => {
    if(moveHistory.length === 0) return "1. e4 e5 *"; // Default if no moves
    // This is a very crude PGN, real PGN is more complex
    return moveHistory
      .map((move, index) => {
        // Assuming player moves first (odd indices in simplified notation are player)
        if(index % 2 === 0) return `${Math.floor(index/2) + 1}. ${move.split(' ')[2] || 'e4'}`; // Player's part of move
        return `${move.split(' ')[2] || 'e5'}`; // AI's part of move
      })
      .reduce((acc, part, index) => {
        if(index % 2 === 0) return `${acc} ${part}`;
        return `${acc}${part}`;
      }, "").trim() + " *"; // Game result unknown
  };


  return (
    <div className="space-y-8">
      <header className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-primary">Play Against AI</h1>
        <p className="text-lg text-muted-foreground">
          Test your skills in a match against our AI opponent.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        <div className="md:col-span-2">
          <Chessboard 
            boardState={board} 
            onSquareClick={handleSquareClick}
            selectedSquare={selectedSquare}
            disabled={!isPlayerTurn || gameStatus !== 'ongoing'}
          />
        </div>

        <div className="space-y-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Game Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="flex items-center">
                <Info className="mr-2 h-5 w-5 text-blue-500" /> 
                Status: <span className="font-semibold ml-1 capitalize">{gameStatus.replace('_', ' ')}</span>
              </p>
              <p className="flex items-center">
                <Check className="mr-2 h-5 w-5 text-green-500" />
                Turn: <span className="font-semibold ml-1">{isPlayerTurn ? 'Your (White)' : 'AI (Black)'}</span>
              </p>
              <Button onClick={resetGame} variant="outline" className="w-full">
                <RotateCcw className="mr-2 h-4 w-4" /> Reset Game
              </Button>
            </CardContent>
          </Card>

          {gameStatus !== 'ongoing' && showFeedbackButton && (
            <AiFeedbackSection 
              gameHistoryPgn={generateMockPgn()}
              playerRating={1200} // Mocked
              opponentRating={1150} // Mocked
              userName="Player1" // Mocked
            />
          )}
          {gameStatus !== 'ongoing' && !showFeedbackButton && (
             <Button onClick={() => setShowFeedbackButton(true)} className="w-full">Show AI Feedback Button</Button>
          )}
           {gameStatus === 'ongoing' && moveHistory.length > 5 && !showFeedbackButton && ( // Show feedback button mid-game after some moves
            <Button onClick={() => setShowFeedbackButton(true)} variant="secondary" className="w-full">
              Request Mid-Game Feedback
            </Button>
          )}
        </div>
      </div>
      
      {moveHistory.length > 0 && (
        <Card className="mt-8">
          <CardHeader><CardTitle>Move History (Simplified)</CardTitle></CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-1 max-h-48 overflow-y-auto text-sm text-muted-foreground">
              {moveHistory.map((move, index) => <li key={index}>{move}</li>)}
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

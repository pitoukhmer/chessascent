'use client';

import { useState, useEffect } from 'react';
import { Chessboard } from '@/components/chess/chessboard';
import { AiFeedbackSection } from '@/components/ai/ai-feedback-section';
import type { BoardState, SquareCoord, ChessPiece } from '@/components/chess/types';
import { createInitialBoard } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RotateCcw, Info, Check } from 'lucide-react';

export default function PlayPage() {
  const [board, setBoard] = useState<BoardState>(createInitialBoard());
  const [selectedSquare, setSelectedSquare] = useState<SquareCoord | null>(null);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true); // Player is White
  const [gameStatus, setGameStatus] = useState<'ongoing' | 'player_win' | 'ai_win' | 'draw'>('ongoing');
  const [moveHistory, setMoveHistory] = useState<string[]>([]); // Simplified move history
  const [showFeedbackButton, setShowFeedbackButton] = useState(false);

  const makeAiMove = () => {
    if (gameStatus !== 'ongoing') return;

    const newBoard = board.map(row => [...row]); // Deep copy
    let moved = false;

    // AI is black. Priority: 1. Pawn Capture, 2. Other Piece Adjacent Capture, 3. Pawn Push, 4. Random Other Piece Move

    // 1. Prioritize Pawn Captures
    if (!moved) {
      const pawnCaptures: { r: number, c: number, targetR: number, targetC: number, piece: ChessPiece }[] = [];
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const piece = newBoard[r][c];
          if (piece && piece.color === 'black' && piece.type === 'P') {
            const captureOffsets = [{ dr: 1, dc: -1 }, { dr: 1, dc: 1 }]; // Pawns move from r to r+1
            for (const offset of captureOffsets) {
              const targetR = r + offset.dr;
              const targetC = c + offset.dc;
              if (targetR >= 0 && targetR < 8 && targetC >= 0 && targetC < 8) {
                const targetPiece = newBoard[targetR][targetC];
                if (targetPiece && targetPiece.color === 'white') {
                  pawnCaptures.push({ r, c, targetR, targetC, piece });
                }
              }
            }
          }
        }
      }
      if (pawnCaptures.length > 0) {
        const captureToMake = pawnCaptures[Math.floor(Math.random() * pawnCaptures.length)]; // Pick a random pawn capture
        newBoard[captureToMake.targetR][captureToMake.targetC] = captureToMake.piece;
        newBoard[captureToMake.r][captureToMake.c] = null;
        moved = true;
        setMoveHistory(prev => [...prev, `AI captures with ${captureToMake.piece.type} from (${captureToMake.r},${captureToMake.c}) to (${captureToMake.targetR},${captureToMake.targetC})`]);
      }
    }
    
    // 2. Prioritize Other Piece Adjacent Captures (Simplified)
    if (!moved) {
      const otherPieceCaptures: { r: number, c: number, targetR: number, targetC: number, piece: ChessPiece }[] = [];
      const blackPieces: { piece: ChessPiece, r: number, c: number }[] = [];
      newBoard.forEach((row, r_idx) => row.forEach((p, c_idx) => {
        if (p && p.color === 'black' && p.type !== 'P') blackPieces.push({ piece: p, r: r_idx, c: c_idx });
      }));

      for (const bp of blackPieces) {
        const { piece, r, c } = bp;
        const adjacentOffsets = [[-1,0], [1,0], [0,-1], [0,1], [-1,-1], [-1,1], [1,-1], [1,1]]; // All 8 directions
        for (const [dr, dc] of adjacentOffsets) {
          const targetR = r + dr;
          const targetC = c + dc;
          if (targetR >= 0 && targetR < 8 && targetC >= 0 && targetC < 8) {
            const targetPiece = newBoard[targetR][targetC];
            if (targetPiece && targetPiece.color === 'white') {
              otherPieceCaptures.push({ r, c, targetR, targetC, piece });
            }
          }
        }
      }
      if (otherPieceCaptures.length > 0) {
        const captureToMake = otherPieceCaptures[Math.floor(Math.random() * otherPieceCaptures.length)];
        newBoard[captureToMake.targetR][captureToMake.targetC] = captureToMake.piece;
        newBoard[captureToMake.r][captureToMake.c] = null;
        moved = true;
        setMoveHistory(prev => [...prev, `AI captures with ${captureToMake.piece.type} from (${captureToMake.r},${captureToMake.c}) to (${captureToMake.targetR},${captureToMake.targetC})`]);
      }
    }

    // 3. Fall back to Pawn Push
    if (!moved) {
      const pawnPushes: { r: number, c: number, targetR: number, targetC: number, piece: ChessPiece }[] = [];
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const piece = newBoard[r][c];
          if (piece && piece.color === 'black' && piece.type === 'P' && r + 1 < 8 && !newBoard[r+1][c]) {
             // Check one square push
            pawnPushes.push({ r, c, targetR: r + 1, targetC: c, piece });
             // Check two square initial push
            if (r === 1 && !newBoard[r+2][c]) { // Pawns start at row 1 for black in this board setup
                 pawnPushes.push({ r, c, targetR: r + 2, targetC: c, piece });
            }
          }
        }
      }
      if (pawnPushes.length > 0) {
        const pushToMake = pawnPushes[Math.floor(Math.random() * pawnPushes.length)];
        newBoard[pushToMake.targetR][pushToMake.targetC] = pushToMake.piece;
        newBoard[pushToMake.r][pushToMake.c] = null;
        moved = true;
        setMoveHistory(prev => [...prev, `AI moves ${pushToMake.piece.type} from (${pushToMake.r},${pushToMake.c}) to (${pushToMake.targetR},${pushToMake.targetC})`]);
      }
    }
    
    // 4. Fall back to Random Adjacent Move (Non-Pawn to Empty Square)
    if (!moved) {
      const blackPieces: {piece: ChessPiece, r: number, c: number}[] = [];
      newBoard.forEach((row, r_idx) => row.forEach((p, c_idx) => {
        if (p && p.color === 'black' && p.type !== 'P') blackPieces.push({piece: p, r: r_idx, c: c_idx});
      }));

      if (blackPieces.length > 0) {
        const shuffledPieces = [...blackPieces].sort(() => 0.5 - Math.random());
        for (const randomPiece of shuffledPieces) {
          const { piece, r, c } = randomPiece;
          const possibleAiMoves = [[-1,0], [1,0], [0,-1], [0,1], [-1,-1], [-1,1], [1,-1], [1,1]];
          const shuffledMoves = [...possibleAiMoves].sort(() => 0.5 - Math.random());

          for (const [dr, dc] of shuffledMoves) {
            const targetR = r + dr;
            const targetC = c + dc;
            if (targetR >=0 && targetR < 8 && targetC >=0 && targetC < 8 && !newBoard[targetR][targetC]) {
              newBoard[targetR][targetC] = piece;
              newBoard[r][c] = null;
              moved = true;
              setMoveHistory(prev => [...prev, `AI moves ${piece.type} from (${r},${c}) to (${targetR},${targetC})`]);
              break;
            }
          }
          if (moved) break;
        }
      }
    }

    if (moved) {
      setBoard(newBoard);
      // Check if AI captured player's King
      let playerKingFound = false;
      newBoard.forEach(row => row.forEach(p => {
        if (p && p.type === 'K' && p.color === 'white') playerKingFound = true;
      }));
      if (!playerKingFound) {
        setGameStatus('ai_win');
        setShowFeedbackButton(true);
        setIsPlayerTurn(true); // Prevent further player moves
        return;
      }
      setIsPlayerTurn(true);
    } else {
      // If AI cannot move, it's a potential stalemate or win for player
      let aiHasPieces = false;
      newBoard.forEach(row => row.forEach(p => { if (p && p.color === 'black') aiHasPieces = true; }));
      
      if (!aiHasPieces) { // No more AI pieces
        setGameStatus('player_win');
      } else { // AI has pieces but cannot move
        // Simplified: consider it a win for player if AI is stuck.
        // A real game would check for stalemate (draw).
        setGameStatus('player_win'); 
      }
      setShowFeedbackButton(true);
      setIsPlayerTurn(true); // Allow player to see state, but game is over.
    }
  };

  const handleSquareClick = (coord: SquareCoord) => {
    if (!isPlayerTurn || gameStatus !== 'ongoing') return;

    const pieceAtSelection = board[coord.row][coord.col];

    if (selectedSquare) {
      const pieceToMove = board[selectedSquare.row][selectedSquare.col];
      if (pieceToMove && pieceToMove.color === 'white') { // Player controls white
        // Simplified move logic: allow any move to an empty square or capture
        const targetPiece = board[coord.row][coord.col];

        if (targetPiece && targetPiece.color === 'white') { // Can't move to square with own piece
             setSelectedSquare(coord); // Reselect if clicking another white piece
             return;
        }
        
        // Disallow moving to the same square
        if (selectedSquare.row === coord.row && selectedSquare.col === coord.col) {
            setSelectedSquare(null); // Deselect
            return;
        }


        const newBoard = board.map(row => [...row]);
        newBoard[coord.row][coord.col] = pieceToMove;
        newBoard[selectedSquare.row][selectedSquare.col] = null;
        setBoard(newBoard);
        setMoveHistory(prev => [...prev, `Player moves ${pieceToMove.type} from (${selectedSquare.row},${selectedSquare.col}) to (${coord.row},${coord.col})`]);
        
        if (targetPiece && targetPiece.type === 'K' && targetPiece.color === 'black') {
            setGameStatus('player_win');
            setShowFeedbackButton(true);
        } else {
            setIsPlayerTurn(false);
            setTimeout(makeAiMove, 500);
        }
      }
      setSelectedSquare(null);
    } else {
      if (pieceAtSelection && pieceAtSelection.color === 'white') {
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

  const generateMockPgn = () => {
    if(moveHistory.length === 0) return "1. e4 e5 *";
    return moveHistory
      .map((move, index) => {
        const parts = move.split(' '); // e.g. "Player", "moves", "P", "from", "(6,4)", "to", "(4,4)"
                                      // or "AI", "captures", "with", "P", "from", "(1,3)", "to", "(2,4)"
        let notation = "??"; // Default for unknown
        if (parts.length > 4) {
            const pieceType = parts.includes("with") ? parts[3] : parts[2];
            const toSq = parts[parts.length -1]; // e.g. (4,4) or (2,4)
            const fromSq = parts[parts.length -3]; 
            
            // Crude conversion to algebraic-like notation
            // Needs proper algebraic notation conversion for real PGN
            const toCol = String.fromCharCode(97 + parseInt(toSq.substring(3,4)));
            const toRow = 8 - parseInt(toSq.substring(1,2));
            const fromCol = String.fromCharCode(97 + parseInt(fromSq.substring(3,4)));
            const fromRow = 8 - parseInt(fromSq.substring(1,2));

            const action = move.toLowerCase().includes("capture") ? "x" : "";
            
            // For pawns, usually just destination, or file for capture
            if (pieceType === "P") {
                notation = action ? `${fromCol}x${toCol}${toRow}` : `${toCol}${toRow}`;
            } else {
                notation = `${pieceType}${action}${toCol}${toRow}`;
            }
        }

        if(index % 2 === 0) return `${Math.floor(index/2) + 1}. ${notation}`; 
        return `${notation}`; 
      })
      .reduce((acc, part, index) => {
        if(index % 2 === 0) return `${acc} ${part}`;
        return `${acc} ${part}`; // AI move directly after player move on same line number part
      }, "").trim() + (gameStatus === 'player_win' ? " 1-0" : gameStatus === 'ai_win' ? " 0-1" : gameStatus === 'draw' ? " 1/2-1/2" : " *");
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
                Turn: <span className="font-semibold ml-1">
                  {gameStatus === 'ongoing' ? (isPlayerTurn ? 'Your (White)' : 'AI (Black)') : 'Game Over'}
                </span>
              </p>
              <Button onClick={resetGame} variant="outline" className="w-full">
                <RotateCcw className="mr-2 h-4 w-4" /> Reset Game
              </Button>
            </CardContent>
          </Card>

          {gameStatus !== 'ongoing' && ( // Show feedback button only when game is over
            <AiFeedbackSection 
              gameHistoryPgn={generateMockPgn()}
              playerRating={1200} 
              opponentRating={1150} 
              userName="Player1"
            />
          )}
           {gameStatus === 'ongoing' && moveHistory.length > 5 && !showFeedbackButton && (
            <Button onClick={() => {
              // For mid-game feedback, we'd likely not alter gameStatus
              // but just show the feedback section. This button is for demonstration.
              // In a real app, this might call a different AI flow or allow continuing play.
              // For now, let's just make it available to show the feedback section.
              // This button itself doesn't trigger AI currently in this demo.
              // To show section, setShowFeedbackButton(true) would be needed.
              // This is simplified, we'll just make a button that *could* request feedback.
              // The existing feedback section is tied to gameStatus !== 'ongoing'
              // We might need a different component or conditional logic for mid-game.
              // For now, this button doesn't do much except be a placeholder.
            }} variant="secondary" className="w-full" title="Mid-game feedback (concept)">
              Request Mid-Game Feedback (Concept)
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


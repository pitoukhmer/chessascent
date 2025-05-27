
'use client';

import { useState, useEffect } from 'react';
import { Chessboard } from '@/components/chess/chessboard';
import { AiFeedbackSection } from '@/components/ai/ai-feedback-section';
import type { BoardState, SquareCoord, ChessPiece, PieceSymbol, PieceStyle, BoardTheme } from '@/components/chess/types';
import { createInitialBoard, createPiece } from '@/lib/constants';
import { isValidMove, getValidMovesForPiece } from '@/lib/chess-logic';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RotateCcw, Info, Check, Settings } from 'lucide-react';
import { Piece } from '@/components/chess/piece';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function PlayBotPage() {
  const [board, setBoard] = useState<BoardState>(createInitialBoard());
  const [isPlayerTurn, setIsPlayerTurn] = useState(true); // Player is White
  const [gameStatus, setGameStatus] = useState<'ongoing' | 'player_win' | 'ai_win' | 'draw'>('ongoing');
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [showFeedbackButton, setShowFeedbackButton] = useState(false);

  const [promotingSquare, setPromotingSquare] = useState<SquareCoord | null>(null);
  const [showPromotionDialog, setShowPromotionDialog] = useState(false);

  const [pieceStyle, setPieceStyle] = useState<PieceStyle>('unicode');
  const [boardTheme, setBoardTheme] = useState<BoardTheme>('default');
  const { toast } = useToast();

  const makeAiMove = () => {
    if (gameStatus !== 'ongoing') return;

    const currentBoard = board.map(row => [...row]);
    const allLegalAiMoves: { from: SquareCoord, to: SquareCoord, piece: ChessPiece, isCapture: boolean }[] = [];

    // Find all legal moves for AI (Black)
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = currentBoard[r][c];
        if (piece && piece.color === 'black') {
          const from = { row: r, col: c };
          const legalMovesForThisPiece = getValidMovesForPiece(currentBoard, from);
          legalMovesForThisPiece.forEach(to => {
            const targetPiece = currentBoard[to.row][to.col];
            allLegalAiMoves.push({ from, to, piece, isCapture: !!(targetPiece && targetPiece.color === 'white') });
          });
        }
      }
    }

    if (allLegalAiMoves.length === 0) {
      // No legal moves for AI - check if player's king is in check (checkmate) or not (stalemate)
      // Simplified: For now, assume stalemate if AI has no moves.
      setGameStatus('draw');
      toast({ title: "Game Over - Draw!", description: "AI has no legal moves.", duration: 5000});
      setShowFeedbackButton(true);
      setIsPlayerTurn(true); // Allow player to see final state or request feedback
      return;
    }

    // AI Move Selection Strategy:
    // 1. Prioritize captures
    // 2. Prioritize pawn promotions (to Queen)
    // 3. Prioritize pawn pushes
    // 4. Random legal move

    let moveToMake: { from: SquareCoord, to: SquareCoord, piece: ChessPiece } | null = null;

    const captureMoves = allLegalAiMoves.filter(move => move.isCapture);
    if (captureMoves.length > 0) {
      moveToMake = captureMoves[Math.floor(Math.random() * captureMoves.length)];
    } else {
      const pawnPromotionMoves = allLegalAiMoves.filter(move => move.piece.type === 'P' && move.to.row === 7);
      if (pawnPromotionMoves.length > 0) {
         moveToMake = pawnPromotionMoves[Math.floor(Math.random() * pawnPromotionMoves.length)];
      } else {
        const pawnPushMoves = allLegalAiMoves.filter(move => move.piece.type === 'P' && !move.isCapture);
        if (pawnPushMoves.length > 0) {
          moveToMake = pawnPushMoves[Math.floor(Math.random() * pawnPushMoves.length)];
        } else {
          moveToMake = allLegalAiMoves[Math.floor(Math.random() * allLegalAiMoves.length)];
        }
      }
    }
    
    if (moveToMake) {
      const { from, to, piece } = moveToMake;
      let pieceToPlace = piece;
      let moveDescription = `AI moves ${piece.type} from (${String.fromCharCode(97 + from.col)}${8 - from.row}) to (${String.fromCharCode(97 + to.col)}${8 - to.row})`;
      
      if (currentBoard[to.row][to.col]) { // It's a capture
         moveDescription = `AI captures with ${piece.type} from (${String.fromCharCode(97 + from.col)}${8 - from.row}) to (${String.fromCharCode(97 + to.col)}${8 - to.row})`;
      }

      currentBoard[to.row][to.col] = null; // Clear target square first
      currentBoard[from.row][from.col] = null;

      // Handle AI Pawn Promotion
      if (piece.type === 'P' && to.row === 7) {
        pieceToPlace = createPiece('Q', 'black'); // AI always promotes to Queen
        moveDescription += ` and promotes to Queen`;
      }
      currentBoard[to.row][to.col] = pieceToPlace;
      
      setMoveHistory(prev => [...prev, moveDescription]);
      setBoard(currentBoard);

      // Check if player's King is captured
      let playerKingFound = false;
      currentBoard.forEach(row => row.forEach(p => {
        if (p && p.type === 'K' && p.color === 'white') playerKingFound = true;
      }));
      if (!playerKingFound) {
        setGameStatus('ai_win');
        setShowFeedbackButton(true);
      } else {
         // Check for stalemate or checkmate for the player
        let playerHasValidMoves = false;
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            const playerPiece = currentBoard[r][c];
            if (playerPiece && playerPiece.color === 'white') {
              if (getValidMovesForPiece(currentBoard, {row: r, col: c}).length > 0) {
                playerHasValidMoves = true;
                break;
              }
            }
          }
          if (playerHasValidMoves) break;
        }
        if (!playerHasValidMoves) {
            setGameStatus('draw'); // Simplified: stalemate
            toast({ title: "Game Over - Draw!", description: "Player has no legal moves.", duration: 5000});
            setShowFeedbackButton(true);
        }
      }
      setIsPlayerTurn(true);
    }
  };

  const handlePieceDragStart = (event: React.DragEvent<HTMLButtonElement>, fromCoord: SquareCoord, piece: ChessPiece) => {
    if (piece.color !== 'white' || !isPlayerTurn || gameStatus !== 'ongoing' || showPromotionDialog) {
      event.preventDefault();
      return;
    }
    const pieceElement = event.currentTarget.firstChild?.cloneNode(true) as HTMLElement;
    if (pieceElement) {
        pieceElement.style.position = "absolute";
        pieceElement.style.left = "-9999px";
        pieceElement.style.width = "48px"; 
        pieceElement.style.height = "48px";
        pieceElement.style.fontSize = "40px";
        document.body.appendChild(pieceElement);
        event.dataTransfer.setDragImage(pieceElement, 24, 24);
        setTimeout(() => {
            if (pieceElement.parentNode) {
                pieceElement.parentNode.removeChild(pieceElement);
            }
        }, 0);
    }
    event.dataTransfer.setData('text/plain', `${fromCoord.row},${fromCoord.col}`);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleSquareDrop = (event: React.DragEvent<HTMLButtonElement>, toCoord: SquareCoord) => {
    event.preventDefault();
    if (!isPlayerTurn || gameStatus !== 'ongoing' || showPromotionDialog) {
      return;
    }

    const transferData = event.dataTransfer.getData('text/plain');
    if (!transferData || !transferData.includes(',')) {
        console.error("Invalid transfer data:", transferData);
        return;
    }

    const [fromRowStr, fromColStr] = transferData.split(',');
    const fromRow = parseInt(fromRowStr, 10);
    const fromCol = parseInt(fromColStr, 10);

    if (isNaN(fromRow) || isNaN(fromCol) || fromRow < 0 || fromRow > 7 || fromCol < 0 || fromCol > 7) {
      console.error("Parsed invalid fromCoords:", fromRow, fromCol);
      return;
    }

    const fromCoord = { row: fromRow, col: fromCol };
    const pieceToMove = board[fromCoord.row][fromCoord.col];

    if (!pieceToMove || pieceToMove.color !== 'white') {
      console.error("No white piece found at source or piece is not white:", fromCoord, pieceToMove);
      return;
    }

    if (fromCoord.row === toCoord.row && fromCoord.col === toCoord.col) {
      return; 
    }

    if (!isValidMove(board, fromCoord, toCoord, 'white')) {
      toast({
        title: "Invalid Move",
        description: "This move is not allowed by the rules.",
        variant: "destructive",
        duration: 2000,
      });
      return;
    }

    const newBoard = board.map(row => [...row]);
    const targetPieceOnBoard = newBoard[toCoord.row][toCoord.col];
    
    newBoard[toCoord.row][toCoord.col] = pieceToMove;
    newBoard[fromCoord.row][fromCoord.col] = null;
    setBoard(newBoard);
    const moveDescription = `Player moves ${pieceToMove.type} from (${String.fromCharCode(97 + fromCoord.col)}${8 - fromCoord.row}) to (${String.fromCharCode(97 + toCoord.col)}${8 - toCoord.row})`;
    setMoveHistory(prev => [...prev, moveDescription]);


    if (targetPieceOnBoard && targetPieceOnBoard.type === 'K' && targetPieceOnBoard.color === 'black') {
        setGameStatus('player_win');
        setShowFeedbackButton(true);
        toast({ title: "Game Over!", description: "You captured the AI's King!", duration: 5000});
    } else if (pieceToMove.type === 'P' && toCoord.row === 0) { 
        setPromotingSquare(toCoord);
        setShowPromotionDialog(true);
    } else {
        setIsPlayerTurn(false);
        setTimeout(makeAiMove, 500);
    }
  };

  const handlePromotionChoice = (promotionPieceType: PieceSymbol) => {
    if (!promotingSquare) return;

    const newBoard = board.map(row => [...row]);
    newBoard[promotingSquare.row][promotingSquare.col] = createPiece(promotionPieceType, 'white');
    setBoard(newBoard);
    setMoveHistory(prev => [...prev, `Player promotes pawn to ${promotionPieceType} at (${String.fromCharCode(97+promotingSquare.col)}${8-promotingSquare.row})`]);

    setShowPromotionDialog(false);
    setPromotingSquare(null);

    let aiKingFound = false;
    newBoard.forEach(row => row.forEach(p => {
        if (p && p.type === 'K' && p.color === 'black') aiKingFound = true;
    }));
    if (!aiKingFound) { // Highly unlikely if promotion leads to king capture, but check
        setGameStatus('player_win');
        setShowFeedbackButton(true);
        toast({ title: "Game Over!", description: "You win! (AI King missing after promotion)", duration: 5000});
        return;
    }

    setIsPlayerTurn(false);
    setTimeout(makeAiMove, 500);
  };

  const resetGame = () => {
    setBoard(createInitialBoard());
    setIsPlayerTurn(true);
    setGameStatus('ongoing');
    setMoveHistory([]);
    setShowFeedbackButton(false);
    setShowPromotionDialog(false);
    setPromotingSquare(null);
  };

  const generateMockPgn = () => {
    // This function is simplified and doesn't produce fully compliant PGN.
    // It's more for the AI feedback than for standard PGN export.
    if(moveHistory.length === 0) return "1. e4 e5 *"; // Default example
    
    let pgn = "";
    let moveCount = 1;
    moveHistory.forEach((move, index) => {
        let simpleNotation = "??"; 
        // Example: "Player moves P from (e2) to (e4)"
        // Example: "AI captures with N from (g8) to (f6)"
        const parts = move.split(' ');
        if (parts.length >= 6) {
            const pieceType = parts.includes("with") ? parts[3] : parts[2];
            const toSqAlgebraic = parts[parts.length - 1].replace(/[()]/g, '');
            const fromSqAlgebraic = parts[parts.length - 3].replace(/[()]/g, '');
            const action = move.toLowerCase().includes("capture") ? "x" : "";
            
            if (pieceType === "P") {
                simpleNotation = action ? `${fromSqAlgebraic.charAt(0)}x${toSqAlgebraic}` : toSqAlgebraic;
            } else {
                simpleNotation = `${pieceType}${action}${toSqAlgebraic}`;
            }
            if (move.toLowerCase().includes("promotes to")) {
                const promotedPiece = parts[parts.length -1]; // "Queen"
                simpleNotation += `=${promotedPiece.charAt(0).toUpperCase()}`;
            }
        }


        if(index % 2 === 0) { // Player's move (White)
            pgn += `${moveCount}. ${simpleNotation} `;
        } else { // AI's move (Black)
            pgn += `${simpleNotation} `;
            moveCount++;
        }
    });

    if (gameStatus === 'player_win') pgn += "1-0";
    else if (gameStatus === 'ai_win') pgn += "0-1";
    else if (gameStatus === 'draw') pgn += "1/2-1/2";
    else pgn += "*"; // Game ongoing or other result

    return pgn.trim();
  };


  return (
    <div className="space-y-8">
      <header className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-primary">Play Against Bot</h1>
        <p className="text-lg text-muted-foreground">
          Test your skills against our AI. Drag and drop pieces. Basic chess rules apply.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        <div className="md:col-span-2 relative">
          <Chessboard
            boardState={board}
            disabled={!isPlayerTurn || gameStatus !== 'ongoing' || showPromotionDialog}
            pieceStyle={pieceStyle}
            boardTheme={boardTheme}
            onPieceDragStart={handlePieceDragStart}
            onSquareDrop={handleSquareDrop}
            currentPlayerColor={isPlayerTurn ? 'white' : 'black'}
          />
           {showPromotionDialog && promotingSquare && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 rounded-md">
              <Card className="p-4 shadow-2xl w-auto">
                <CardHeader className="p-3">
                  <CardTitle className="text-xl">Promote Pawn</CardTitle>
                  <CardDescription className="text-sm">Choose a piece:</CardDescription>
                </CardHeader>
                <CardContent className="p-3 flex justify-center space-x-2">
                  {(['Q', 'R', 'B', 'N'] as PieceSymbol[]).map(pType => (
                    <Button
                      key={pType}
                      onClick={() => handlePromotionChoice(pType)}
                      variant="outline"
                      className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center hover:bg-accent focus:bg-accent"
                      aria-label={`Promote to ${pType}`}
                    >
                      <Piece piece={createPiece(pType, 'white')} pieceStyle={pieceStyle} />
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Game Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="flex items-center">
                <Info className="mr-2 h-5 w-5 text-blue-500" />
                Status: <span className="font-semibold ml-1 capitalize">{gameStatus.replace('_win', ' Wins').replace('ongoing', 'Ongoing')}</span>
              </p>
              <p className="flex items-center">
                <Check className="mr-2 h-5 w-5 text-green-500" />
                Turn: <span className="font-semibold ml-1">
                  {gameStatus === 'ongoing' ? (isPlayerTurn ? (showPromotionDialog ? 'Promoting...' : 'Your (White)') : 'AI (Black)') : 'Game Over'}
                </span>
              </p>
              <Button onClick={resetGame} variant="outline" className="w-full">
                <RotateCcw className="mr-2 h-4 w-4" /> Reset Game
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center"><Settings className="mr-2 h-5 w-5 text-gray-600" />Board & Piece Styles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="piece-style">Piece Style</Label>
                <Select value={pieceStyle} onValueChange={(value) => setPieceStyle(value as PieceStyle)}>
                  <SelectTrigger id="piece-style">
                    <SelectValue placeholder="Select piece style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unicode">Unicode</SelectItem>
                    <SelectItem value="graphical">Graphical (Basic)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="board-theme">Board Theme</Label>
                <Select value={boardTheme} onValueChange={(value) => setBoardTheme(value as BoardTheme)}>
                  <SelectTrigger id="board-theme">
                    <SelectValue placeholder="Select board theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="green">Green</SelectItem>
                    <SelectItem value="blue">Blue</SelectItem>
                    <SelectItem value="brown">Brown (Wood-like)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {gameStatus !== 'ongoing' && showFeedbackButton && (
            <AiFeedbackSection
              gameHistoryPgn={generateMockPgn()}
              playerRating={1200} // Example rating
              opponentRating={1150} // Example rating
              userName="Player"
            />
          )}
           {/* Placeholder for future mid-game feedback - currently not implemented */}
        </div>
      </div>

      {moveHistory.length > 0 && (
        <Card className="mt-8">
          <CardHeader><CardTitle>Move History</CardTitle></CardHeader>
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

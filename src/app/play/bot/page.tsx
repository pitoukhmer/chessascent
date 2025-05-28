

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Chessboard } from '@/components/chess/chessboard';
import { AiFeedbackSection } from '@/components/ai/ai-feedback-section';
import type { BoardState, SquareCoord, ChessPiece, PieceSymbol, PieceStyle, BoardTheme, PieceColor } from '@/components/chess/types';
import { createInitialBoard, createPiece } from '@/lib/constants';
import { isValidMove, getValidMovesForPiece } from '@/lib/chess-logic';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RotateCcw, Info, Check, Settings, TimerIcon, Play, ChevronRight, BarChart3, CpuIcon } from 'lucide-react';
import { Piece } from '@/components/chess/piece';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

type GamePhase = 'setup' | 'playing' | 'ended';
type DifficultyLevel = 'Beginner' | 'Medium' | 'Advanced';
type Winner = 'white' | 'black' | 'draw' | null;

const TIME_CONTROLS = [
  { label: '1 Minute', value: 60 },
  { label: '3 Minutes', value: 180 },
  { label: '5 Minutes', value: 300 },
  { label: '10 Minutes', value: 600 },
  { label: '15 Minutes', value: 900 },
  { label: '30 Minutes', value: 1800 },
];

const AI_DIFFICULTY_LEVELS: DifficultyLevel[] = ['Beginner', 'Medium', 'Advanced'];

function formatTime(timeInSeconds: number): string {
  if (timeInSeconds < 0) timeInSeconds = 0;
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = timeInSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export default function PlayBotPage() {
  const [board, setBoard] = useState<BoardState>(createInitialBoard());
  const [isPlayerTurn, setIsPlayerTurn] = useState(true); // Player is White
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [showFeedbackButton, setShowFeedbackButton] = useState(false);

  const [promotingSquare, setPromotingSquare] = useState<SquareCoord | null>(null);
  const [showPromotionDialog, setShowPromotionDialog] = useState(false);

  const [pieceStyle, setPieceStyle] = useState<PieceStyle>('unicode');
  const [boardTheme, setBoardTheme] = useState<BoardTheme>('default');
  const { toast } = useToast();

  const [lastMove, setLastMove] = useState<{ from: SquareCoord, to: SquareCoord } | null>(null);
  const [highlightedMoves, setHighlightedMoves] = useState<SquareCoord[]>([]);

  // New state for game settings, timers, and phase
  const [gamePhase, setGamePhase] = useState<GamePhase>('setup');
  const [selectedTimeControl, setSelectedTimeControl] = useState<number>(TIME_CONTROLS[2].value); // Default 5 mins
  const [aiDifficulty, setAiDifficulty] = useState<DifficultyLevel>(AI_DIFFICULTY_LEVELS[0]); // Default Beginner
  const [whiteTime, setWhiteTime] = useState<number>(selectedTimeControl);
  const [blackTime, setBlackTime] = useState<number>(selectedTimeControl);
  const [activeTimer, setActiveTimer] = useState<'white' | 'black' | null>(null);
  const [winner, setWinner] = useState<Winner>(null);
  const [endReason, setEndReason] = useState<string>('');


  const makeAiMove = useCallback(() => {
    if (gamePhase !== 'playing' || showPromotionDialog || isPlayerTurn) return;

    const currentBoardForAIMove = board.map(row => [...row]);
    const allLegalAiMoves: { from: SquareCoord, to: SquareCoord, piece: ChessPiece, isCapture: boolean }[] = [];

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = currentBoardForAIMove[r][c];
        if (piece && piece.color === 'black') {
          const from = { row: r, col: c };
          const legalMovesForThisPiece = getValidMovesForPiece(currentBoardForAIMove, from);
          legalMovesForThisPiece.forEach(to => {
            const targetPiece = currentBoardForAIMove[to.row][to.col];
            allLegalAiMoves.push({ from, to, piece, isCapture: !!(targetPiece && targetPiece.color === 'white') });
          });
        }
      }
    }

    if (allLegalAiMoves.length === 0) {
      setGamePhase('ended');
      setWinner('draw');
      setEndReason("Stalemate! AI has no legal moves.");
      toast({ title: "Game Over - Draw!", description: "AI has no legal moves.", duration: 5000 });
      setShowFeedbackButton(true);
      setActiveTimer(null);
      return;
    }

    let moveToMake: { from: SquareCoord, to: SquareCoord, piece: ChessPiece } | null = null;
    const captureMoves = allLegalAiMoves.filter(move => move.isCapture);
    const promotingMoves = allLegalAiMoves.filter(m => m.piece.type === 'P' && m.to.row === 7);

    if (aiDifficulty === 'Beginner') {
      if (captureMoves.length > 0) moveToMake = captureMoves[Math.floor(Math.random() * captureMoves.length)];
      else if (promotingMoves.length > 0) moveToMake = promotingMoves[Math.floor(Math.random() * promotingMoves.length)];
      else {
        const pawnPushMoves = allLegalAiMoves.filter(move => move.piece.type === 'P' && !move.isCapture);
        if (pawnPushMoves.length > 0) moveToMake = pawnPushMoves[Math.floor(Math.random() * pawnPushMoves.length)];
        else if (allLegalAiMoves.length > 0) moveToMake = allLegalAiMoves[Math.floor(Math.random() * allLegalAiMoves.length)];
      }
    } else if (aiDifficulty === 'Medium') {
      const knightBishopMoves = allLegalAiMoves.filter(m => !m.isCapture && (m.piece.type === 'N' || m.piece.type === 'B'));
      const rookQueenMoves = allLegalAiMoves.filter(m => !m.isCapture && (m.piece.type === 'R' || m.piece.type === 'Q'));
      const pawnMoves = allLegalAiMoves.filter(m => !m.isCapture && m.piece.type === 'P');

      if (captureMoves.length > 0) moveToMake = captureMoves[Math.floor(Math.random() * captureMoves.length)];
      else if (promotingMoves.length > 0) moveToMake = promotingMoves[Math.floor(Math.random() * promotingMoves.length)];
      else if (knightBishopMoves.length > 0) moveToMake = knightBishopMoves[Math.floor(Math.random() * knightBishopMoves.length)];
      else if (rookQueenMoves.length > 0) moveToMake = rookQueenMoves[Math.floor(Math.random() * rookQueenMoves.length)];
      else if (pawnMoves.length > 0) moveToMake = pawnMoves[Math.floor(Math.random() * pawnMoves.length)];
      else if (allLegalAiMoves.length > 0) moveToMake = allLegalAiMoves[Math.floor(Math.random() * allLegalAiMoves.length)];
    } else { // Advanced (simplified)
      const rookQueenMoves = allLegalAiMoves.filter(m => !m.isCapture && (m.piece.type === 'R' || m.piece.type === 'Q'));
      const knightBishopMoves = allLegalAiMoves.filter(m => !m.isCapture && (m.piece.type === 'N' || m.piece.type === 'B'));
      const pawnMoves = allLegalAiMoves.filter(m => !m.isCapture && m.piece.type === 'P');

      if (captureMoves.length > 0) moveToMake = captureMoves[Math.floor(Math.random() * captureMoves.length)];
      else if (promotingMoves.length > 0) moveToMake = promotingMoves[Math.floor(Math.random() * promotingMoves.length)];
      else if (rookQueenMoves.length > 0) moveToMake = rookQueenMoves[Math.floor(Math.random() * rookQueenMoves.length)];
      else if (knightBishopMoves.length > 0) moveToMake = knightBishopMoves[Math.floor(Math.random() * knightBishopMoves.length)];
      else if (pawnMoves.length > 0) moveToMake = pawnMoves[Math.floor(Math.random() * pawnMoves.length)];
      else if (allLegalAiMoves.length > 0) moveToMake = allLegalAiMoves[Math.floor(Math.random() * allLegalAiMoves.length)];
    }

    if (moveToMake) {
      const { from, to, piece } = moveToMake;
      const newBoardAfterAIMove = currentBoardForAIMove.map(row => [...row]);
      let pieceToPlace = piece;
      let moveDescription = `AI moves ${piece.type} from (${String.fromCharCode(97 + from.col)}${8 - from.row}) to (${String.fromCharCode(97 + to.col)}${8 - to.row})`;

      if (newBoardAfterAIMove[to.row][to.col]) {
        moveDescription = `AI captures with ${piece.type} from (${String.fromCharCode(97 + from.col)}${8 - from.row}) to (${String.fromCharCode(97 + to.col)}${8 - to.row})`;
      }

      newBoardAfterAIMove[to.row][to.col] = null;
      newBoardAfterAIMove[from.row][from.row] = null;

      if (piece.type === 'P' && to.row === 7) {
        pieceToPlace = createPiece('Q', 'black');
        moveDescription += ` and promotes to Queen`;
      }
      newBoardAfterAIMove[to.row][to.col] = pieceToPlace;

      setLastMove({ from, to });
      setMoveHistory(prev => [...prev, moveDescription]);
      setBoard(newBoardAfterAIMove);

      let playerKingFound = false;
      newBoardAfterAIMove.forEach(row => row.forEach(p => {
        if (p && p.type === 'K' && p.color === 'white') playerKingFound = true;
      }));

      if (!playerKingFound) {
        setGamePhase('ended');
        setWinner('black');
        setEndReason("AI captured Player's King!");
        toast({ title: "Game Over - AI Wins!", description: "AI captured your King!", duration: 5000 });
        setShowFeedbackButton(true);
        setActiveTimer(null);
      } else {
        let playerHasValidMoves = false;
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            const playerPiece = newBoardAfterAIMove[r][c];
            if (playerPiece && playerPiece.color === 'white') {
              if (getValidMovesForPiece(newBoardAfterAIMove, { row: r, col: c }).length > 0) {
                playerHasValidMoves = true;
                break;
              }
            }
          }
          if (playerHasValidMoves) break;
        }
        if (!playerHasValidMoves) {
          setGamePhase('ended');
          setWinner('draw');
          setEndReason("Stalemate! Player has no legal moves.");
          toast({ title: "Game Over - Draw!", description: "Player has no legal moves.", duration: 5000 });
          setShowFeedbackButton(true);
          setActiveTimer(null);
        } else {
          setIsPlayerTurn(true);
          setActiveTimer('white');
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board, gamePhase, showPromotionDialog, aiDifficulty, isPlayerTurn]);

  useEffect(() => {
    if (gamePhase !== 'playing') {
      setActiveTimer(null);
      return;
    }

    if (!isPlayerTurn && !showPromotionDialog) {
      const timer = setTimeout(() => {
        makeAiMove();
      }, 700); // AI "thinking" time
      return () => clearTimeout(timer);
    }
  }, [isPlayerTurn, gamePhase, board, showPromotionDialog, makeAiMove]);

  useEffect(() => {
    if (gamePhase !== 'playing' || !activeTimer) {
      return;
    }

    const interval = setInterval(() => {
      if (activeTimer === 'white') {
        setWhiteTime(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setGamePhase('ended');
            setWinner('black');
            setEndReason('White ran out of time!');
            toast({ title: "Game Over!", description: "You ran out of time! AI wins.", variant: "destructive", duration: 5000 });
            setShowFeedbackButton(true);
            setActiveTimer(null);
            return 0;
          }
          return prev - 1;
        });
      } else if (activeTimer === 'black') {
        setBlackTime(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setGamePhase('ended');
            setWinner('white');
            setEndReason('Black (AI) ran out of time!');
            toast({ title: "Game Over!", description: "AI ran out of time! You win.", duration: 5000 });
            setShowFeedbackButton(true);
            setActiveTimer(null);
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimer, gamePhase, whiteTime, blackTime]);


  const handlePieceDragStart = (event: React.DragEvent<HTMLButtonElement>, fromCoord: SquareCoord, piece: ChessPiece) => {
    if (piece.color !== 'white' || !isPlayerTurn || gamePhase !== 'playing' || showPromotionDialog) {
      event.preventDefault();
      return;
    }
    // Custom drag image logic commented out for stability, can be re-added carefully
    // const pieceElement = event.currentTarget.firstChild?.cloneNode(true) as HTMLElement;
    // if (pieceElement) {
    //     pieceElement.style.position = "absolute";
    //     pieceElement.style.left = "-9999px";
    //     pieceElement.style.width = "48px";
    //     pieceElement.style.height = "48px";
    //     pieceElement.style.fontSize = "40px";
    //     document.body.appendChild(pieceElement);
    //     event.dataTransfer.setDragImage(pieceElement, 24, 24);
    //     setTimeout(() => {
    //         if (pieceElement.parentNode) {
    //             pieceElement.parentNode.removeChild(pieceElement);
    //         }
    //     }, 0);
    // }
    event.dataTransfer.setData('text/plain', `${fromCoord.row},${fromCoord.col}`);
    event.dataTransfer.effectAllowed = 'move';

    const validMoves = getValidMovesForPiece(board, fromCoord);
    setHighlightedMoves(validMoves);
  };

  const handleDragEnd = () => {
    setHighlightedMoves([]);
  };

  const handleSquareDrop = (event: React.DragEvent<HTMLButtonElement>, toCoord: SquareCoord) => {
    event.preventDefault();
    setHighlightedMoves([]);
    if (!isPlayerTurn || gamePhase !== 'playing' || showPromotionDialog) {
      return;
    }

    const transferData = event.dataTransfer.getData('text/plain');
    if (!transferData || !transferData.includes(',')) {
      console.error("Invalid transfer data in handleSquareDrop:", transferData);
      return;
    }

    const [fromRowStr, fromColStr] = transferData.split(',');
    const fromRow = parseInt(fromRowStr, 10);
    const fromCol = parseInt(fromColStr, 10);

    if (isNaN(fromRow) || isNaN(fromCol) || fromRow < 0 || fromRow > 7 || fromCol < 0 || fromCol > 7) {
      console.error("Parsed invalid fromCoords in handleSquareDrop:", { fromRow, fromCol });
      return;
    }

    const fromCoord = { row: fromRow, col: fromCol };
    const pieceToMove = board[fromCoord.row][fromCoord.col];

    if (!pieceToMove || pieceToMove.color !== 'white') {
      console.error("No white piece found at source or piece is not white in handleSquareDrop:", { fromCoord, pieceToMove });
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
    setLastMove({ from: fromCoord, to: toCoord });
    const moveDescription = `Player moves ${pieceToMove.type} from (${String.fromCharCode(97 + fromCoord.col)}${8 - fromCoord.row}) to (${String.fromCharCode(97 + toCoord.col)}${8 - toCoord.row})`;
    setMoveHistory(prev => [...prev, moveDescription]);


    if (targetPieceOnBoard && targetPieceOnBoard.type === 'K' && targetPieceOnBoard.color === 'black') {
      setGamePhase('ended');
      setWinner('white');
      setEndReason("Player captured AI's King!");
      toast({ title: "Game Over!", description: "You captured the AI's King!", duration: 5000 });
      setShowFeedbackButton(true);
      setActiveTimer(null);
    } else if (pieceToMove.type === 'P' && toCoord.row === 0) {
      setPromotingSquare(toCoord);
      setShowPromotionDialog(true);
      setActiveTimer(null); // Pause timer during promotion
    } else {
      setIsPlayerTurn(false);
      setActiveTimer('black');
    }
  };

  const handlePromotionChoice = (promotionPieceType: PieceSymbol) => {
    if (!promotingSquare) return;

    const newBoard = board.map(row => [...row]);
    newBoard[promotingSquare.row][promotingSquare.col] = createPiece(promotionPieceType, 'white');
    setBoard(newBoard);
    setMoveHistory(prev => [...prev, `Player promotes pawn to ${promotionPieceType} at (${String.fromCharCode(97 + promotingSquare.col)}${8 - promotingSquare.row})`]);

    setShowPromotionDialog(false);
    setPromotingSquare(null);

    let aiKingFound = false;
    newBoard.forEach(row => row.forEach(p => {
      if (p && p.type === 'K' && p.color === 'black') aiKingFound = true;
    }));
    if (!aiKingFound) {
      setGamePhase('ended');
      setWinner('white');
      setEndReason("Player wins! (AI King missing after promotion)");
      toast({ title: "Game Over!", description: "You win! (AI King missing after promotion)", duration: 5000 });
      setShowFeedbackButton(true);
      setActiveTimer(null);
      return;
    }

    setIsPlayerTurn(false);
    setActiveTimer('black');
  };

  const startGame = () => {
    setBoard(createInitialBoard());
    setIsPlayerTurn(true);
    setMoveHistory([]);
    setShowFeedbackButton(false);
    setShowPromotionDialog(false);
    setPromotingSquare(null);
    setLastMove(null);
    setHighlightedMoves([]);
    setWhiteTime(selectedTimeControl);
    setBlackTime(selectedTimeControl);
    setActiveTimer('white');
    setWinner(null);
    setEndReason('');
    setGamePhase('playing');
  };

  const resetGame = () => {
    setGamePhase('setup');
    // Reset settings to default for next game setup or allow user to keep current selections
    // For now, let's keep selected time/difficulty
    setBoard(createInitialBoard()); // Reset board for visual consistency in setup
    setIsPlayerTurn(true);
    setMoveHistory([]);
    setShowFeedbackButton(false);
    setShowPromotionDialog(false);
    setPromotingSquare(null);
    setLastMove(null);
    setHighlightedMoves([]);
    setWhiteTime(selectedTimeControl);
    setBlackTime(selectedTimeControl);
    setActiveTimer(null);
    setWinner(null);
    setEndReason('');
  };

  const generateMockPgn = () => {
    if (moveHistory.length === 0) return "1. e4 e5 *";

    let pgn = "";
    let moveCount = 1;
    moveHistory.forEach((move, index) => {
      let simpleNotation = "??";
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
          const promotedPieceToken = parts[parts.length - 1];
          simpleNotation += `=${promotedPieceToken.charAt(0).toUpperCase()}`;
        }
      }

      if (index % 2 === 0) {
        pgn += `${moveCount}. ${simpleNotation} `;
      } else {
        pgn += `${simpleNotation} `;
        moveCount++;
      }
    });

    if (winner === 'white') pgn += "1-0";
    else if (winner === 'black') pgn += "0-1";
    else if (winner === 'draw') pgn += "1/2-1/2";
    else pgn += "*";

    return pgn.trim();
  };

  const getGameStatusMessage = () => {
    if (gamePhase === 'playing') {
      return isPlayerTurn ? (showPromotionDialog ? 'Promoting...' : 'Your (White)') : 'AI (Black)';
    }
    if (gamePhase === 'ended') {
      if (winner === 'white') return `You Win! ${endReason}`;
      if (winner === 'black') return `AI Wins! ${endReason}`;
      if (winner === 'draw') return `Draw! ${endReason}`;
      return 'Game Over';
    }
    return 'Setup';
  };


  return (
    <div className="space-y-8">
      <header className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-primary">Play Against Bot</h1>
        {gamePhase === 'setup' && <p className="text-lg text-muted-foreground">Configure your game and start playing!</p>}
        {gamePhase !== 'setup' && <p className="text-lg text-muted-foreground">Test your skills against our AI.</p>}
      </header>

      {gamePhase === 'setup' && (
        <Card className="max-w-md mx-auto shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Game Settings</CardTitle>
            <CardDescription>Choose your time control and AI difficulty.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="time-control" className="flex items-center"><TimerIcon className="mr-2 h-5 w-5 text-primary" />Time Control (per player)</Label>
              <Select value={String(selectedTimeControl)} onValueChange={(value) => setSelectedTimeControl(Number(value))}>
                <SelectTrigger id="time-control">
                  <SelectValue placeholder="Select time control" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_CONTROLS.map(tc => (
                    <SelectItem key={tc.value} value={String(tc.value)}>{tc.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ai-difficulty" className="flex items-center"><CpuIcon className="mr-2 h-5 w-5 text-primary" />AI Difficulty</Label>
              <Select value={aiDifficulty} onValueChange={(value) => setAiDifficulty(value as DifficultyLevel)}>
                <SelectTrigger id="ai-difficulty">
                  <SelectValue placeholder="Select AI difficulty" />
                </SelectTrigger>
                <SelectContent>
                  {AI_DIFFICULTY_LEVELS.map(level => (
                    <SelectItem key={level} value={level}>{level}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={startGame} size="lg" className="w-full">
              <Play className="mr-2 h-5 w-5" /> Start Game
            </Button>
          </CardContent>
        </Card>
      )}

      {gamePhase !== 'setup' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            <div className="md:col-span-2 relative">
              <Chessboard
                boardState={board}
                disabled={!isPlayerTurn || gamePhase !== 'playing' || showPromotionDialog}
                pieceStyle={pieceStyle}
                boardTheme={boardTheme}
                onPieceDragStart={handlePieceDragStart}
                onSquareDrop={handleSquareDrop}
                onDragEndCapture={handleDragEnd}
                currentPlayerColor={'white'}
                lastMove={lastMove}
                highlightedMoves={highlightedMoves}
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
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center text-lg">
                     <span className={cn("font-semibold", activeTimer === 'white' && isPlayerTurn && "text-primary")}>You: {formatTime(whiteTime)}</span>
                     <span className={cn("font-semibold", activeTimer === 'black' && !isPlayerTurn && "text-primary")}>AI: {formatTime(blackTime)}</span>
                  </div>
                  <p className="flex items-center">
                    <Info className="mr-2 h-5 w-5 text-blue-500" />
                    Status: <span className="font-semibold ml-1">{getGameStatusMessage()}</span>
                  </p>
                  <p className="flex items-center">
                    <Check className="mr-2 h-5 w-5 text-green-500" />
                    Turn: <span className="font-semibold ml-1">
                      {getGameStatusMessage().startsWith('You Win') || getGameStatusMessage().startsWith('AI Wins') || getGameStatusMessage().startsWith('Draw') ? 'Game Over' : (isPlayerTurn && !showPromotionDialog ? 'Your (White)' : (!isPlayerTurn && !showPromotionDialog ? 'AI (Black)' : 'Promoting...'))}
                    </span>
                  </p>
                   <p className="flex items-center">
                    <BarChart3 className="mr-2 h-5 w-5 text-gray-500" />
                    AI Level: <span className="font-semibold ml-1">{aiDifficulty}</span>
                  </p>
                  <Button onClick={resetGame} variant="outline" className="w-full">
                    <RotateCcw className="mr-2 h-4 w-4" /> {gamePhase === 'ended' ? 'New Game Settings' : 'Reset Game'}
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

              {gamePhase === 'ended' && showFeedbackButton && winner !== null && (
                <AiFeedbackSection
                  gameHistoryPgn={generateMockPgn()}
                  playerRating={1200}
                  opponentRating={aiDifficulty === 'Beginner' ? 1000 : aiDifficulty === 'Medium' ? 1300 : 1600}
                  userName="Player"
                />
              )}
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
        </>
      )}
    </div>
  );
}

    

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Chessboard } from '@/components/chess/chessboard';
import { AiFeedbackSection } from '@/components/ai/ai-feedback-section';
import type { BoardState, SquareCoord, ChessPiece, PieceSymbol, PieceStyle, BoardTheme, PieceColor } from '@/components/chess/types';
import { createInitialBoard, createPiece } from '@/lib/constants';
import { isValidMove, getValidMovesForPiece, isKingInCheck, findKing } from '@/lib/chess-logic';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RotateCcw, Info, Check, Settings, TimerIcon, Play, CpuIcon, BarChart3, AlertTriangleIcon } from 'lucide-react';
import { Piece } from '@/components/chess/piece';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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
  const [kingInCheckCoord, setKingInCheckCoord] = useState<SquareCoord | null>(null);

  const [gamePhase, setGamePhase] = useState<GamePhase>('setup');
  const [selectedTimeControl, setSelectedTimeControl] = useState<number>(TIME_CONTROLS[2].value); 
  const [aiDifficulty, setAiDifficulty] = useState<DifficultyLevel>(AI_DIFFICULTY_LEVELS[0]);
  const [whiteTime, setWhiteTime] = useState<number>(selectedTimeControl);
  const [blackTime, setBlackTime] = useState<number>(selectedTimeControl);
  const [activeTimer, setActiveTimer] = useState<'white' | 'black' | null>(null);
  const [winner, setWinner] = useState<Winner>(null);
  const [endReason, setEndReason] = useState<string>('');
  const [checkMessage, setCheckMessage] = useState<string>('');

  const updateCheckStatus = useCallback((currentBoard: BoardState) => {
    const whiteKingPos = findKing(currentBoard, 'white');
    const blackKingPos = findKing(currentBoard, 'black');
    let newCheckMessage = '';
    let newKingInCheckCoord: SquareCoord | null = null;

    if (whiteKingPos && isKingInCheck(currentBoard, 'white')) {
      newCheckMessage = "White is in Check!";
      newKingInCheckCoord = whiteKingPos;
      toast({ title: "Check!", description: "Your King (White) is in check!", variant: "destructive", duration: 3000 });
    } else if (blackKingPos && isKingInCheck(currentBoard, 'black')) {
      newCheckMessage = "Black is in Check!";
      newKingInCheckCoord = blackKingPos;
       toast({ title: "Check!", description: "AI King (Black) is in check!", duration: 3000 });
    }
    setCheckMessage(newCheckMessage);
    setKingInCheckCoord(newKingInCheckCoord);
  }, [toast]);


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
            // Simulate move to check if it leaves AI king in check
            const tempBoard = currentBoardForAIMove.map(row => row.slice());
            tempBoard[to.row][to.col] = piece;
            tempBoard[from.row][from.col] = null;
            if (!isKingInCheck(tempBoard, 'black')) {
              const targetPiece = currentBoardForAIMove[to.row][to.col];
              allLegalAiMoves.push({ from, to, piece, isCapture: !!(targetPiece && targetPiece.color === 'white') });
            }
          });
        }
      }
    }

    if (allLegalAiMoves.length === 0) {
      setGamePhase('ended');
      // check if player's king is in check for checkmate, otherwise stalemate
      if (isKingInCheck(currentBoardForAIMove, 'white')) {
        setWinner('black');
        setEndReason("Checkmate! AI wins.");
        toast({ title: "Game Over - Checkmate!", description: "AI wins!", duration: 5000 });
      } else {
        setWinner('draw'); 
        setEndReason("Stalemate! AI has no legal moves.");
        toast({ title: "Game Over - Draw!", description: "AI has no legal moves.", duration: 5000 });
      }
      setShowFeedbackButton(true);
      setActiveTimer(null);
      return;
    }

    let moveToMake: { from: SquareCoord, to: SquareCoord, piece: ChessPiece } | null = null;
    const captureMoves = allLegalAiMoves.filter(move => move.isCapture);
    const promotingMoves = allLegalAiMoves.filter(m => m.piece.type === 'P' && m.to.row === 7);
    
    const pieceValues: Record<PieceSymbol, number> = { 'P': 1, 'N': 3, 'B': 3, 'R': 5, 'Q': 9, 'K': 0 };

    if (aiDifficulty === 'Beginner') {
      if (captureMoves.length > 0) moveToMake = captureMoves[Math.floor(Math.random() * captureMoves.length)];
      else if (promotingMoves.length > 0) moveToMake = promotingMoves[Math.floor(Math.random() * promotingMoves.length)];
      else {
        const pawnPushMoves = allLegalAiMoves.filter(move => move.piece.type === 'P' && !move.isCapture);
        if (pawnPushMoves.length > 0) moveToMake = pawnPushMoves[Math.floor(Math.random() * pawnPushMoves.length)];
        else if (allLegalAiMoves.length > 0) moveToMake = allLegalAiMoves[Math.floor(Math.random() * allLegalAiMoves.length)];
      }
    } else if (aiDifficulty === 'Medium') {
      if (captureMoves.length > 0) {
        captureMoves.sort((a, b) => {
          const pieceAVal = currentBoardForAIMove[a.to.row][a.to.col] ? pieceValues[currentBoardForAIMove[a.to.row][a.to.col]!.type] : 0;
          const pieceBVal = currentBoardForAIMove[b.to.row][b.to.col] ? pieceValues[currentBoardForAIMove[b.to.row][b.to.col]!.type] : 0;
          return pieceBVal - pieceAVal;
        });
        moveToMake = captureMoves[0];
      } else if (promotingMoves.length > 0) {
        moveToMake = promotingMoves[Math.floor(Math.random() * promotingMoves.length)];
      } else {
        const priorityOrder: PieceSymbol[] = ['N', 'B', 'R', 'Q', 'P', 'K'];
        for (const pType of priorityOrder) {
            const movesOfType = allLegalAiMoves.filter(m => !m.isCapture && m.piece.type === pType);
            if (movesOfType.length > 0) {
                moveToMake = movesOfType[Math.floor(Math.random() * movesOfType.length)];
                break;
            }
        }
        if (!moveToMake && allLegalAiMoves.length > 0) moveToMake = allLegalAiMoves[Math.floor(Math.random() * allLegalAiMoves.length)];
      }
    } else { // Advanced
      if (captureMoves.length > 0) {
        captureMoves.sort((a, b) => {
          const targetA = currentBoardForAIMove[a.to.row][a.to.col];
          const targetB = currentBoardForAIMove[b.to.row][b.to.col];
          const pieceAVal = targetA ? pieceValues[targetA.type] : 0;
          const pieceBVal = targetB ? pieceValues[targetB.type] : 0;
          if (pieceBVal !== pieceAVal) return pieceBVal - pieceAVal;
          const attackerAVal = pieceValues[a.piece.type];
          const attackerBVal = pieceValues[b.piece.type];
          return attackerAVal - attackerBVal;
        });
        moveToMake = captureMoves[0];
      } else if (promotingMoves.length > 0) {
        moveToMake = promotingMoves[Math.floor(Math.random() * promotingMoves.length)]; 
      } else {
        const priorityOrder: PieceSymbol[] = ['Q', 'R', 'N', 'B', 'P', 'K'];
         for (const pType of priorityOrder) {
            const movesOfType = allLegalAiMoves.filter(m => !m.isCapture && m.piece.type === pType);
            if (movesOfType.length > 0) {
                moveToMake = movesOfType[Math.floor(Math.random() * movesOfType.length)];
                break;
            }
        }
        if (!moveToMake && allLegalAiMoves.length > 0) moveToMake = allLegalAiMoves[Math.floor(Math.random() * allLegalAiMoves.length)];
      }
    }

    if (moveToMake) {
      const { from, to, piece } = moveToMake;
      const newBoardAfterAIMove = currentBoardForAIMove.map(row => [...row]);
      let pieceToPlace = piece;
      let moveDescription = `AI moves ${piece.type} from (${String.fromCharCode(97 + from.col)}${8 - from.row}) to (${String.fromCharCode(97 + to.col)}${8 - to.row})`;

      if (newBoardAfterAIMove[to.row][to.col]) {
        moveDescription = `AI captures with ${piece.type} from (${String.fromCharCode(97 + from.col)}${8 - from.row}) on (${String.fromCharCode(97 + to.col)}${8 - to.row})`;
      }

      newBoardAfterAIMove[to.row][to.col] = null; 
      newBoardAfterAIMove[from.row][from.col] = null; 

      if (piece.type === 'P' && to.row === 7) { 
        pieceToPlace = createPiece('Q', 'black');
        moveDescription += ` and promotes to Queen`;
      }
      newBoardAfterAIMove[to.row][to.col] = pieceToPlace;

      setLastMove({ from, to });
      setMoveHistory(prev => [...prev, moveDescription]);
      setBoard(newBoardAfterAIMove);
      updateCheckStatus(newBoardAfterAIMove);

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
              const validPlayerMoves = getValidMovesForPiece(newBoardAfterAIMove, { row: r, col: c });
              for (const move of validPlayerMoves) {
                  const tempBoardForPlayer = newBoardAfterAIMove.map(row => row.slice());
                  tempBoardForPlayer[move.row][move.col] = playerPiece;
                  tempBoardForPlayer[r][c] = null;
                  if (!isKingInCheck(tempBoardForPlayer, 'white')) {
                      playerHasValidMoves = true;
                      break;
                  }
              }
            }
            if (playerHasValidMoves) break;
          }
          if (playerHasValidMoves) break;
        }
        if (!playerHasValidMoves) {
          setGamePhase('ended');
          if (isKingInCheck(newBoardAfterAIMove, 'white')) {
            setWinner('black');
            setEndReason("Checkmate! AI wins.");
            toast({ title: "Game Over - Checkmate!", description: "AI wins as player has no legal moves out of check.", duration: 5000 });
          } else {
            setWinner('draw');
            setEndReason("Stalemate! Player has no legal moves.");
            toast({ title: "Game Over - Draw!", description: "Player has no legal moves.", duration: 5000 });
          }
          setShowFeedbackButton(true);
          setActiveTimer(null);
        } else {
          setIsPlayerTurn(true);
          setActiveTimer('white');
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board, gamePhase, showPromotionDialog, aiDifficulty, isPlayerTurn, toast, updateCheckStatus]); 

  useEffect(() => {
    if (gamePhase !== 'playing') {
      setActiveTimer(null);
      return;
    }

    if (!isPlayerTurn && !showPromotionDialog) {
      const timer = setTimeout(() => {
        makeAiMove();
      }, 700); 
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
  }, [activeTimer, gamePhase, whiteTime, blackTime, toast]);


  const handlePieceDragStart = (event: React.DragEvent<HTMLButtonElement>, fromCoord: SquareCoord, piece: ChessPiece) => {
    if (piece.color !== 'white' || !isPlayerTurn || gamePhase !== 'playing' || showPromotionDialog) {
      event.preventDefault();
      return;
    }
    
    event.dataTransfer.setData('text/plain', `${fromCoord.row},${fromCoord.col}`);
    event.dataTransfer.effectAllowed = 'move';

    const validMoves = getValidMovesForPiece(board, fromCoord).filter(to => {
        const tempBoard = board.map(r => r.slice());
        tempBoard[to.row][to.col] = piece;
        tempBoard[fromCoord.row][fromCoord.col] = null;
        return !isKingInCheck(tempBoard, 'white');
    });
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

    // Simulate move to check if it leaves player's king in check
    const tempBoardForCheck = board.map(r => r.slice());
    tempBoardForCheck[toCoord.row][toCoord.col] = pieceToMove;
    tempBoardForCheck[fromCoord.row][fromCoord.col] = null;

    if (!isValidMove(board, fromCoord, toCoord, 'white') || isKingInCheck(tempBoardForCheck, 'white')) {
      toast({
        title: "Invalid Move",
        description: "This move is not allowed or would leave your King in check.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    const newBoard = board.map(row => [...row]);
    const targetPieceOnBoard = newBoard[toCoord.row][toCoord.col];

    newBoard[toCoord.row][toCoord.col] = pieceToMove;
    newBoard[fromCoord.row][fromCoord.col] = null;
    setBoard(newBoard);
    setLastMove({ from: fromCoord, to: toCoord });
    updateCheckStatus(newBoard);
    const capturedPieceSymbol = targetPieceOnBoard ? ` ${targetPieceOnBoard.type}` : "";
    const moveDescription = `Player moves ${pieceToMove.type} from (${String.fromCharCode(97 + fromCoord.col)}${8 - fromRow}) to (${String.fromCharCode(97 + toCoord.col)}${8 - toCoord.row})${capturedPieceSymbol ? " capturing" + capturedPieceSymbol : ""}`;
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
      setActiveTimer(null); 
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
    updateCheckStatus(newBoard);

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
    
    // Check if AI is checkmated or stalemated after promotion
    let aiHasValidMoves = false;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const aiPiece = newBoard[r][c];
            if (aiPiece && aiPiece.color === 'black') {
                const validAiMoves = getValidMovesForPiece(newBoard, {row: r, col: c});
                for (const move of validAiMoves) {
                    const tempBoardForAi = newBoard.map(row => row.slice());
                    tempBoardForAi[move.row][move.col] = aiPiece;
                    tempBoardForAi[r][c] = null;
                    if (!isKingInCheck(tempBoardForAi, 'black')) {
                        aiHasValidMoves = true;
                        break;
                    }
                }
            }
            if (aiHasValidMoves) break;
        }
        if (aiHasValidMoves) break;
    }

    if (!aiHasValidMoves) {
        setGamePhase('ended');
        if (isKingInCheck(newBoard, 'black')) {
            setWinner('white');
            setEndReason("Checkmate! Player wins.");
            toast({ title: "Game Over - Checkmate!", description: "Player wins after AI has no legal moves out of check.", duration: 5000 });
        } else {
            setWinner('draw');
            setEndReason("Stalemate! AI has no legal moves.");
            toast({ title: "Game Over - Draw!", description: "AI has no legal moves after player promotion.", duration: 5000 });
        }
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
    setKingInCheckCoord(null);
    setCheckMessage('');
    setWhiteTime(selectedTimeControl);
    setBlackTime(selectedTimeControl);
    setActiveTimer('white');
    setWinner(null);
    setEndReason('');
    setGamePhase('playing');
    updateCheckStatus(createInitialBoard());
  };

  const resetGame = () => {
    setGamePhase('setup');
    setBoard(createInitialBoard()); 
    setIsPlayerTurn(true);
    setMoveHistory([]);
    setShowFeedbackButton(false);
    setShowPromotionDialog(false);
    setPromotingSquare(null);
    setLastMove(null);
    setHighlightedMoves([]);
    setKingInCheckCoord(null);
    setCheckMessage('');
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
          const toSqAlgebraic = parts[parts.length - (move.includes("capturing") ? 3 : 1)].replace(/[()]/g, '');
          const fromSqAlgebraic = parts[parts.length - (move.includes("capturing") ? 5 : 3)].replace(/[()]/g, '');
          const action = move.toLowerCase().includes("capture") ? "x" : "";

          if (pieceType === "P") { 
            simpleNotation = action ? `${fromSqAlgebraic.charAt(0)}x${toSqAlgebraic}` : toSqAlgebraic;
          } else {
            simpleNotation = `${pieceType}${action}${toSqAlgebraic}`;
          }
          
          if (move.toLowerCase().includes("promotes to")) {
            const promotionParts = move.split(' ');
            const promotionIndex = promotionParts.indexOf("to");
            if (promotionIndex !== -1 && promotionIndex + 1 < promotionParts.length) {
                 simpleNotation = toSqAlgebraic + `=${promotionParts[promotionIndex+1].charAt(0).toUpperCase()}`;
            }
          }
           // Add '+' for check if applicable, '#' for checkmate will be harder here
          const tempBoard = board; // This is a simplification, PGN needs board state at time of move
          if (index % 2 === 0 && isKingInCheck(tempBoard, 'black')) simpleNotation += '+';
          if (index % 2 !== 0 && isKingInCheck(tempBoard, 'white')) simpleNotation += '+';

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
    if (checkMessage) return checkMessage;
    if (gamePhase === 'playing') {
      return isPlayerTurn ? (showPromotionDialog ? 'Promoting...' : 'Your Turn (White)') : "AI's Turn (Black)";
    }
    if (gamePhase === 'ended') {
      if (winner === 'white') return `You Win! ${endReason}`;
      if (winner === 'black') return `AI Wins! ${endReason}`;
      if (winner === 'draw') return `Draw! ${endReason}`;
      return 'Game Over';
    }
    return 'Setup Game'; 
  };


  return (
    <div className="space-y-8">
      <header className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-primary">Play Against Bot</h1>
        {gamePhase === 'setup' && <p className="text-lg text-muted-foreground">Configure your game and start playing!</p>}
        {gamePhase !== 'setup' && <p className="text-lg text-muted-foreground">Test your skills against our AI ({aiDifficulty} level).</p>}
      </header>

      {gamePhase === 'setup' && (
        <Card className="max-w-md mx-auto shadow-lg rounded-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Game Settings</CardTitle>
            <CardDescription className="text-center">Choose your time control and AI difficulty.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="space-y-2">
              <Label htmlFor="time-control" className="flex items-center text-sm font-medium"><TimerIcon className="mr-2 h-5 w-5 text-primary" />Time Control (per player)</Label>
              <Select value={String(selectedTimeControl)} onValueChange={(value) => setSelectedTimeControl(Number(value))}>
                <SelectTrigger id="time-control" className="w-full">
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
              <Label htmlFor="ai-difficulty" className="flex items-center text-sm font-medium"><CpuIcon className="mr-2 h-5 w-5 text-primary" />AI Difficulty</Label>
              <Select value={aiDifficulty} onValueChange={(value) => setAiDifficulty(value as DifficultyLevel)}>
                <SelectTrigger id="ai-difficulty" className="w-full">
                  <SelectValue placeholder="Select AI difficulty" />
                </SelectTrigger>
                <SelectContent>
                  {AI_DIFFICULTY_LEVELS.map(level => (
                    <SelectItem key={level} value={level}>{level}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={startGame} size="lg" className="w-full mt-4">
              <Play className="mr-2 h-5 w-5" /> Start Game
            </Button>
          </CardContent>
        </Card>
      )}

      {gamePhase !== 'setup' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-start">
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
                kingInCheckCoord={kingInCheckCoord}
              />
              {showPromotionDialog && promotingSquare && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10 rounded-md">
                  <Card className="p-4 shadow-2xl w-auto bg-background border-primary">
                    <CardHeader className="p-3 text-center">
                      <CardTitle className="text-xl">Promote Pawn</CardTitle>
                      <CardDescription className="text-sm">Choose a piece:</CardDescription>
                    </CardHeader>
                    <CardContent className="p-3 flex justify-center space-x-2 sm:space-x-3">
                      {(['Q', 'R', 'B', 'N'] as PieceSymbol[]).map(pType => (
                        <Button
                          key={pType}
                          onClick={() => handlePromotionChoice(pType)}
                          variant="outline"
                          className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center hover:bg-accent focus:bg-accent text-3xl"
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
              <Card className="shadow-md rounded-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl">Game Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between items-center text-base">
                     <span className={cn("font-semibold", activeTimer === 'white' && isPlayerTurn && "text-primary animate-pulse")}>You: {formatTime(whiteTime)}</span>
                     <span className={cn("font-semibold", activeTimer === 'black' && !isPlayerTurn && "text-primary animate-pulse")}>AI: {formatTime(blackTime)}</span>
                  </div>
                   {checkMessage && (
                    <p className="flex items-center text-destructive font-semibold">
                      <AlertTriangleIcon className="mr-2 h-4 w-4 shrink-0" /> {checkMessage}
                    </p>
                  )}
                  <p className="flex items-center">
                    <Info className="mr-2 h-4 w-4 text-blue-500 shrink-0" />
                    <span className="font-medium mr-1">Status:</span> <span className="text-muted-foreground">{getGameStatusMessage()}</span>
                  </p>
                  <p className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-green-500 shrink-0" />
                    <span className="font-medium mr-1">Turn:</span> <span className="text-muted-foreground">
                      {gamePhase === 'ended' ? 'Game Over' : (isPlayerTurn && !showPromotionDialog ? 'Your (White)' : (!isPlayerTurn && !showPromotionDialog ? 'AI (Black)' : 'Promoting...'))}
                    </span>
                  </p>
                   <p className="flex items-center">
                    <BarChart3 className="mr-2 h-4 w-4 text-gray-500 shrink-0" />
                     <span className="font-medium mr-1">AI Level:</span> <span className="text-muted-foreground">{aiDifficulty}</span>
                  </p>
                  <Button onClick={resetGame} variant="outline" className="w-full mt-2">
                    <RotateCcw className="mr-2 h-4 w-4" /> {gamePhase === 'ended' ? 'New Game Settings' : 'Reset Current Game'}
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-md rounded-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl flex items-center"><Settings className="mr-2 h-5 w-5 text-gray-600" />Display</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="space-y-1">
                    <Label htmlFor="piece-style">Piece Style</Label>
                    <Select value={pieceStyle} onValueChange={(value) => setPieceStyle(value as PieceStyle)}>
                      <SelectTrigger id="piece-style" className="w-full">
                        <SelectValue placeholder="Select piece style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unicode">Unicode</SelectItem>
                        <SelectItem value="graphical">Graphical (Basic)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="board-theme">Board Theme</Label>
                    <Select value={boardTheme} onValueChange={(value) => setBoardTheme(value as BoardTheme)}>
                      <SelectTrigger id="board-theme" className="w-full">
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
            <Card className="mt-8 rounded-lg">
              <CardHeader><CardTitle>Move History</CardTitle></CardHeader>
              <CardContent>
                <ol className="list-decimal list-inside space-y-1 max-h-48 overflow-y-auto text-sm text-muted-foreground pl-2">
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


'use client';

import { useState, useEffect, useCallback } from 'react';
import { Chessboard } from '@/components/chess/chessboard';
import type { BoardState, SquareCoord, ChessPiece, PieceSymbol, PieceStyle, BoardTheme, PieceColor } from '@/components/chess/types';
import { createInitialBoard, createPiece } from '@/lib/constants';
import { isValidMove, getValidMovesForPiece, isKingInCheck, findKing } from '@/lib/chess-logic';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RotateCcw, Info, Check, Settings, Users, AlertTriangleIcon } from 'lucide-react';
import { Piece } from '@/components/chess/piece';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function PlayLocalPage() {
  const [board, setBoard] = useState<BoardState>(createInitialBoard());
  const [currentPlayer, setCurrentPlayer] = useState<PieceColor>('white');
  const [gameStatus, setGameStatus] = useState<'ongoing' | 'white_win' | 'black_win' | 'draw'>('ongoing');
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  
  const [promotingSquare, setPromotingSquare] = useState<SquareCoord | null>(null);
  const [promotionColor, setPromotionColor] = useState<PieceColor | null>(null);
  const [showPromotionDialog, setShowPromotionDialog] = useState(false);

  const [pieceStyle, setPieceStyle] = useState<PieceStyle>('unicode');
  const [boardTheme, setBoardTheme] = useState<BoardTheme>('default');
  const { toast } = useToast();

  const [lastMove, setLastMove] = useState<{ from: SquareCoord, to: SquareCoord } | null>(null);
  const [highlightedMoves, setHighlightedMoves] = useState<SquareCoord[]>([]);
  const [kingInCheckCoord, setKingInCheckCoord] = useState<SquareCoord | null>(null);
  const [checkMessage, setCheckMessage] = useState<string>('');


  const updateCheckStatus = useCallback((currentBoard: BoardState, playerWhoseTurnItIs: PieceColor) => {
    const kingPos = findKing(currentBoard, playerWhoseTurnItIs);
    let newCheckMessage = '';
    let newKingInCheckCoord: SquareCoord | null = null;

    if (kingPos && isKingInCheck(currentBoard, playerWhoseTurnItIs)) {
      newCheckMessage = `${playerWhoseTurnItIs.charAt(0).toUpperCase() + playerWhoseTurnItIs.slice(1)} is in Check!`;
      newKingInCheckCoord = kingPos;
      toast({ title: "Check!", description: `${playerWhoseTurnItIs.charAt(0).toUpperCase() + playerWhoseTurnItIs.slice(1)}'s King is in check!`, variant: "destructive", duration: 3000 });
    }
    setCheckMessage(newCheckMessage);
    setKingInCheckCoord(newKingInCheckCoord);
  }, [toast]);

  useEffect(() => {
    // Initial check status on game start/reset
    updateCheckStatus(board, currentPlayer);
  }, [board, currentPlayer, updateCheckStatus]);


  const handlePieceDragStart = (event: React.DragEvent<HTMLButtonElement>, fromCoord: SquareCoord, piece: ChessPiece) => {
    if (piece.color !== currentPlayer || gameStatus !== 'ongoing' || showPromotionDialog) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.setData('text/plain', `${fromCoord.row},${fromCoord.col}`);
    event.dataTransfer.effectAllowed = 'move';

    const validMoves = getValidMovesForPiece(board, fromCoord).filter(to => {
        const tempBoard = board.map(r => r.slice());
        tempBoard[to.row][to.col] = piece;
        tempBoard[fromCoord.row][fromCoord.col] = null;
        return !isKingInCheck(tempBoard, piece.color); // Prevent moves into self-check
    });
    setHighlightedMoves(validMoves);
  };

  const handleDragEnd = () => {
    setHighlightedMoves([]);
  };

  const handleSquareDrop = (event: React.DragEvent<HTMLButtonElement>, toCoord: SquareCoord) => {
    event.preventDefault();
    setHighlightedMoves([]);
    if (gameStatus !== 'ongoing' || showPromotionDialog) {
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

    if (!pieceToMove || pieceToMove.color !== currentPlayer) {
      console.error("No piece at source or not current player's piece:", fromCoord, pieceToMove, currentPlayer);
      return;
    }

    if (fromCoord.row === toCoord.row && fromCoord.col === toCoord.col) {
      return; 
    }
    
    const tempBoardForCheck = board.map(r => r.slice());
    tempBoardForCheck[toCoord.row][toCoord.col] = pieceToMove;
    tempBoardForCheck[fromCoord.row][fromCoord.col] = null;

    if (!isValidMove(board, fromCoord, toCoord, currentPlayer) || isKingInCheck(tempBoardForCheck, currentPlayer)) {
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
    
    setLastMove({ from: fromCoord, to: toCoord });
    const capturedPieceSymbol = targetPieceOnBoard ? ` ${targetPieceOnBoard.type}` : "";
    const moveDescription = `${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)} moves ${pieceToMove.type} from (${String.fromCharCode(97 + fromCoord.col)}${8 - fromRow}) to (${String.fromCharCode(97 + toCoord.col)}${8 - toCoord.row})${capturedPieceSymbol ? " capturing" + capturedPieceSymbol : ""}`;
    setMoveHistory(prev => [...prev, moveDescription]);

    if (targetPieceOnBoard && targetPieceOnBoard.type === 'K') {
      setGameStatus(currentPlayer === 'white' ? 'white_win' : 'black_win');
      toast({ title: "Game Over!", description: `${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)} wins by capturing the King!`, duration: 5000});
      setBoard(newBoard); // Update board before returning
      updateCheckStatus(newBoard, currentPlayer === 'white' ? 'black' : 'white');
      return;
    }

    if (pieceToMove.type === 'P') {
      if (currentPlayer === 'white' && toCoord.row === 0) {
        setPromotingSquare(toCoord);
        setPromotionColor('white');
        setShowPromotionDialog(true);
        setBoard(newBoard); // Update board before showing dialog
        updateCheckStatus(newBoard, 'black'); // Check status for opponent
        return; 
      } else if (currentPlayer === 'black' && toCoord.row === 7) {
        setPromotingSquare(toCoord);
        setPromotionColor('black');
        setShowPromotionDialog(true);
        setBoard(newBoard); // Update board before showing dialog
        updateCheckStatus(newBoard, 'white'); // Check status for opponent
        return; 
      }
    }
    
    const nextPlayerColor = currentPlayer === 'white' ? 'black' : 'white';
    setBoard(newBoard); // Update board state here for the move
    updateCheckStatus(newBoard, nextPlayerColor); // Check status for next player

    let hasValidMovesForNextPlayer = false;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = newBoard[r][c];
        if (piece && piece.color === nextPlayerColor) {
          const validPlayerMoves = getValidMovesForPiece(newBoard, {row: r, col: c});
          for(const move of validPlayerMoves) {
            const tempBoardForNextPlayer = newBoard.map(row => row.slice());
            tempBoardForNextPlayer[move.row][move.col] = piece;
            tempBoardForNextPlayer[r][c] = null;
            if (!isKingInCheck(tempBoardForNextPlayer, nextPlayerColor)) {
                hasValidMovesForNextPlayer = true;
                break;
            }
          }
        }
        if (hasValidMovesForNextPlayer) break;
      }
      if (hasValidMovesForNextPlayer) break;
    }

    if (!hasValidMovesForNextPlayer) {
        if (isKingInCheck(newBoard, nextPlayerColor)) {
            setGameStatus(currentPlayer === 'white' ? 'white_win' : 'black_win');
            toast({ title: "Game Over - Checkmate!", description: `${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)} wins!`, duration: 5000});
        } else {
            setGameStatus('draw');
            toast({ title: "Game Over - Draw!", description: `Stalemate! No legal moves for ${nextPlayerColor}.`, duration: 5000});
        }
        return;
    }
    
    setCurrentPlayer(nextPlayerColor);
  };

  const handlePromotionChoice = (promotionPieceType: PieceSymbol) => {
    if (!promotingSquare || !promotionColor) return;

    const boardAfterPromotion = board.map(row => [...row]); // Use current board state
    boardAfterPromotion[promotingSquare.row][promotingSquare.col] = createPiece(promotionPieceType, promotionColor);
    
    setMoveHistory(prev => [...prev, `${promotionColor.charAt(0).toUpperCase() + promotionColor.slice(1)} promotes pawn to ${promotionPieceType} at (${String.fromCharCode(97+promotingSquare.col)}${8-promotingSquare.row})`]);
    setShowPromotionDialog(false);
    
    const opponentColor = promotionColor === 'white' ? 'black' : 'white';
    setBoard(boardAfterPromotion); // Update board state
    updateCheckStatus(boardAfterPromotion, opponentColor); // Check opponent after promotion

    let kingFoundCheck = false;
    boardAfterPromotion.forEach(row => row.forEach(p => {
      if (p && p.type === 'K' && p.color === opponentColor) kingFoundCheck = true;
    }));

    if (!kingFoundCheck) { // Should ideally not happen if king capture ends game
      setGameStatus(promotionColor === 'white' ? 'white_win' : 'black_win');
      toast({ title: "Game Over!", description: `${promotionColor.charAt(0).toUpperCase() + promotionColor.slice(1)} wins! (Opponent King missing)`, duration: 5000});
      setPromotingSquare(null);
      setPromotionColor(null);
      return;
    }

    let hasValidMovesForOpponent = false;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = boardAfterPromotion[r][c];
        if (piece && piece.color === opponentColor) {
          const validOpponentMoves = getValidMovesForPiece(boardAfterPromotion, {row: r, col: c});
           for(const move of validOpponentMoves) {
            const tempBoardForOpponent = boardAfterPromotion.map(row => row.slice());
            tempBoardForOpponent[move.row][move.col] = piece;
            tempBoardForOpponent[r][c] = null;
            if (!isKingInCheck(tempBoardForOpponent, opponentColor)) {
                hasValidMovesForOpponent = true;
                break;
            }
          }
        }
        if (hasValidMovesForOpponent) break;
      }
      if (hasValidMovesForOpponent) break;
    }

     if (!hasValidMovesForOpponent) {
        if(isKingInCheck(boardAfterPromotion, opponentColor)) {
            setGameStatus(promotionColor === 'white' ? 'white_win' : 'black_win');
            toast({ title: "Game Over - Checkmate!", description: `${promotionColor.charAt(0).toUpperCase() + promotionColor.slice(1)} wins!`, duration: 5000});
        } else {
            setGameStatus('draw');
            toast({ title: "Game Over - Draw!", description: `Stalemate! No legal moves for ${opponentColor} after promotion.`, duration: 5000});
        }
        setPromotingSquare(null);
        setPromotionColor(null);
        return;
    }
    
    setCurrentPlayer(opponentColor);
    setPromotingSquare(null);
    setPromotionColor(null);
  };

  const resetGame = () => {
    const initialBoard = createInitialBoard();
    setBoard(initialBoard);
    setCurrentPlayer('white');
    setGameStatus('ongoing');
    setMoveHistory([]);
    setShowPromotionDialog(false);
    setPromotingSquare(null);
    setPromotionColor(null);
    setLastMove(null);
    setHighlightedMoves([]);
    setKingInCheckCoord(null);
    setCheckMessage('');
    updateCheckStatus(initialBoard, 'white');
  };

  const getGameStatusText = () => {
    if (checkMessage && gameStatus === 'ongoing') return checkMessage;
    switch (gameStatus) {
      case 'white_win': return 'White Wins!';
      case 'black_win': return 'Black Wins!';
      case 'draw': return 'Draw!';
      case 'ongoing': 
        return showPromotionDialog ? 'Promoting...' : `${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)}'s Turn`;
      default: return 'Game Over';
    }
  };

  return (
    <div className="space-y-8">
      <header className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-primary flex items-center justify-center">
          <Users className="mr-3 h-10 w-10" /> Local Multiplayer
        </h1>
        <p className="text-lg text-muted-foreground">
          Two players, one board. Take turns making your moves.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        <div className="md:col-span-2 relative">
          <Chessboard
            boardState={board}
            disabled={gameStatus !== 'ongoing' || showPromotionDialog}
            pieceStyle={pieceStyle}
            boardTheme={boardTheme}
            onPieceDragStart={handlePieceDragStart}
            onSquareDrop={handleSquareDrop}
            onDragEndCapture={handleDragEnd}
            isWhiteView={true} 
            currentPlayerColor={currentPlayer}
            lastMove={lastMove}
            highlightedMoves={highlightedMoves}
            kingInCheckCoord={kingInCheckCoord}
          />
           {showPromotionDialog && promotingSquare && promotionColor && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 rounded-md">
              <Card className="p-4 shadow-2xl w-auto bg-card">
                <CardHeader className="p-3 text-center">
                  <CardTitle className="text-xl">{promotionColor.charAt(0).toUpperCase() + promotionColor.slice(1)} Promotes Pawn</CardTitle>
                  <CardDescription className="text-sm">Choose a piece:</CardDescription>
                </CardHeader>
                <CardContent className="p-3 flex justify-center space-x-2">
                  {(['Q', 'R', 'B', 'N'] as PieceSymbol[]).map(pType => (
                    <Button
                      key={pType}
                      onClick={() => handlePromotionChoice(pType)}
                      variant="outline"
                      className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center hover:bg-accent focus:bg-accent text-3xl"
                      aria-label={`Promote to ${pType}`}
                    >
                      <Piece piece={createPiece(pType, promotionColor)} pieceStyle={pieceStyle} />
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
             {checkMessage && gameStatus === 'ongoing' && (
                <p className="flex items-center text-destructive font-semibold">
                  <AlertTriangleIcon className="mr-2 h-5 w-5 shrink-0" /> {checkMessage}
                </p>
              )}
              <p className="flex items-center">
                <Info className="mr-2 h-5 w-5 text-blue-500" />
                Status: <span className="font-semibold ml-1">{getGameStatusText()}</span>
              </p>
              <p className="flex items-center">
                <Check className="mr-2 h-5 w-5 text-green-500" />
                Turn: <span className="font-semibold ml-1">
                  {gameStatus === 'ongoing' ? (showPromotionDialog ? 'Promoting...' : (currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1))) : 'Game Over'}
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


'use client';

import { useState, useEffect } from 'react';
import { Chessboard } from '@/components/chess/chessboard';
import { AiFeedbackSection } from '@/components/ai/ai-feedback-section';
import type { BoardState, SquareCoord, ChessPiece, PieceSymbol, PieceStyle, BoardTheme } from '@/components/chess/types';
import { createInitialBoard, createPiece } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RotateCcw, Info, Check, Settings } from 'lucide-react';
import { Piece } from '@/components/chess/piece';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export default function PlayPage() {
  const [board, setBoard] = useState<BoardState>(createInitialBoard());
  const [isPlayerTurn, setIsPlayerTurn] = useState(true); // Player is White
  const [gameStatus, setGameStatus] = useState<'ongoing' | 'player_win' | 'ai_win' | 'draw'>('ongoing');
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [showFeedbackButton, setShowFeedbackButton] = useState(false);

  const [promotingSquare, setPromotingSquare] = useState<SquareCoord | null>(null);
  const [showPromotionDialog, setShowPromotionDialog] = useState(false);

  const [pieceStyle, setPieceStyle] = useState<PieceStyle>('unicode');
  const [boardTheme, setBoardTheme] = useState<BoardTheme>('default');

  const makeAiMove = () => {
    if (gameStatus !== 'ongoing') return;

    const currentBoard = board.map(row => [...row]); 
    let moved = false;

    // AI is black. Priority: 1. Pawn Capture, 2. Other Piece Adjacent Capture, 3. Pawn Push, 4. Random Other Piece Move
    // 1. Prioritize Pawn Captures
    if (!moved) {
      const pawnCaptures: { r: number, c: number, targetR: number, targetC: number, piece: ChessPiece }[] = [];
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const piece = currentBoard[r][c];
          if (piece && piece.color === 'black' && piece.type === 'P') {
            const captureOffsets = [{ dr: 1, dc: -1 }, { dr: 1, dc: 1 }];
            for (const offset of captureOffsets) {
              const targetR = r + offset.dr;
              const targetC = c + offset.dc;
              if (targetR >= 0 && targetR < 8 && targetC >= 0 && targetC < 8) {
                const targetPiece = currentBoard[targetR][targetC];
                if (targetPiece && targetPiece.color === 'white') {
                  pawnCaptures.push({ r, c, targetR, targetC, piece });
                }
              }
            }
          }
        }
      }
      if (pawnCaptures.length > 0) {
        const captureToMake = pawnCaptures[Math.floor(Math.random() * pawnCaptures.length)];
        currentBoard[captureToMake.targetR][captureToMake.targetC] = captureToMake.piece;
        currentBoard[captureToMake.r][captureToMake.c] = null;
        moved = true;
        setMoveHistory(prev => [...prev, `AI captures with ${captureToMake.piece.type} from (${captureToMake.r},${captureToMake.c}) to (${captureToMake.targetR},${captureToMake.targetC})`]);
        if (captureToMake.piece.type === 'P' && captureToMake.targetR === 7) {
          currentBoard[captureToMake.targetR][captureToMake.targetC] = createPiece('Q', 'black'); 
          setMoveHistory(prev => [...prev, `AI promotes pawn to Q at (${captureToMake.targetR},${captureToMake.targetC})`]);
        }
      }
    }
    
    // 2. Prioritize Other Piece Adjacent Captures (Simplified)
    if (!moved) {
      const otherPieceCaptures: { r: number, c: number, targetR: number, targetC: number, piece: ChessPiece }[] = [];
      const blackPieces: { piece: ChessPiece, r: number, c: number }[] = [];
      currentBoard.forEach((row, r_idx) => row.forEach((p, c_idx) => {
        if (p && p.color === 'black' && p.type !== 'P') blackPieces.push({ piece: p, r: r_idx, c: c_idx });
      }));

      for (const bp of blackPieces) {
        const { piece, r, c } = bp;
        const adjacentOffsets = [[-1,0], [1,0], [0,-1], [0,1], [-1,-1], [-1,1], [1,-1], [1,1]];
        for (const [dr, dc] of adjacentOffsets) {
          const targetR = r + dr;
          const targetC = c + dc;
          if (targetR >= 0 && targetR < 8 && targetC >= 0 && targetC < 8) {
            const targetPiece = currentBoard[targetR][targetC];
            if (targetPiece && targetPiece.color === 'white') {
              otherPieceCaptures.push({ r, c, targetR, targetC, piece });
            }
          }
        }
      }
      if (otherPieceCaptures.length > 0) {
        const captureToMake = otherPieceCaptures[Math.floor(Math.random() * otherPieceCaptures.length)];
        currentBoard[captureToMake.targetR][captureToMake.targetC] = captureToMake.piece;
        currentBoard[captureToMake.r][captureToMake.c] = null;
        moved = true;
        setMoveHistory(prev => [...prev, `AI captures with ${captureToMake.piece.type} from (${captureToMake.r},${captureToMake.c}) to (${captureToMake.targetR},${captureToMake.targetC})`]);
      }
    }

    // 3. Fall back to Pawn Push
    if (!moved) {
      const pawnPushes: { r: number, c: number, targetR: number, targetC: number, piece: ChessPiece }[] = [];
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const piece = currentBoard[r][c];
          if (piece && piece.color === 'black' && piece.type === 'P') {
            if (r + 1 < 8 && !currentBoard[r+1][c]) {
              pawnPushes.push({ r, c, targetR: r + 1, targetC: c, piece });
            }
            if (r === 1 && !currentBoard[r+1][c] && !currentBoard[r+2][c]) { 
                 pawnPushes.push({ r, c, targetR: r + 2, targetC: c, piece });
            }
          }
        }
      }
      if (pawnPushes.length > 0) {
        const pushToMake = pawnPushes[Math.floor(Math.random() * pawnPushes.length)];
        currentBoard[pushToMake.targetR][pushToMake.targetC] = pushToMake.piece;
        currentBoard[pushToMake.r][pushToMake.c] = null;
        moved = true;
        setMoveHistory(prev => [...prev, `AI moves ${pushToMake.piece.type} from (${pushToMake.r},${pushToMake.c}) to (${pushToMake.targetR},${pushToMake.targetC})`]);
        if (pushToMake.piece.type === 'P' && pushToMake.targetR === 7) {
          currentBoard[pushToMake.targetR][pushToMake.targetC] = createPiece('Q', 'black'); 
          setMoveHistory(prev => [...prev, `AI promotes pawn to Q at (${pushToMake.targetR},${pushToMake.targetC})`]);
        }
      }
    }
    
    // 4. Fall back to Random Adjacent Move (Non-Pawn to Empty Square)
    if (!moved) {
      const blackPieces: {piece: ChessPiece, r: number, c: number}[] = [];
      currentBoard.forEach((row, r_idx) => row.forEach((p, c_idx) => {
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
            if (targetR >=0 && targetR < 8 && targetC >=0 && targetC < 8 && !currentBoard[targetR][targetC]) {
              currentBoard[targetR][targetC] = piece;
              currentBoard[r][c] = null;
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
      setBoard(currentBoard);
      let playerKingFound = false;
      currentBoard.forEach(row => row.forEach(p => {
        if (p && p.type === 'K' && p.color === 'white') playerKingFound = true;
      }));
      if (!playerKingFound) {
        setGameStatus('ai_win');
        setShowFeedbackButton(true);
      }
      setIsPlayerTurn(true); 
    } else {
      let aiHasPieces = false;
      currentBoard.forEach(row => row.forEach(p => { if (p && p.color === 'black') aiHasPieces = true; }));
      
      if (!aiHasPieces) { // AI has no pieces left
        setGameStatus('player_win');
      } else {  // AI has pieces but cannot move (stalemate from AI perspective)
        setGameStatus('draw'); 
      }
      setShowFeedbackButton(true);
      setIsPlayerTurn(true); // It should still be player's turn to see game over state or AI unable to move
    }
  };

  const handlePieceDragStart = (event: React.DragEvent<HTMLButtonElement>, fromCoord: SquareCoord, piece: ChessPiece) => {
    if (piece.color !== 'white' || !isPlayerTurn || gameStatus !== 'ongoing' || showPromotionDialog) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.setData('application/json', JSON.stringify({ fromRow: fromCoord.row, fromCol: fromCoord.col }));
    event.dataTransfer.effectAllowed = 'move';

    // Temporarily commented out custom drag image logic for debugging
    /*
    const pieceRenderedElement = event.currentTarget.firstChild as HTMLElement; 

    if (pieceRenderedElement) {
      const clonedPieceElement = pieceRenderedElement.cloneNode(true) as HTMLElement;
      
      clonedPieceElement.style.position = "absolute";
      clonedPieceElement.style.left = "-9999px"; 
      clonedPieceElement.style.pointerEvents = "none";
      clonedPieceElement.style.width = "48px"; 
      clonedPieceElement.style.height = "48px"; 
      clonedPieceElement.style.display = "flex";
      clonedPieceElement.style.alignItems = "center";
      clonedPieceElement.style.justifyContent = "center";
      clonedPieceElement.style.boxSizing = "border-box"; 

      if (pieceRenderedElement.tagName.toLowerCase() === 'span' && pieceStyle === 'unicode') {
         clonedPieceElement.style.fontSize = "40px"; 
         clonedPieceElement.style.lineHeight = "48px";
      }
      
      document.body.appendChild(clonedPieceElement); 

      const rect = clonedPieceElement.getBoundingClientRect(); 
      const offsetX = rect.width / 2;
      const offsetY = rect.height / 2;
      
      event.dataTransfer.setDragImage(clonedPieceElement, offsetX, offsetY);
      
      setTimeout(() => {
        if (document.body.contains(clonedPieceElement)) {
            document.body.removeChild(clonedPieceElement);
        }
      }, 0);
    }
    */
  };

  const handleSquareDrop = (event: React.DragEvent<HTMLButtonElement>, toCoord: SquareCoord) => {
    event.preventDefault(); 
    if (!isPlayerTurn || gameStatus !== 'ongoing' || showPromotionDialog) {
      return;
    }

    const transferData = event.dataTransfer.getData('application/json');
    if (!transferData) return;

    const { fromRow, fromCol } = JSON.parse(transferData) as { fromRow: number; fromCol: number };
    const fromCoord = { row: fromRow, col: fromCol };

    const pieceToMove = board[fromCoord.row][fromCoord.col];

    if (!pieceToMove || pieceToMove.color !== 'white') {
      return; 
    }

    if (fromCoord.row === toCoord.row && fromCoord.col === toCoord.col) {
      return; 
    }

    const newBoard = board.map(row => [...row]);
    const targetPieceOnBoard = newBoard[toCoord.row][toCoord.col];

    if (targetPieceOnBoard && targetPieceOnBoard.color === 'white') {
      return; 
    }
    
    newBoard[toCoord.row][toCoord.col] = pieceToMove;
    newBoard[fromCoord.row][fromCoord.col] = null;
    setBoard(newBoard);
    setMoveHistory(prev => [...prev, `Player moves ${pieceToMove.type} from (${fromCoord.row},${fromCoord.col}) to (${toCoord.row},${toCoord.col})`]);
    
    if (targetPieceOnBoard && targetPieceOnBoard.type === 'K' && targetPieceOnBoard.color === 'black') {
        setGameStatus('player_win');
        setShowFeedbackButton(true);
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
    setMoveHistory(prev => [...prev, `Player promotes pawn to ${promotionPieceType} at (${promotingSquare.row},${promotingSquare.col})`]);

    setShowPromotionDialog(false);
    setPromotingSquare(null);

    let aiKingFound = false;
    newBoard.forEach(row => row.forEach(p => {
        if (p && p.type === 'K' && p.color === 'black') aiKingFound = true;
    }));
    if (!aiKingFound) { 
        setGameStatus('player_win');
        setShowFeedbackButton(true);
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
    if(moveHistory.length === 0) return "1. e4 e5 *";
    return moveHistory
      .map((move, index) => {
        const parts = move.split(' '); 
        let notation = "??"; 
        if (parts.length > 4 && (parts.includes("moves") || parts.includes("captures"))) {
            const pieceType = parts.includes("with") ? parts[3] : parts[2];
            const toSq = parts[parts.length -1]; 
            const fromSq = parts[parts.length -3]; 
            
            const toColNotation = String.fromCharCode(97 + parseInt(toSq.substring(toSq.indexOf(',') + 1, toSq.indexOf(')'))));
            const toRowNotation = 8 - parseInt(toSq.substring(1, toSq.indexOf(',')));
            const fromColNotation = String.fromCharCode(97 + parseInt(fromSq.substring(fromSq.indexOf(',') + 1, fromSq.indexOf(')'))));
            
            const action = move.toLowerCase().includes("capture") ? "x" : "";
            
            if (pieceType === "P") {
                notation = action ? `${fromColNotation}x${toColNotation}${toRowNotation}` : `${toColNotation}${toRowNotation}`;
            } else {
                notation = `${pieceType}${action}${toColNotation}${toRowNotation}`;
            }
        } else if (move.toLowerCase().includes("promotes")) {
            const toSq = parts[parts.length -1];
            const toColNotation = String.fromCharCode(97 + parseInt(toSq.substring(toSq.indexOf(',') + 1, toSq.indexOf(')'))));
            const toRowNotation = 8 - parseInt(toSq.substring(1, toSq.indexOf(',')));
            const promotedPiece = parts[parts.length -3];
            notation = `${toColNotation}${toRowNotation}=${promotedPiece}`;
        }

        if(index % 2 === 0) return `${Math.floor(index/2) + 1}. ${notation}`; 
        return `${notation}`; 
      })
      .reduce((acc, part, index) => {
        if(index === 0 && !part.startsWith("1.")) return `1. ${part}`;
        if (index > 0 && part.match(/^\d+\./)) return `${acc} ${part}`; 
        return `${acc}${part.startsWith(" ") ? "" : " "}${part}`; 
      }, "").trim() + (gameStatus === 'player_win' ? " 1-0" : gameStatus === 'ai_win' ? " 0-1" : gameStatus === 'draw' ? " 1/2-1/2" : " *");
  };


  return (
    <div className="space-y-8">
      <header className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-primary">Play Against AI</h1>
        <p className="text-lg text-muted-foreground">
          Test your skills in a match against our AI opponent. Drag and drop your pieces to move.
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
            isPlayerTurn={isPlayerTurn} // This prop isn't strictly used by Chessboard anymore but good for context
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
                Status: <span className="font-semibold ml-1 capitalize">{gameStatus.replace('_', ' ')}</span>
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
              playerRating={1200} 
              opponentRating={1150} 
              userName="Player1"
            />
          )}
           {gameStatus === 'ongoing' && moveHistory.length > 5 && !showFeedbackButton && (
            <Button onClick={() => {
              // Placeholder for future mid-game feedback request
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
    

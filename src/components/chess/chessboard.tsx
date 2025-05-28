
'use client';

import type { BoardState, SquareCoord, PieceStyle, BoardTheme, ChessPiece, PieceColor, ChessboardProps } from './types';
import { Piece } from './piece';
import { cn } from '@/lib/utils';

export function Chessboard({
  boardState,
  isWhiteView = true,
  disabled = false,
  pieceStyle = 'unicode',
  boardTheme = 'default',
  onPieceDragStart,
  onSquareDrop,
  onDragEndCapture,
  currentPlayerColor,
  lastMove,
  highlightedMoves = [],
  kingInCheckCoord,
}: ChessboardProps) {

  const getSquareColors = (isDark: boolean): string => {
    switch (boardTheme) {
      case 'green':
        return isDark ? 'bg-green-700 hover:bg-green-800/80' : 'bg-green-200 hover:bg-green-300/80';
      case 'blue':
        return isDark ? 'bg-blue-700 hover:bg-blue-800/80' : 'bg-blue-200 hover:bg-blue-300/80';
      case 'brown':
        return isDark ? 'bg-yellow-700 hover:bg-yellow-800/80' : 'bg-yellow-200 hover:bg-yellow-300/80';
      case 'default':
      default:
        return isDark ? 'bg-primary/70 hover:bg-primary/80' : 'bg-secondary hover:bg-secondary/80';
    }
  };

  const renderSquare = (row: number, col: number) => {
    const piece = boardState[row][col];
    const coord = { row, col };
    
    const isDark = (row + col) % 2 !== 0;    
    
    let isPotentiallyPlayerPiece = false;
    if (piece) {
      if (currentPlayerColor) {
        isPotentiallyPlayerPiece = piece.color === currentPlayerColor;
      } else { // Fallback mainly for bot game where player is always white
        isPotentiallyPlayerPiece = piece.color === 'white';
      }
    }
    
    const isDraggable = isPotentiallyPlayerPiece && !disabled;

    // Highlighting logic
    const isLastMoveFrom = lastMove && lastMove.from.row === row && lastMove.from.col === col;
    const isLastMoveTo = lastMove && lastMove.to.row === row && lastMove.to.col === col;
    const isHighlightedAsPossibleMove = highlightedMoves.some(m => m.row === row && m.col === col);
    const isKingSquareInCheck = kingInCheckCoord && kingInCheckCoord.row === row && kingInCheckCoord.col === col;

    let highlightClass = '';
    if (isKingSquareInCheck) {
      highlightClass = 'bg-red-500/70 dark:bg-red-700/70 ring-2 ring-red-600 animate-pulse';
    } else if (isLastMoveFrom || isLastMoveTo) {
      highlightClass = 'bg-yellow-400/60 dark:bg-yellow-600/60 ring-1 ring-yellow-500';
    } else if (isHighlightedAsPossibleMove) {
      const targetPiece = boardState[row][col];
      if (targetPiece && currentPlayerColor && targetPiece.color !== currentPlayerColor) { // It's a capture
        highlightClass = 'bg-red-500/40 dark:bg-red-700/40 ring-2 ring-red-600';
      } else { // Move to empty square
         highlightClass = 'relative after:content-[""] after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:w-3 after:h-3 after:bg-green-500/70 dark:after:bg-green-400/70 after:rounded-full';
      }
    }

    return (
      <button
        key={`${row}-${col}`}
        className={cn(
          'w-full aspect-square flex items-center justify-center transition-colors duration-150 focus:outline-none',
          getSquareColors(isDark),
          highlightClass,
          disabled && !isDraggable && 'cursor-not-allowed opacity-70',
          piece && !isDraggable && 'cursor-default', // Not current player's piece or board disabled for piece
        )}
        onDragStart={(e) => {
          if (isDraggable && onPieceDragStart && piece) {
            onPieceDragStart(e, coord, piece);
          } else {
            e.preventDefault(); 
          }
        }}
        onDragOver={(e) => {
          if (!disabled) { // Allow drop if the board itself is not disabled
            e.preventDefault(); 
            e.dataTransfer.dropEffect = "move";
          }
        }}
        onDrop={(e) => {
          e.preventDefault(); 
          if (!disabled && onSquareDrop) { // Only process drop if board not disabled
            onSquareDrop(e, coord);
          }
        }}
        onDragEndCapture={() => { // This helps clear highlights if drag is cancelled (e.g. dropped outside board)
          if (onDragEndCapture) {
            onDragEndCapture();
          }
        }}
        draggable={isDraggable}
        disabled={disabled && !isDraggable && (!piece || piece.color === 'black' && currentPlayerColor === 'white')}
        aria-label={`Square ${String.fromCharCode(97 + col)}${8 - row}${piece ? `, ${piece.color} ${piece.type}` : ''}`}
      >
        <Piece piece={piece} pieceStyle={pieceStyle} />
      </button>
    );
  };

  const rowsToRender = Array.from({ length: 8 }, (_, i) => isWhiteView ? i : 7 - i);
  const colsToRender = Array.from({ length: 8 }, (_, i) => isWhiteView ? i : 7 - i);

  return (
    <div className={cn(
        "grid grid-cols-8 w-full max-w-md md:max-w-lg aspect-square border-4 shadow-2xl rounded overflow-hidden",
        boardTheme === 'default' ? 'border-card bg-background' : 
        boardTheme === 'green' ? 'border-green-900 bg-green-100' :
        boardTheme === 'blue' ? 'border-blue-900 bg-blue-100' :
        boardTheme === 'brown' ? 'border-yellow-900 bg-yellow-100' :
        'border-card bg-background'
      )}
    >
      {rowsToRender.map((rowIdx) =>
        colsToRender.map((colIdx) => renderSquare(rowIdx, colIdx))
      )}
    </div>
  );
}

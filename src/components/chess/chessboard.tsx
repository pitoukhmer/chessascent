
'use client';

import type { BoardState, SquareCoord, PieceStyle, BoardTheme, ChessPiece } from './types';
import { Piece } from './piece';
import { cn } from '@/lib/utils';

interface ChessboardProps {
  boardState: BoardState;
  possibleMoves?: SquareCoord[];
  isWhiteView?: boolean;
  disabled?: boolean; // This prop controls overall board interactivity
  pieceStyle?: PieceStyle;
  boardTheme?: BoardTheme;
  onPieceDragStart?: (event: React.DragEvent<HTMLButtonElement>, coord: SquareCoord, piece: ChessPiece) => void;
  onSquareDrop?: (event: React.DragEvent<HTMLButtonElement>, coord: SquareCoord) => void;
  // isPlayerTurn prop is not actively used internally beyond its influence on the 'disabled' prop from PlayPage
}

export function Chessboard({
  boardState,
  possibleMoves = [],
  isWhiteView = true,
  disabled = false, // This is the primary controller for enabling/disabling the board
  pieceStyle = 'unicode',
  boardTheme = 'default',
  onPieceDragStart,
  onSquareDrop,
}: ChessboardProps) {

  const getSquareColors = (isDark: boolean): string => {
    switch (boardTheme) {
      case 'green':
        return isDark ? 'bg-green-700 hover:bg-green-800' : 'bg-green-200 hover:bg-green-300';
      case 'blue':
        return isDark ? 'bg-blue-700 hover:bg-blue-800' : 'bg-blue-200 hover:bg-blue-300';
      case 'brown':
        return isDark ? 'bg-yellow-700 hover:bg-yellow-800' : 'bg-yellow-200 hover:bg-yellow-300';
      case 'default':
      default:
        return isDark ? 'bg-primary/70 hover:bg-primary/80' : 'bg-secondary hover:bg-secondary/80';
    }
  };

  const renderSquare = (row: number, col: number) => {
    const piece = boardState[row][col];
    const coord = { row, col };
    
    const isDark = (row + col) % 2 !== 0;    
    const isPossibleMove = possibleMoves.some(m => m.row === row && m.col === col);
    const isPotentiallyPlayerPiece = !!piece && piece.color === 'white';

    return (
      <button
        key={`${row}-${col}`}
        className={cn(
          'w-full aspect-square flex items-center justify-center transition-colors duration-150 focus:outline-none',
          getSquareColors(isDark),
          isPossibleMove && !piece && 'bg-accent/30 hover:bg-accent/40', 
          isPossibleMove && piece && 'bg-destructive/30 hover:bg-destructive/40', 
          (disabled && isPotentiallyPlayerPiece) && 'cursor-not-allowed opacity-60', 
          (piece && piece.color === 'black') && 'cursor-not-allowed',
        )}
        onClick={() => { /* Clicks are inert; interaction via D&D */ }}
        onDragStart={(e) => {
          if (!disabled && isPotentiallyPlayerPiece && onPieceDragStart && piece) {
            onPieceDragStart(e, coord, piece);
          } else {
            e.preventDefault(); 
          }
        }}
        onDragOver={(e) => {
          if (!disabled) { // Allow drop if the board is not disabled
            e.preventDefault(); 
            e.dataTransfer.dropEffect = "move";
          }
        }}
        onDrop={(e) => {
          e.preventDefault(); 
          if (!disabled && onSquareDrop) {
            onSquareDrop(e, coord);
          }
        }}
        draggable={isPotentiallyPlayerPiece && !disabled}
        disabled={disabled || (piece && piece.color === 'black')} // Explicitly disable button if board is disabled or it's a black piece
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
      {rowsToRender.map((row) =>
        colsToRender.map((col) => renderSquare(row, col))
      )}
    </div>
  );
}
    

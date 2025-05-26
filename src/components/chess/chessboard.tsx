
'use client';

import type { BoardState, SquareCoord, PieceStyle, BoardTheme, ChessPiece } from './types';
import { Piece } from './piece';
import { cn } from '@/lib/utils';

interface ChessboardProps {
  boardState: BoardState;
  // onSquareClick?: (coord: SquareCoord) => void; // Removed for D&D
  // selectedSquare?: SquareCoord | null; // Removed for D&D
  possibleMoves?: SquareCoord[];
  isWhiteView?: boolean;
  disabled?: boolean;
  pieceStyle?: PieceStyle;
  boardTheme?: BoardTheme;
  onPieceDragStart?: (event: React.DragEvent<HTMLButtonElement>, coord: SquareCoord, piece: ChessPiece) => void;
  onSquareDrop?: (event: React.DragEvent<HTMLButtonElement>, coord: SquareCoord) => void;
  isPlayerTurn?: boolean; // To determine if player's pieces are draggable
}

export function Chessboard({
  boardState,
  // onSquareClick, // Removed
  // selectedSquare, // Removed
  possibleMoves = [],
  isWhiteView = true,
  disabled = false,
  pieceStyle = 'unicode',
  boardTheme = 'default',
  onPieceDragStart,
  onSquareDrop,
  isPlayerTurn = true,
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
    // const isSelected = selectedSquare?.row === row && selectedSquare?.col === col; // Removed
    const isPossibleMove = possibleMoves.some(m => m.row === row && m.col === col);

    // Determine if the piece on this square should be draggable
    const isPieceDraggable = !!piece && piece.color === 'white' && !!isPlayerTurn && !disabled;

    return (
      <button
        key={`${row}-${col}`}
        className={cn(
          'w-full aspect-square flex items-center justify-center transition-colors duration-150 focus:outline-none',
          getSquareColors(isDark),
          // isSelected && 'ring-4 ring-accent ring-inset', // Removed
          isPossibleMove && !piece && 'bg-accent/30 hover:bg-accent/40', // For visual hints later
          isPossibleMove && piece && 'bg-destructive/30 hover:bg-destructive/40', // For visual hints later
          (disabled && !isPieceDraggable) && 'cursor-not-allowed opacity-60', // Board is generally disabled
          (!isPieceDraggable && piece && piece.color === 'white') && 'cursor-not-allowed opacity-60', // Player's piece but not their turn/disabled
          (piece && piece.color === 'black') && 'cursor-not-allowed', // Opponent's pieces are never draggable by player
        )}
        onClick={() => { /* Clicks on squares now do nothing directly; interaction is via D&D */ }}
        onDragStart={(e) => {
          if (isPieceDraggable && onPieceDragStart && piece) {
            onPieceDragStart(e, coord, piece);
          } else {
            e.preventDefault(); // Prevent dragging if not allowed
          }
        }}
        onDragOver={(e) => {
          // Allow dropping only if the board is not generally disabled (e.g., during AI turn or promotion dialog)
          // And if there's a drop handler
          if (!disabled && onSquareDrop) {
            e.preventDefault(); 
            // Optionally, add a class for visual feedback on hover: e.currentTarget.classList.add('bg-accent/20');
          }
        }}
        // onDragLeave={(e) => {
        //   if (!disabled && onSquareDrop) {
        //     e.currentTarget.classList.remove('bg-accent/20');
        //   }
        // }}
        onDrop={(e) => {
          // if (!disabled && onSquareDrop) {
          //   e.currentTarget.classList.remove('bg-accent/20');
            onSquareDrop?.(e, coord);
          // } else {
          //  e.preventDefault(); // Should not be strictly necessary if onDragOver doesn't allow it
          // }
        }}
        draggable={isPieceDraggable}
        aria-label={`Square ${String.fromCharCode(97 + col)}${8 - row}${piece ? `, ${piece.color} ${piece.type}` : ''}`}
        // The button itself doesn't need to be 'disabled' for D&D, 'draggable' controls that.
        // Clicks are inert.
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

    
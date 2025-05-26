
'use client';

import type { BoardState, SquareCoord, PieceStyle, BoardTheme } from './types';
import { Piece } from './piece';
import { cn } from '@/lib/utils';

interface ChessboardProps {
  boardState: BoardState;
  onSquareClick?: (coord: SquareCoord) => void;
  selectedSquare?: SquareCoord | null;
  possibleMoves?: SquareCoord[];
  isWhiteView?: boolean; // Determines board orientation
  disabled?: boolean;
  pieceStyle?: PieceStyle;
  boardTheme?: BoardTheme;
}

export function Chessboard({
  boardState,
  onSquareClick,
  selectedSquare,
  possibleMoves = [],
  isWhiteView = true,
  disabled = false,
  pieceStyle = 'unicode',
  boardTheme = 'default',
}: ChessboardProps) {

  const getSquareColors = (isDark: boolean): string => {
    switch (boardTheme) {
      case 'green':
        return isDark ? 'bg-green-700 hover:bg-green-800' : 'bg-green-200 hover:bg-green-300';
      case 'blue':
        return isDark ? 'bg-blue-700 hover:bg-blue-800' : 'bg-blue-200 hover:bg-blue-300';
      case 'brown':
        return isDark ? 'bg-yellow-700 hover:bg-yellow-800' : 'bg-yellow-200 hover:bg-yellow-300'; // Using yellow for "wood-like"
      case 'default':
      default:
        return isDark ? 'bg-primary/70 hover:bg-primary/80' : 'bg-secondary hover:bg-secondary/80';
    }
  };

  const renderSquare = (row: number, col: number) => {
    const piece = boardState[row][col];
    const coord = { row, col };
    
    const isDark = (row + col) % 2 !== 0;
    const isSelected = selectedSquare?.row === row && selectedSquare?.col === col;
    const isPossibleMove = possibleMoves.some(m => m.row === row && m.col === col);

    return (
      <button
        key={`${row}-${col}`}
        className={cn(
          'w-full aspect-square flex items-center justify-center transition-colors duration-150',
          getSquareColors(isDark),
          isSelected && 'ring-4 ring-accent ring-inset',
          isPossibleMove && !piece && 'bg-accent/30 hover:bg-accent/40',
          isPossibleMove && piece && 'bg-destructive/30 hover:bg-destructive/40',
          disabled && 'cursor-not-allowed opacity-70'
        )}
        onClick={() => onSquareClick && !disabled && onSquareClick(coord)}
        aria-label={`Square ${String.fromCharCode(97 + col)}${8 - row}`}
        disabled={disabled}
      >
        <Piece piece={piece} pieceStyle={pieceStyle} />
      </button>
    );
  };

  const rows = Array.from({ length: 8 }, (_, i) => isWhiteView ? i : 7 - i);
  const cols = Array.from({ length: 8 }, (_, i) => isWhiteView ? i : 7 - i);

  return (
    <div className={cn(
        "grid grid-cols-8 w-full max-w-md md:max-w-lg aspect-square border-4 shadow-2xl rounded overflow-hidden",
        boardTheme === 'default' ? 'border-card bg-background' : 
        boardTheme === 'green' ? 'border-green-900 bg-green-100' :
        boardTheme === 'blue' ? 'border-blue-900 bg-blue-100' :
        boardTheme === 'brown' ? 'border-yellow-900 bg-yellow-100' :
        'border-card bg-background' // fallback
      )}
    >
      {rows.map((row) =>
        cols.map((col) => renderSquare(row, col))
      )}
    </div>
  );
}

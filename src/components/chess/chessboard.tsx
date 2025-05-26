'use client';

import type { BoardState, SquareCoord } from './types';
import { Piece } from './piece';
import { cn } from '@/lib/utils';

interface ChessboardProps {
  boardState: BoardState;
  onSquareClick?: (coord: SquareCoord) => void;
  selectedSquare?: SquareCoord | null;
  possibleMoves?: SquareCoord[];
  isWhiteView?: boolean; // Determines board orientation
  disabled?: boolean;
}

export function Chessboard({
  boardState,
  onSquareClick,
  selectedSquare,
  possibleMoves = [],
  isWhiteView = true,
  disabled = false,
}: ChessboardProps) {
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
          isDark ? 'bg-primary/70 hover:bg-primary/80' : 'bg-secondary hover:bg-secondary/80',
          isSelected && 'ring-4 ring-accent ring-inset',
          isPossibleMove && !piece && 'bg-accent/30 hover:bg-accent/40',
          isPossibleMove && piece && 'bg-destructive/30 hover:bg-destructive/40',
          disabled && 'cursor-not-allowed opacity-70'
        )}
        onClick={() => onSquareClick && !disabled && onSquareClick(coord)}
        aria-label={`Square ${String.fromCharCode(97 + col)}${8 - row}`}
        disabled={disabled}
      >
        <Piece piece={piece} />
      </button>
    );
  };

  const rows = Array.from({ length: 8 }, (_, i) => isWhiteView ? i : 7 - i);
  const cols = Array.from({ length: 8 }, (_, i) => isWhiteView ? i : 7 - i);

  return (
    <div className="grid grid-cols-8 w-full max-w-md md:max-w-lg aspect-square border-4 border-card shadow-2xl rounded overflow-hidden bg-background">
      {rows.map((row) =>
        cols.map((col) => renderSquare(row, col))
      )}
    </div>
  );
}

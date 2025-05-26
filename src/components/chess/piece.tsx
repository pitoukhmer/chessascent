import type { ChessPiece as PieceType } from './types';

interface PieceProps {
  piece: PieceType | null;
}

export function Piece({ piece }: PieceProps) {
  if (!piece) {
    return null;
  }

  return (
    <span
      className="text-4xl md:text-5xl flex items-center justify-center h-full w-full select-none"
      aria-label={`${piece.color} ${piece.type}`}
    >
      {piece.symbol}
    </span>
  );
}

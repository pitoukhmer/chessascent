
import type { ChessPiece as PieceType, PieceStyle } from './types';

interface PieceProps {
  piece: PieceType | null;
  pieceStyle?: PieceStyle;
}

// Basic SVG placeholders - these are very simplified
const getGraphicalPiece = (piece: PieceType): JSX.Element => {
  const commonProps = {
    width: "80%",
    height: "80%",
    viewBox: "0 0 45 45",
    className: "drop-shadow-md",
  };

  // Fill colors based on piece color
  const fill = piece.color === 'white' ? '#FFF' : '#333'; // White or dark gray
  const stroke = piece.color === 'white' ? '#333' : '#CCC'; // Dark gray or light gray outline

  switch (piece.type) {
    case 'P': // Pawn
      return (
        <svg {...commonProps} aria-label={`${piece.color} Pawn`}>
          <circle cx="22.5" cy="30" r="10" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <circle cx="22.5" cy="15" r="7" fill={fill} stroke={stroke} strokeWidth="1.5" />
        </svg>
      );
    case 'R': // Rook
      return (
        <svg {...commonProps} aria-label={`${piece.color} Rook`}>
          <rect x="10" y="10" width="25" height="30" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <rect x="7" y="7" width="31" height="5" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <rect x="12" y="7" width="5" height="5" fill="none" stroke={stroke} strokeWidth="1.5" />
          <rect x="20" y="7" width="5" height="5" fill="none" stroke={stroke} strokeWidth="1.5" />
          <rect x="28" y="7" width="5" height="5" fill="none" stroke={stroke} strokeWidth="1.5" />
        </svg>
      );
    case 'N': // Knight
      return (
        <svg {...commonProps} aria-label={`${piece.color} Knight`}>
          <path d="M12 36 L12 16 C12 10 18 6 22 10 L25 18 C30 16 32 20 32 25 L30 36 Z" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <ellipse cx="20" cy="12" rx="3" ry="2" fill={fill} stroke={stroke} strokeWidth="1.5" />
        </svg>
      );
    case 'B': // Bishop
      return (
        <svg {...commonProps} aria-label={`${piece.color} Bishop`}>
          <ellipse cx="22.5" cy="25" rx="10" ry="15" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <circle cx="22.5" cy="10" r="5" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <path d="M20 18 L25 18" stroke={stroke} strokeWidth="1.5" />
        </svg>
      );
    case 'Q': // Queen
      return (
        <svg {...commonProps} aria-label={`${piece.color} Queen`}>
          <path d="M10 35 L35 35 L30 15 L22.5 25 L15 15 Z" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <circle cx="12" cy="12" r="3" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <circle cx="22.5" cy="10" r="3" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <circle cx="33" cy="12" r="3" fill={fill} stroke={stroke} strokeWidth="1.5" />
        </svg>
      );
    case 'K': // King
      return (
        <svg {...commonProps} aria-label={`${piece.color} King`}>
          <rect x="12" y="15" width="21" height="25" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <rect x="10" y="12" width="25" height="5" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <rect x="20" y="5" width="5" height="10" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <rect x="17" y="7" width="11" height="3" fill={fill} stroke={stroke} strokeWidth="1.5" />
        </svg>
      );
    default:
      return <></>;
  }
};


export function Piece({ piece, pieceStyle = 'unicode' }: PieceProps) {
  if (!piece) {
    return null;
  }

  if (pieceStyle === 'graphical') {
    return (
      <span
        className="text-4xl md:text-5xl flex items-center justify-center h-full w-full select-none"
        aria-label={`${piece.color} ${piece.type}`}
      >
        {getGraphicalPiece(piece)}
      </span>
    );
  }

  // Default to Unicode
  return (
    <span
      className="text-4xl md:text-5xl flex items-center justify-center h-full w-full select-none"
      aria-label={`${piece.color} ${piece.type}`}
    >
      {piece.symbol}
    </span>
  );
}

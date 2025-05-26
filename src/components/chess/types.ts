export type PieceSymbol = 'P' | 'R' | 'N' | 'B' | 'Q' | 'K';
export type PieceColor = 'white' | 'black';

export interface ChessPiece {
  type: PieceSymbol;
  color: PieceColor;
  // Unicode representation
  symbol: string; 
}

export type SquareState = ChessPiece | null;
export type BoardState = SquareState[][];

export interface SquareCoord {
  row: number;
  col: number;
}

export interface TutorialStep {
  description: string;
  boardState: BoardState; // Visual board state for this step
  fen: string; // FEN for AI interaction at this step
  highlightSquares?: SquareCoord[]; // Squares to highlight for instruction
  movablePiece?: SquareCoord; // Specific piece to interact with
}

export interface Tutorial {
  slug: string;
  title: string;
  description: string;
  icon?: React.ElementType; // e.g., specific piece icon
  estimatedTime: string; // e.g., "5 mins"
  difficulty: 'Beginner' | 'Intermediate';
  // Represents the initial state of the tutorial
  initialBoard: BoardState; 
  initialFen: string;
  // Can be broken down into steps if needed for more complex tutorials
  // For now, we assume simple one-shot tutorials focused on AI suggestion
  // or a series of text instructions related to the initial board.
  learningObjectives: string[];
}

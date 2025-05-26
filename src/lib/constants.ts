import type { ChessPiece, PieceColor, PieceSymbol, Tutorial, BoardState } from '@/components/chess/types';
import { Swords, Shield, Castle, VenetianMask, Brain, Users } from 'lucide-react';


export const PIECE_UNICODE: Record<PieceColor, Record<PieceSymbol, string>> = {
  white: {
    K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙',
  },
  black: {
    K: '♚', Q: '♛', R: '♜', B: '♝', N: '♞', P: '♟',
  },
};

export function createPiece(type: PieceSymbol, color: PieceColor): ChessPiece {
  return { type, color, symbol: PIECE_UNICODE[color][type] };
}

// Helper to create an empty board
export function createEmptyBoard(): BoardState {
  return Array(8).fill(null).map(() => Array(8).fill(null));
}

// Helper to setup standard initial board
export function createInitialBoard(): BoardState {
  const board = createEmptyBoard();
  // Pawns
  for (let i = 0; i < 8; i++) {
    board[1][i] = createPiece('P', 'black');
    board[6][i] = createPiece('P', 'white');
  }
  // Rooks
  board[0][0] = createPiece('R', 'black'); board[0][7] = createPiece('R', 'black');
  board[7][0] = createPiece('R', 'white'); board[7][7] = createPiece('R', 'white');
  // Knights
  board[0][1] = createPiece('N', 'black'); board[0][6] = createPiece('N', 'black');
  board[7][1] = createPiece('N', 'white'); board[7][6] = createPiece('N', 'white');
  // Bishops
  board[0][2] = createPiece('B', 'black'); board[0][5] = createPiece('B', 'black');
  board[7][2] = createPiece('B', 'white'); board[7][5] = createPiece('B', 'white');
  // Queens
  board[0][3] = createPiece('Q', 'black');
  board[7][3] = createPiece('Q', 'white');
  // Kings
  board[0][4] = createPiece('K', 'black');
  board[7][4] = createPiece('K', 'white');
  return board;
}

export const INITIAL_FEN_STANDARD = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

// Simplified tutorial focusing on "how a pawn moves"
const pawnTutorialBoard = createEmptyBoard();
pawnTutorialBoard[6][4] = createPiece('P', 'white'); // White Pawn at e2
pawnTutorialBoard[4][4] = createPiece('p', 'black'); // Black pawn at e4 for capture example (not used in simple version)


export const TUTORIALS_DATA: Tutorial[] = [
  {
    slug: 'pawn-movement',
    title: 'The Pawn',
    description: 'Learn how pawns move forward and capture diagonally. Use AI to see optimal pawn moves.',
    icon: () => <span className="text-2xl">{PIECE_UNICODE.white.P}</span>,
    estimatedTime: '3 mins',
    difficulty: 'Beginner',
    initialBoard: (() => {
        const board = createEmptyBoard();
        board[6][3] = createPiece('P', 'white'); // d2
        board[5][3] = null; // d3 empty
        board[4][3] = null; // d4 empty
        board[4][4] = createPiece('P', 'black'); // e5 (for capture)
        return board;
    })(),
    initialFen: '8/8/8/8/4p3/8/3P4/8 w - - 0 1', // White pawn on d2, black pawn on e5
    learningObjectives: [
      'Understand pawn initial two-square move.',
      'Understand pawn single-square forward move.',
      'Understand pawn diagonal capture.',
      'Get AI suggestions for pawn moves in a simple scenario.',
    ],
  },
  {
    slug: 'knight-movement',
    title: 'The Knight',
    description: 'Master the unique L-shaped movement of the knight. Let AI guide your knight.',
    icon: () => <span className="text-2xl">{PIECE_UNICODE.white.N}</span>,
    estimatedTime: '4 mins',
    difficulty: 'Beginner',
    initialBoard: (() => {
        const board = createEmptyBoard();
        board[7][1] = createPiece('N', 'white'); // b1
        return board;
    })(),
    initialFen: '8/8/8/8/8/8/8/1N6 w - - 0 1', // White knight on b1
    learningObjectives: [
      'Identify all possible knight moves from a given square.',
      'Practice moving the knight to target squares.',
      'Use AI to find effective knight paths.',
    ],
  },
  {
    slug: 'rook-movement',
    title: 'The Rook',
    description: 'Learn how rooks control ranks and files. See AI suggestions for rook positioning.',
    icon: () => <span className="text-2xl">{PIECE_UNICODE.white.R}</span>,
    estimatedTime: '3 mins',
    difficulty: 'Beginner',
    initialBoard: (() => {
        const board = createEmptyBoard();
        board[7][0] = createPiece('R', 'white'); // a1
        return board;
    })(),
    initialFen: '8/8/8/8/8/8/8/R7 w - - 0 1', // White rook on a1
    learningObjectives: [
        'Understand rook movement along ranks and files.',
        'Identify squares controlled by a rook.',
        'Get AI suggestions for rook placement.',
    ],
  },
  // Add more tutorials for Bishop, Queen, King, Basic Check, Checkmate etc.
];

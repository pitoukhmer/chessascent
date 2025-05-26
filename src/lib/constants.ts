
import React from 'react';
import type { JSX } from 'react';
import type { ChessPiece, PieceColor, PieceSymbol, Tutorial, BoardState } from '@/components/chess/types';
import { Castle } from 'lucide-react'; // Castle was already imported, used it. Other icons not used here.


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

// Define Icon Components using React.createElement to avoid JSX parsing issues in .ts file
const PawnIcon = (): JSX.Element => React.createElement('span', { className: "text-2xl" }, PIECE_UNICODE.white.P);
const KnightIcon = (): JSX.Element => React.createElement('span', { className: "text-2xl" }, PIECE_UNICODE.white.N);
const RookIcon = (): JSX.Element => React.createElement('span', { className: "text-2xl" }, PIECE_UNICODE.white.R);


export const TUTORIALS_DATA: Tutorial[] = [
  {
    slug: 'pawn-movement',
    title: 'The Pawn',
    description: 'Learn how pawns move forward and capture diagonally. Use AI to see optimal pawn moves.',
    icon: PawnIcon,
    estimatedTime: '3 mins',
    difficulty: 'Beginner',
    initialBoard: (() => {
        const board = createEmptyBoard();
        board[6][3] = createPiece('P', 'white'); // d2
        board[4][4] = createPiece('P', 'black'); // e4 (for capture example for white pawn on d3)
        return board;
    })(),
    initialFen: '8/8/8/8/4p3/8/3P4/8 w - - 0 1', // White pawn on d2, black pawn on e4 (original was e5)
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
    icon: KnightIcon,
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
    icon: RookIcon,
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
  {
    slug: 'kingside-castling',
    title: 'Kingside Castling',
    description: 'Learn the special King safety move: Kingside Castling. Understand the rules and see AI suggestions.',
    icon: Castle, // Using Lucide Castle icon
    estimatedTime: '5 mins',
    difficulty: 'Beginner',
    initialBoard: (() => {
        const board = createEmptyBoard();
        board[0][4] = createPiece('K', 'black'); // Black King on e8
        board[7][0] = createPiece('R', 'white'); // White Rook on a1
        board[7][4] = createPiece('K', 'white'); // White King on e1
        board[7][7] = createPiece('R', 'white'); // White Rook on h1
        // Add some pawns for realism, but ensure castling paths are clear
        for (let i = 0; i < 3; i++) { // a,b,c pawns
            board[6][i] = createPiece('P', 'white');
        }
        for (let i = 5; i < 8; i++) { // f,g,h pawns
            board[6][i] = createPiece('P', 'white');
        }
        return board;
    })(),
    // FEN for White: Ke1, Ra1, Rh1. Black: Ke8. White pawns: a2,b2,c2,f2,g2,h2.
    // Simplified FEN for tutorial: 4k3/8/8/8/8/8/PPP2PPP/R3K2R w KQ - 0 1
    // More specific for Kingside focus, but allowing both for AI suggestion robustness.
    initialFen: '4k3/8/8/8/8/8/PPP2PPP/R3K2R w KQ - 0 1',
    learningObjectives: [
      "Understand conditions for castling (King/Rook haven't moved, no pieces between, King not in check, squares King passes not attacked).",
      "Learn how to perform Kingside Castling (O-O).",
      "Recognize when Kingside Castling improves King safety.",
      "Get AI suggestions for castling.",
    ],
  },
];


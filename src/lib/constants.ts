
import React from 'react';
import type { JSX } from 'react';
import type { ChessPiece, PieceColor, PieceSymbol, Tutorial, BoardState } from '@/components/chess/types';
import { Castle } from 'lucide-react';


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

// Define Icon Components using React.createElement
const PawnIcon = (): JSX.Element => React.createElement('span', { className: "text-2xl" }, PIECE_UNICODE.white.P);
const KnightIcon = (): JSX.Element => React.createElement('span', { className: "text-2xl" }, PIECE_UNICODE.white.N);
const RookIcon = (): JSX.Element => React.createElement('span', { className: "text-2xl" }, PIECE_UNICODE.white.R);
const BishopIcon = (): JSX.Element => React.createElement('span', { className: "text-2xl" }, PIECE_UNICODE.white.B);
const QueenIcon = (): JSX.Element => React.createElement('span', { className: "text-2xl" }, PIECE_UNICODE.white.Q);
const KingIcon = (): JSX.Element => React.createElement('span', { className: "text-2xl" }, PIECE_UNICODE.white.K);


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
        board[4][4] = createPiece('p', 'black'); // e4 (black pawn)
        return board;
    })(),
    initialFen: '8/8/8/8/4p3/8/3P4/8 w - - 0 1', // White pawn on d2, black pawn on e4
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
    slug: 'bishop-movement',
    title: 'The Bishop',
    description: 'Learn how bishops move diagonally. Explore AI suggestions for bishop activity.',
    icon: BishopIcon,
    estimatedTime: '3 mins',
    difficulty: 'Beginner',
    initialBoard: (() => {
        const board = createEmptyBoard();
        board[7][2] = createPiece('B', 'white'); // c1
        board[4][6] = createPiece('p', 'black'); // g5 (black pawn as a target)
        return board;
    })(),
    initialFen: '8/8/8/6p1/8/8/8/2B5 w - - 0 1', // White bishop c1, Black pawn g5
    learningObjectives: [
      'Understand bishop diagonal movement.',
      'Identify squares controlled by a bishop.',
      'Get AI suggestions for effective bishop moves.',
    ],
  },
  {
    slug: 'queen-movement',
    title: 'The Queen',
    description: 'Discover the power of the queen, moving like a rook and bishop combined. See AI ideas for queen activity.',
    icon: QueenIcon,
    estimatedTime: '4 mins',
    difficulty: 'Beginner',
    initialBoard: (() => {
        const board = createEmptyBoard();
        board[7][3] = createPiece('Q', 'white'); // d1
        return board;
    })(),
    initialFen: '8/8/8/8/8/8/8/3Q4 w - - 0 1', // White queen on d1
    learningObjectives: [
      'Understand queen movement (horizontal, vertical, and diagonal).',
      'Recognize the queen as the most powerful piece.',
      'Get AI suggestions for queen deployment.',
    ],
  },
  {
    slug: 'king-movement',
    title: 'The King',
    description: "Learn the king's basic movement (one square in any direction) and its importance. Castling is covered separately.",
    icon: KingIcon,
    estimatedTime: '3 mins',
    difficulty: 'Beginner',
    initialBoard: (() => {
        const board = createEmptyBoard();
        board[7][4] = createPiece('K', 'white'); // e1
        return board;
    })(),
    initialFen: '8/8/8/8/8/8/8/4K3 w - - 0 1', // White king on e1
    learningObjectives: [
      "Understand king's one-square movement in any direction.",
      "Recognize the king's critical role and vulnerability.",
      "Get AI suggestions for basic king positioning (non-castling focus).",
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
        for (let i = 0; i < 3; i++) {
            board[6][i] = createPiece('P', 'white');
        }
        for (let i = 5; i < 8; i++) {
            board[6][i] = createPiece('P', 'white');
        }
        return board;
    })(),
    initialFen: '4k3/8/8/8/8/8/PPP2PPP/R3K2R w KQ - 0 1',
    learningObjectives: [
      "Understand conditions for castling (King/Rook haven't moved, no pieces between, King not in check, squares King passes not attacked).",
      "Learn how to perform Kingside Castling (O-O).",
      "Recognize when Kingside Castling improves King safety.",
      "Get AI suggestions for castling.",
    ],
  },
];


import type { BoardState, SquareCoord, ChessPiece, PieceColor, PieceSymbol } from '@/components/chess/types';

function isSquareOnBoard(coord: SquareCoord): boolean {
  return coord.row >= 0 && coord.row < 8 && coord.col >= 0 && coord.col < 8;
}

function getPieceAt(board: BoardState, coord: SquareCoord): ChessPiece | null {
  if (!isSquareOnBoard(coord)) return null;
  return board[coord.row][coord.col];
}

function getPawnMoves(board: BoardState, from: SquareCoord, piece: ChessPiece): SquareCoord[] {
  const moves: SquareCoord[] = [];
  const direction = piece.color === 'white' ? -1 : 1;
  const startRow = piece.color === 'white' ? 6 : 1;

  // Forward one square
  const oneSquareForward = { row: from.row + direction, col: from.col };
  if (isSquareOnBoard(oneSquareForward) && !getPieceAt(board, oneSquareForward)) {
    moves.push(oneSquareForward);
    // Forward two squares (from start)
    if (from.row === startRow) {
      const twoSquaresForward = { row: from.row + 2 * direction, col: from.col };
      if (isSquareOnBoard(twoSquaresForward) && !getPieceAt(board, twoSquaresForward)) {
        moves.push(twoSquaresForward);
      }
    }
  }

  // Captures
  const captureOffsets = [-1, 1];
  for (const offset of captureOffsets) {
    const captureSquare = { row: from.row + direction, col: from.col + offset };
    if (isSquareOnBoard(captureSquare)) {
      const targetPiece = getPieceAt(board, captureSquare);
      if (targetPiece && targetPiece.color !== piece.color) {
        moves.push(captureSquare);
      }
    }
  }
  return moves;
}

function getSlidingMoves(board: BoardState, from: SquareCoord, piece: ChessPiece, directions: Array<{ dr: number; dc: number }>): SquareCoord[] {
  const moves: SquareCoord[] = [];
  for (const { dr, dc } of directions) {
    for (let i = 1; i < 8; i++) {
      const to = { row: from.row + i * dr, col: from.col + i * dc };
      if (!isSquareOnBoard(to)) break;
      const targetPiece = getPieceAt(board, to);
      if (targetPiece) {
        if (targetPiece.color !== piece.color) {
          moves.push(to); // Capture
        }
        break; // Blocked by own or opponent's piece
      }
      moves.push(to); // Empty square
    }
  }
  return moves;
}

function getRookMoves(board: BoardState, from: SquareCoord, piece: ChessPiece): SquareCoord[] {
  const directions = [{ dr: -1, dc: 0 }, { dr: 1, dc: 0 }, { dr: 0, dc: -1 }, { dr: 0, dc: 1 }];
  return getSlidingMoves(board, from, piece, directions);
}

function getBishopMoves(board: BoardState, from: SquareCoord, piece: ChessPiece): SquareCoord[] {
  const directions = [{ dr: -1, dc: -1 }, { dr: -1, dc: 1 }, { dr: 1, dc: -1 }, { dr: 1, dc: 1 }];
  return getSlidingMoves(board, from, piece, directions);
}

function getQueenMoves(board: BoardState, from: SquareCoord, piece: ChessPiece): SquareCoord[] {
  return [...getRookMoves(board, from, piece), ...getBishopMoves(board, from, piece)];
}

function getKnightMoves(board: BoardState, from: SquareCoord, piece: ChessPiece): SquareCoord[] {
  const moves: SquareCoord[] = [];
  const knightOffsets = [
    { dr: -2, dc: -1 }, { dr: -2, dc: 1 }, { dr: -1, dc: -2 }, { dr: -1, dc: 2 },
    { dr: 1, dc: -2 }, { dr: 1, dc: 2 }, { dr: 2, dc: -1 }, { dr: 2, dc: 1 },
  ];
  for (const offset of knightOffsets) {
    const to = { row: from.row + offset.dr, col: from.col + offset.dc };
    if (isSquareOnBoard(to)) {
      const targetPiece = getPieceAt(board, to);
      if (!targetPiece || targetPiece.color !== piece.color) {
        moves.push(to);
      }
    }
  }
  return moves;
}

function getKingMoves(board: BoardState, from: SquareCoord, piece: ChessPiece): SquareCoord[] {
  const moves: SquareCoord[] = [];
  const kingOffsets = [
    { dr: -1, dc: -1 }, { dr: -1, dc: 0 }, { dr: -1, dc: 1 },
    { dr: 0, dc: -1 },                 { dr: 0, dc: 1 },
    { dr: 1, dc: -1 }, { dr: 1, dc: 0 }, { dr: 1, dc: 1 },
  ];
  // Basic moves (castling and check prevention not handled here for now)
  for (const offset of kingOffsets) {
    const to = { row: from.row + offset.dr, col: from.col + offset.dc };
    if (isSquareOnBoard(to)) {
      const targetPiece = getPieceAt(board, to);
      if (!targetPiece || targetPiece.color !== piece.color) {
        moves.push(to);
      }
    }
  }
  return moves;
}

export function getValidMovesForPiece(board: BoardState, from: SquareCoord): SquareCoord[] {
  const piece = getPieceAt(board, from);
  if (!piece) return [];

  switch (piece.type) {
    case 'P': return getPawnMoves(board, from, piece);
    case 'R': return getRookMoves(board, from, piece);
    case 'N': return getKnightMoves(board, from, piece);
    case 'B': return getBishopMoves(board, from, piece);
    case 'Q': return getQueenMoves(board, from, piece);
    case 'K': return getKingMoves(board, from, piece);
    default: return [];
  }
  // Future: Add logic to filter out moves that would leave the king in check.
}

export function isValidMove(board: BoardState, from: SquareCoord, to: SquareCoord, playerColor?: PieceColor): boolean {
  const piece = getPieceAt(board, from);
  if (!piece) return false;
  if (playerColor && piece.color !== playerColor) return false; // Trying to move opponent's piece

  const validMoves = getValidMovesForPiece(board, from);
  const isMoveInList = validMoves.some(move => move.row === to.row && move.col === to.col);
  if (!isMoveInList) return false;

  // Future: Add check to see if this move puts the current player's king in check.
  // For now, basic move validation is done.
  return true;
}

export function findKing(board: BoardState, kingColor: PieceColor): SquareCoord | null {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.type === 'K' && piece.color === kingColor) {
        return { row: r, col: c };
      }
    }
  }
  return null;
}

export function isKingInCheck(board: BoardState, kingColor: PieceColor): boolean {
  const kingPosition = findKing(board, kingColor);
  if (!kingPosition) {
    return false; // King not on board (e.g., captured, though game should end before this)
  }

  const opponentColor = kingColor === 'white' ? 'black' : 'white';
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.color === opponentColor) {
        // Get raw attacking moves for the opponent's piece.
        // This doesn't consider if the attacking piece is pinned itself.
        const attackerMoves = getValidMovesForPiece(board, { row: r, col: c });
        if (attackerMoves.some(move => move.row === kingPosition.row && move.col === kingPosition.col)) {
          return true; // King is attacked by at least one piece
        }
      }
    }
  }
  return false;
}

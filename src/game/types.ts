export interface Cell {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacent: number; // 0-8 adjacent mines
  exploded: boolean; // the mine that ended the game
  wrongFlag: boolean; // flagged on reveal-all but not a mine
}

export type Board = Cell[][];

export type GameStatus = 'ready' | 'playing' | 'won' | 'lost';

export interface Difficulty {
  id: string;
  name: string;
  cols: number;
  rows: number;
  mines: number;
}

export interface Frame {
  rolls: number[];
  score: number | null;
  cumulativeScore: number | null;
  isStrike: boolean;
  isSpare: boolean;
  isComplete: boolean;
  isTenth: boolean;
}

export interface ScoreResponse {
  totalScore: number;
  currentFrame: number;
  pinsRemaining: number;
  gameOver: boolean;
  frames: Frame[];
}

export type RollDisplay = 'X' | '/' | '-' | string;
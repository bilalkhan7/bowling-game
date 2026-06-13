import { computed, Injectable, signal } from '@angular/core';
import { Frame } from '../models/bowling.model';

@Injectable({ providedIn: 'root' })
export class BowlingScoreService {
  private readonly MAX_PINS = 10;
  private readonly MAX_FRAMES = 10;

  private readonly _rolls = signal<number[]>([]);

  readonly frames = computed(() => this.buildFrames(this._rolls()));

  readonly totalScore = computed(() => {
    const completed = this.frames().filter(f => f.cumulativeScore !== null);
    return completed.length > 0
      ? (completed[completed.length - 1].cumulativeScore ?? 0)
      : 0;
  });

  readonly isGameOver = computed(() => {
    const allFrames = this.frames();
    return allFrames.length === this.MAX_FRAMES &&
      allFrames[this.MAX_FRAMES - 1].isComplete;
  });

  readonly currentFrameIndex = computed(() => {
    const idx = this.frames().findIndex(f => !f.isComplete);
    return idx === -1 ? this.MAX_FRAMES - 1 : idx;
  });

  readonly pinsRemaining = computed(() =>
    this.calculatePinsRemaining(this._rolls())
  );

  addRoll(pins: number): void {
    if (this.isGameOver()) return;
    if (!this.isValidRoll(pins, this._rolls())) return;
    this._rolls.update(rolls => [...rolls, pins]);
  }

  resetGame(): void {
    this._rolls.set([]);
  }

  private isValidRoll(pins: number, rolls: number[]): boolean {
    if (!Number.isInteger(pins) || pins < 0 || pins > this.MAX_PINS) return false;
    return pins <= this.calculatePinsRemaining(rolls);
  }

  private buildFrames(rolls: number[]): Frame[] {
    const frames: Frame[] = [];
    let rollIndex = 0;

    for (let frameIndex = 0; frameIndex < this.MAX_FRAMES; frameIndex++) {
      const isTenth = frameIndex === this.MAX_FRAMES - 1;

      if (isTenth) {
        frames.push(this.buildTenthFrame(rolls, rollIndex, frames));
        break;
      }

      if (rollIndex >= rolls.length) {
        frames.push(this.emptyFrame(isTenth));
        continue;
      }

      const first = rolls[rollIndex];

      if (first === this.MAX_PINS) {
        const hasBonus = rolls.length > rollIndex + 2;
        const score = hasBonus
          ? this.MAX_PINS + rolls[rollIndex + 1] + rolls[rollIndex + 2]
          : null;
        const prev = this.prevCumulative(frames);
        frames.push({
          rolls: [first], score,
          cumulativeScore: score !== null && prev !== null ? prev + score : null,
          isStrike: true, isSpare: false, isComplete: true, isTenth
        });
        rollIndex += 1;
        continue;
      }

      if (rolls.length <= rollIndex + 1) {
        frames.push({
          rolls: [first], score: null, cumulativeScore: null,
          isStrike: false, isSpare: false, isComplete: false, isTenth
        });
        rollIndex += 1;
        continue;
      }

      const second = rolls[rollIndex + 1];
      const isSpare = first + second === this.MAX_PINS;
      const prev = this.prevCumulative(frames);

      if (isSpare) {
        const hasBonus = rolls.length > rollIndex + 2;
        const score = hasBonus ? this.MAX_PINS + rolls[rollIndex + 2] : null;
        frames.push({
          rolls: [first, second], score,
          cumulativeScore: score !== null && prev !== null ? prev + score : null,
          isStrike: false, isSpare: true, isComplete: true, isTenth
        });
      } else {
        const score = first + second;
        frames.push({
          rolls: [first, second], score,
          cumulativeScore: prev !== null ? prev + score : score,
          isStrike: false, isSpare: false, isComplete: true, isTenth
        });
      }
      rollIndex += 2;
    }

    while (frames.length < this.MAX_FRAMES) {
      frames.push(this.emptyFrame(frames.length === this.MAX_FRAMES - 1));
    }

    return frames;
  }

  private buildTenthFrame(rolls: number[], rollIndex: number, previousFrames: Frame[]): Frame {
    const tenthRolls = rolls.slice(rollIndex);
    const prev = this.prevCumulative(previousFrames);
    if (tenthRolls.length === 0) return this.emptyFrame(true);

    const [r1, r2, r3] = tenthRolls;
    const firstIsStrike = r1 === this.MAX_PINS;
    const isSpare = !firstIsStrike && r2 !== undefined && r1 + r2 === this.MAX_PINS;

    if (firstIsStrike) {
      if (tenthRolls.length < 3) {
        return { rolls: tenthRolls, score: null, cumulativeScore: null,
          isStrike: true, isSpare: false, isComplete: false, isTenth: true };
      }
      const score = r1 + r2 + r3;
      return { rolls: tenthRolls.slice(0, 3), score,
        cumulativeScore: prev !== null ? prev + score : score,
        isStrike: true, isSpare: false, isComplete: true, isTenth: true };
    }

    if (tenthRolls.length < 2) {
      return { rolls: tenthRolls, score: null, cumulativeScore: null,
        isStrike: false, isSpare: false, isComplete: false, isTenth: true };
    }

    if (isSpare) {
      if (tenthRolls.length < 3) {
        return { rolls: tenthRolls, score: null, cumulativeScore: null,
          isStrike: false, isSpare: true, isComplete: false, isTenth: true };
      }
      const score = r1 + r2 + r3;
      return { rolls: tenthRolls.slice(0, 3), score,
        cumulativeScore: prev !== null ? prev + score : score,
        isStrike: false, isSpare: true, isComplete: true, isTenth: true };
    }

    const score = r1 + r2;
    return { rolls: [r1, r2], score,
      cumulativeScore: prev !== null ? prev + score : score,
      isStrike: false, isSpare: false, isComplete: true, isTenth: true };
  }

  private calculatePinsRemaining(rolls: number[]): number {
    if (this.checkGameOver(rolls)) return 0;
    const frames = this.buildFrames(rolls);
    const currentIdx = frames.findIndex(f => !f.isComplete);
    if (currentIdx === -1) return 0;
    const current = frames[currentIdx];
    if (currentIdx === 9) return this.tenthFramePinsRemaining(current.rolls);
    return current.rolls.length === 0 ? this.MAX_PINS : this.MAX_PINS - current.rolls[0];
  }

  private tenthFramePinsRemaining(tenthRolls: number[]): number {
    if (tenthRolls.length === 0) return this.MAX_PINS;
    const [r1, r2] = tenthRolls;
    if (tenthRolls.length === 1) return r1 === this.MAX_PINS ? this.MAX_PINS : this.MAX_PINS - r1;
    if (tenthRolls.length === 2) {
      if (r1 === this.MAX_PINS) return r2 === this.MAX_PINS ? this.MAX_PINS : this.MAX_PINS - r2;
      return this.MAX_PINS;
    }
    return 0;
  }

  private checkGameOver(rolls: number[]): boolean {
    const frames = this.buildFrames(rolls);
    return frames.length === this.MAX_FRAMES && frames[this.MAX_FRAMES - 1].isComplete;
  }

  private prevCumulative(frames: Frame[]): number | null {
    return frames.length === 0 ? 0 : frames[frames.length - 1].cumulativeScore;
  }

  private emptyFrame(isTenth: boolean): Frame {
    return { rolls: [], score: null, cumulativeScore: null,
      isStrike: false, isSpare: false, isComplete: false, isTenth };
  }
}
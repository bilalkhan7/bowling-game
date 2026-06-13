import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Frame, ScoreResponse } from '../models/bowling.model';

@Injectable({ providedIn: 'root' })
export class BowlingScoreService {
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);

  private readonly API_URL = 'http://localhost:8080/api/games';
  private readonly MAX_PINS = 10;
  private readonly MAX_FRAMES = 10;

  private readonly _rolls = signal<number[]>([]);
  private readonly _serverState = signal<ScoreResponse | null>(null);
  private readonly _errorMessage = signal<string | null>(null);

  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = this._errorMessage.asReadonly();

  readonly frames = computed(() =>
    this.isLoading()
      ? this.buildFrames(this._rolls())
      : this._serverState()?.frames ??
        Array.from({ length: this.MAX_FRAMES }, (_, i) => this.emptyFrame(i === this.MAX_FRAMES - 1))
  );

  readonly totalScore = computed(() => {
    if (this.isLoading()) {
      const frames = this.buildFrames(this._rolls());
      const completed = frames.filter(f => f.cumulativeScore !== null);
      return completed.length > 0 ? (completed[completed.length - 1].cumulativeScore ?? 0) : 0;
    }
    return this._serverState()?.totalScore ?? 0;
  });

  readonly isGameOver = computed(() => this._serverState()?.gameOver ?? false);
  readonly pinsRemaining = computed(() => this._serverState()?.pinsRemaining ?? this.MAX_PINS);
  readonly currentFrameIndex = computed(() => this._serverState()?.currentFrame ?? 0);

  addRoll(pins: number): void {
    if (this.isGameOver() || this.isLoading()) return;
    if (!this.isValidRoll(pins)) return;

    const previousRolls = this._rolls();
    const previousState = this._serverState();
    const newRolls = [...previousRolls, pins];

    this._rolls.set(newRolls);
    this._errorMessage.set(null);
    this.isLoading.set(true);

    this.http
      .post<ScoreResponse>(`${this.API_URL}/score`, { rolls: newRolls })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (state) => {
          this._serverState.set(state);
          this.isLoading.set(false);
        },
        error: () => {
          this._rolls.set(previousRolls);
          this._serverState.set(previousState);
          this.isLoading.set(false);
          this._errorMessage.set(
            'Connection error — roll was not recorded. Please try again.'
          );
        }
      });
  }

  dismissError(): void {
    this._errorMessage.set(null);
  }

  resetGame(): void {
    this._rolls.set([]);
    this._serverState.set(null);
    this._errorMessage.set(null);
    this.isLoading.set(false);
  }

  private isValidRoll(pins: number): boolean {
    if (!Number.isInteger(pins) || pins < 0 || pins > this.MAX_PINS) return false;
    return pins <= this.pinsRemaining();
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
        frames.push(this.emptyFrame(false));
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
      if (tenthRolls.length < 3) return {
        rolls: tenthRolls, score: null, cumulativeScore: null,
        isStrike: true, isSpare: false, isComplete: false, isTenth: true
      };
      const score = r1 + r2 + r3;
      return {
        rolls: tenthRolls.slice(0, 3), score,
        cumulativeScore: prev !== null ? prev + score : score,
        isStrike: true, isSpare: false, isComplete: true, isTenth: true
      };
    }

    if (tenthRolls.length < 2) return {
      rolls: tenthRolls, score: null, cumulativeScore: null,
      isStrike: false, isSpare: false, isComplete: false, isTenth: true
    };

    if (isSpare) {
      if (tenthRolls.length < 3) return {
        rolls: tenthRolls, score: null, cumulativeScore: null,
        isStrike: false, isSpare: true, isComplete: false, isTenth: true
      };
      const score = r1 + r2 + r3;
      return {
        rolls: tenthRolls.slice(0, 3), score,
        cumulativeScore: prev !== null ? prev + score : score,
        isStrike: false, isSpare: true, isComplete: true, isTenth: true
      };
    }

    const score = r1 + r2;
    return {
      rolls: [r1, r2], score,
      cumulativeScore: prev !== null ? prev + score : score,
      isStrike: false, isSpare: false, isComplete: true, isTenth: true
    };
  }

  private prevCumulative(frames: Frame[]): number | null {
    if (frames.length === 0) return 0;
    return frames[frames.length - 1].cumulativeScore;
  }

  private emptyFrame(isTenth: boolean): Frame {
    return {
      rolls: [], score: null, cumulativeScore: null,
      isStrike: false, isSpare: false, isComplete: false, isTenth
    };
  }
}
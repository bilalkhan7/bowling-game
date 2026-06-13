import { Component, inject } from '@angular/core';
import { BowlingScoreService } from '../../services/bowling-score.service';
import { FrameComponent } from '../frame/frame';
import { RollInputComponent } from '../roll-input/roll-input';

@Component({
  selector: 'app-bowling-game',
  standalone: true,
  imports: [FrameComponent, RollInputComponent],
  templateUrl: './bowling-game.html',
  styleUrl: './bowling-game.scss'
})
export class BowlingGameComponent {
  private readonly scoringService = inject(BowlingScoreService);

  readonly frames = this.scoringService.frames;
  readonly totalScore = this.scoringService.totalScore;
  readonly isGameOver = this.scoringService.isGameOver;
  readonly pinsRemaining = this.scoringService.pinsRemaining;
  readonly currentFrameIndex = this.scoringService.currentFrameIndex;
  readonly isLoading = this.scoringService.isLoading;
  readonly errorMessage = this.scoringService.errorMessage;

  onRoll(pins: number): void {
    this.scoringService.addRoll(pins);
  }

  onReset(): void {
    this.scoringService.resetGame();
  }

  onDismissError(): void {
    this.scoringService.dismissError();
  }
}
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BowlingGameComponent } from './bowling-game';
import { BowlingScoreService } from '../../services/bowling-score.service';
import { ScoreResponse } from '../../models/bowling.model';

const mockState = (overrides: Partial<ScoreResponse> = {}): ScoreResponse => ({
  totalScore: 0, currentFrame: 0, pinsRemaining: 10,
  gameOver: false, frames: [],
  ...overrides
});

describe('BowlingGameComponent (integration)', () => {
  let fixture: ComponentFixture<BowlingGameComponent>;
  let nativeEl: HTMLElement;
  let service: BowlingScoreService;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BowlingGameComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(BowlingGameComponent);
    nativeEl = fixture.nativeElement;
    service = TestBed.inject(BowlingScoreService);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('renders all 10 frames on load', () => {
    expect(nativeEl.querySelectorAll('app-frame').length).toBe(10);
  });

  it('shows roll input while game is in progress', () => {
    expect(nativeEl.querySelector('app-roll-input')).toBeTruthy();
  });

  it('shows current frame indicator so player knows where they are', () => {
    expect(nativeEl.querySelector('.game__frame-indicator')?.textContent)
      .toContain('Frame 1 of 10');
  });

  it('hides roll input and shows result when game ends', () => {
    service.addRoll(0);
    httpMock.expectOne('http://localhost:8080/api/games/score')
      .flush(mockState({ gameOver: true, totalScore: 0 }));
    fixture.detectChanges();
    expect(nativeEl.querySelector('app-roll-input')).toBeNull();
    expect(nativeEl.querySelector('.game__result')).toBeTruthy();
  });

  it('shows perfect game message after 12 strikes', () => {
    service.addRoll(10);
    httpMock.expectOne('http://localhost:8080/api/games/score')
      .flush(mockState({ gameOver: true, totalScore: 300 }));
    fixture.detectChanges();
    expect(nativeEl.textContent).toContain('Perfect game');
  });

  it('restores the input after reset so the player can start again', () => {
    service.addRoll(0);
    httpMock.expectOne('http://localhost:8080/api/games/score')
      .flush(mockState({ gameOver: true }));
    fixture.detectChanges();
    fixture.detectChanges();
    const btn = nativeEl.querySelector('.game__reset-btn') as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();
    expect(nativeEl.querySelector('app-roll-input')).toBeTruthy();
  });

  it('shows error banner when server call fails', () => {
    service.addRoll(5);
    httpMock.expectOne('http://localhost:8080/api/games/score')
      .flush({ message: 'error' }, { status: 500, statusText: 'Error' });
    fixture.detectChanges();
    expect(nativeEl.querySelector('.game__error')).toBeTruthy();
  });

  it('dismisses error banner when player clicks dismiss', () => {
    service.addRoll(5);
    httpMock.expectOne('http://localhost:8080/api/games/score')
      .flush({ message: 'error' }, { status: 500, statusText: 'Error' });
    fixture.detectChanges();
    const dismiss = nativeEl.querySelector('.game__error-dismiss') as HTMLButtonElement;
    dismiss.click();
    fixture.detectChanges();
    expect(nativeEl.querySelector('.game__error')).toBeNull();
  });
});
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { BowlingGameComponent } from './bowling-game';
import { BowlingScoreService } from '../../services/bowling-score.service';

describe('BowlingGameComponent (integration)', () => {
  let fixture: ComponentFixture<BowlingGameComponent>;
  let nativeEl: HTMLElement;
  let service: BowlingScoreService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BowlingGameComponent]
    }).compileComponents();
    fixture = TestBed.createComponent(BowlingGameComponent);
    nativeEl = fixture.nativeElement;
    service = TestBed.inject(BowlingScoreService);
    fixture.detectChanges();
  });

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
    Array.from({ length: 20 }).forEach(() => service.addRoll(0));
    fixture.detectChanges();
    expect(nativeEl.querySelector('app-roll-input')).toBeNull();
    expect(nativeEl.querySelector('.game__result')).toBeTruthy();
  });

  it('shows perfect game message after 12 strikes', () => {
    Array.from({ length: 12 }).forEach(() => service.addRoll(10));
    fixture.detectChanges();
    expect(nativeEl.textContent).toContain('Perfect game');
  });

  it('restores the input after reset so the player can start again', () => {
    Array.from({ length: 20 }).forEach(() => service.addRoll(0));
    fixture.detectChanges();
    const btn = nativeEl.querySelector('.game__reset-btn') as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();
    expect(nativeEl.querySelector('app-roll-input')).toBeTruthy();
  });
});
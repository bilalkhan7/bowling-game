import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { FrameComponent } from './frame';
import { Frame } from '../../models/bowling.model';

const makeFrame = (partial: Partial<Frame> = {}): Frame => ({
  rolls: [], score: null, cumulativeScore: null,
  isStrike: false, isSpare: false, isComplete: false, isTenth: false,
  ...partial
});

describe('FrameComponent', () => {
  let fixture: ComponentFixture<FrameComponent>;
  let nativeEl: HTMLElement;

  const render = (frame: Frame, index = 0, active = false) => {
    fixture.componentRef.setInput('frame', frame);
    fixture.componentRef.setInput('frameIndex', index);
    fixture.componentRef.setInput('isActive', active);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FrameComponent]
    }).compileComponents();
    fixture = TestBed.createComponent(FrameComponent);
    nativeEl = fixture.nativeElement;
  });

  it('highlights the active frame so the player knows where they are', () => {
    render(makeFrame(), 0, true);
    expect(nativeEl.querySelector('.frame--active')).toBeTruthy();
  });

  it('shows X for a strike — service sets isStrike, component reflects it', () => {
    render(makeFrame({ rolls: [10], isStrike: true, isComplete: true }));
    expect(nativeEl.textContent).toContain('X');
  });

  it('shows the running total once the frame score is resolved', () => {
    render(makeFrame({ rolls: [3, 4], score: 7, cumulativeScore: 21, isComplete: true }));
    expect(nativeEl.textContent).toContain('21');
  });

  it('shows — while waiting for bonus rolls to resolve the score', () => {
    render(makeFrame({ rolls: [10], isStrike: true, score: null, cumulativeScore: null }));
    expect(nativeEl.textContent).toContain('—');
  });

  it('gives the 10th frame extra width for three roll slots', () => {
    render(makeFrame({ isTenth: true }), 9);
    expect(nativeEl.querySelector('.frame--tenth')).toBeTruthy();
  });
});
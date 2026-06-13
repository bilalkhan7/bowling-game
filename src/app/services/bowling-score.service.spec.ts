import { TestBed } from '@angular/core/testing';
import { BowlingScoreService } from './bowling-score.service';

describe('BowlingScoreService', () => {
  let service: BowlingScoreService;

  const roll = (pins: number) => service.addRoll(pins);
  const rollMany = (pins: number, times: number) =>
    Array.from({ length: times }).forEach(() => roll(pins));

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BowlingScoreService);
  });

  it('scores 0 for a complete gutter game', () => {
    rollMany(0, 20);
    expect(service.totalScore()).toBe(0);
  });

  it('scores 300 for a perfect game of 12 consecutive strikes', () => {
    rollMany(10, 12);
    expect(service.totalScore()).toBe(300);
  });

  it('scores 150 when every frame is a 5-5 spare with a 5-pin bonus', () => {
    rollMany(5, 21);
    expect(service.totalScore()).toBe(150);
  });

  it('reproduces the 133-point example from the specification', () => {
    [1, 4, 4, 5, 6, 4, 5, 5, 10, 0, 1, 7, 3, 6, 4, 10, 2, 8, 6]
      .forEach(p => roll(p));
    expect(service.totalScore()).toBe(133);
  });

  it('withholds spare score until the bonus roll arrives', () => {
    roll(7); roll(3);
    expect(service.frames()[0].cumulativeScore).toBeNull();
    roll(4);
    expect(service.frames()[0].cumulativeScore).toBe(14);
  });

  it('withholds strike score until both bonus rolls arrive', () => {
    roll(10);
    expect(service.frames()[0].score).toBeNull();
    roll(3);
    expect(service.frames()[0].score).toBeNull();
    roll(4);
    expect(service.frames()[0].score).toBe(17);
  });

  it('grants two bonus rolls after a strike in the 10th frame', () => {
    rollMany(0, 18);
    roll(10); roll(6); roll(3);
    expect(service.totalScore()).toBe(19);
    expect(service.isGameOver()).toBe(true);
  });

  it('ends the game after two rolls in an open 10th frame', () => {
    rollMany(0, 18);
    roll(4); roll(5);
    expect(service.isGameOver()).toBe(true);
    expect(service.totalScore()).toBe(9);
  });

  it('rejects a second roll that would exceed pins still standing', () => {
    roll(7); roll(4);
    expect(service.frames()[0].rolls).toEqual([7]);
    expect(service.pinsRemaining()).toBe(3);
  });

  it('restores full initial state after reset', () => {
    rollMany(10, 12);
    service.resetGame();
    expect(service.totalScore()).toBe(0);
    expect(service.isGameOver()).toBe(false);
    expect(service.pinsRemaining()).toBe(10);
    expect(service.currentFrameIndex()).toBe(0);
  });
});
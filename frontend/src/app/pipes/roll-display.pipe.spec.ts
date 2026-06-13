import { RollDisplayPipe } from './roll-display.pipe';
import { Frame } from '../models/bowling.model';

const frame = (partial: Partial<Frame>): Frame => ({
  rolls: [], score: null, cumulativeScore: null,
  isStrike: false, isSpare: false, isComplete: false, isTenth: false,
  ...partial
});

describe('RollDisplayPipe', () => {
  let pipe: RollDisplayPipe;
  beforeEach(() => pipe = new RollDisplayPipe());

  it('shows X for a strike — never the number 10', () => {
    const f = frame({ rolls: [10], isStrike: true });
    expect(pipe.transform(f, 0)).toBe('X');
  });

  it('shows / for the second roll of a spare — not the actual pin count', () => {
    const f = frame({ rolls: [6, 4], isSpare: true });
    expect(pipe.transform(f, 1)).toBe('/');
  });

  it('shows - for a gutter ball — not the number 0', () => {
    const f = frame({ rolls: [0, 5] });
    expect(pipe.transform(f, 0)).toBe('-');
  });

  it('shows the numeric string for a normal roll', () => {
    const f = frame({ rolls: [7, 2] });
    expect(pipe.transform(f, 0)).toBe('7');
    expect(pipe.transform(f, 1)).toBe('2');
  });

  it('returns empty string for a roll slot that has not been played yet', () => {
    const f = frame({ rolls: [3] });
    expect(pipe.transform(f, 1)).toBe('');
  });

  describe('10th frame display', () => {
    it('shows X for each strike in the 10th — not / for the second', () => {
      const f = frame({ rolls: [10, 10, 10], isStrike: true, isTenth: true });
      expect(pipe.transform(f, 0)).toBe('X');
      expect(pipe.transform(f, 1)).toBe('X');
      expect(pipe.transform(f, 2)).toBe('X');
    });

    it('shows / when second roll completes a spare after a non-strike first roll', () => {
      const f = frame({ rolls: [7, 3, 5], isSpare: true, isTenth: true });
      expect(pipe.transform(f, 1)).toBe('/');
    });

    it('shows / for the third roll when it completes a spare after a strike-non-strike', () => {
      const f = frame({ rolls: [10, 6, 4], isStrike: true, isTenth: true });
      expect(pipe.transform(f, 2)).toBe('/');
    });
  });
});
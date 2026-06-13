import { Pipe, PipeTransform } from '@angular/core';
import { Frame, RollDisplay } from '../models/bowling.model';

@Pipe({ name: 'rollDisplay', standalone: true, pure: true })
export class RollDisplayPipe implements PipeTransform {
  private readonly MAX_PINS = 10;

  transform(frame: Frame, rollIndex: number): RollDisplay {
    if (!frame || rollIndex >= frame.rolls.length) return '';
    const pins = frame.rolls[rollIndex];
    if (frame.isTenth) return this.tenthDisplay(frame.rolls, rollIndex);
    if (rollIndex === 0 && frame.isStrike) return 'X';
    if (rollIndex === 1 && frame.isSpare) return '/';
    return pins === 0 ? '-' : pins.toString();
  }

  private tenthDisplay(rolls: number[], i: number): RollDisplay {
    const pins = rolls[i];
    const [r1, r2] = rolls;
    if (i === 0) return pins === this.MAX_PINS ? 'X' : (pins === 0 ? '-' : `${pins}`);
    if (i === 1) {
      if (pins === this.MAX_PINS) return 'X';
      if (r1 !== this.MAX_PINS && r1 + pins === this.MAX_PINS) return '/';
      return pins === 0 ? '-' : `${pins}`;
    }
    if (i === 2) {
      if (pins === this.MAX_PINS) return 'X';
      if (r1 === this.MAX_PINS && r2 !== this.MAX_PINS && r2 + pins === this.MAX_PINS) return '/';
      return pins === 0 ? '-' : `${pins}`;
    }
    return '';
  }
}
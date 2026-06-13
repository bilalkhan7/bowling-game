import { Component, input } from '@angular/core';
import { Frame } from '../../models/bowling.model';
import { RollDisplayPipe } from '../../pipes/roll-display.pipe';

@Component({
  selector: 'app-frame',
  standalone: true,
  imports: [RollDisplayPipe],
  templateUrl: './frame.html',
  styleUrl: './frame.scss'
})
export class FrameComponent {
  frame = input.required<Frame>();
  frameIndex = input.required<number>();
  isActive = input<boolean>(false);
}
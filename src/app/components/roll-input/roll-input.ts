import { Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-roll-input',
  standalone: true,
  templateUrl: './roll-input.html',
  styleUrl: './roll-input.scss'
})
export class RollInputComponent {
  pinsRemaining = input.required<number>();
  rollSubmitted = output<number>();

  pinOptions = computed(() =>
    Array.from({ length: this.pinsRemaining() + 1 }, (_, i) => i)
  );

  submit(pins: number): void {
    this.rollSubmitted.emit(pins);
  }
}
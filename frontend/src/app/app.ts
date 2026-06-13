import { Component } from '@angular/core';
import { BowlingGameComponent } from './components/bowling-game/bowling-game';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [BowlingGameComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {}
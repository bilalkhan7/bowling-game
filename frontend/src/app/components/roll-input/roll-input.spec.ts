import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { RollInputComponent } from './roll-input';

describe('RollInputComponent', () => {
  let fixture: ComponentFixture<RollInputComponent>;
  let component: RollInputComponent;
  let nativeEl: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RollInputComponent]
    }).compileComponents();
    fixture = TestBed.createComponent(RollInputComponent);
    component = fixture.componentInstance;
    nativeEl = fixture.nativeElement;
  });

  it('shows all 11 options at the start of a fresh frame', () => {
    fixture.componentRef.setInput('pinsRemaining', 10);
    fixture.detectChanges();
    expect(nativeEl.querySelectorAll('.roll-input__btn').length).toBe(11);
  });

  it('limits options to remaining pins so invalid rolls are impossible', () => {
    fixture.componentRef.setInput('pinsRemaining', 4);
    fixture.detectChanges();
    expect(nativeEl.querySelectorAll('.roll-input__btn').length).toBe(5);
  });

  it('emits the correct pin count when the player selects a button', () => {
    fixture.componentRef.setInput('pinsRemaining', 10);
    fixture.detectChanges();
    let emitted: number | undefined;
    component.rollSubmitted.subscribe((val: number) => emitted = val);
    const buttons = nativeEl.querySelectorAll('.roll-input__btn');
    (buttons[6] as HTMLButtonElement).click();
    expect(emitted).toBe(6);
  });
});
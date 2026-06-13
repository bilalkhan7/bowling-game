import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BowlingScoreService } from './bowling-score.service';
import { ScoreResponse } from '../models/bowling.model';

describe('BowlingScoreService', () => {
  let service: BowlingScoreService;
  let httpMock: HttpTestingController;

  const mockState = (overrides: Partial<ScoreResponse> = {}): ScoreResponse => ({
    totalScore: 0, currentFrame: 0, pinsRemaining: 10,
    gameOver: false, frames: [],
    ...overrides
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(BowlingScoreService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('sends rolls to the backend scoring endpoint with correct payload', () => {
    service.addRoll(7);
    const req = httpMock.expectOne('http://localhost:8080/api/games/score');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ rolls: [7] });
    req.flush(mockState({ pinsRemaining: 3 }));
  });

  it('updates pinsRemaining from the server response', () => {
    service.addRoll(7);
    httpMock.expectOne('http://localhost:8080/api/games/score')
      .flush(mockState({ pinsRemaining: 3 }));
    expect(service.pinsRemaining()).toBe(3);
  });

  it('marks game as over when server signals completion', () => {
    service.addRoll(0);
    httpMock.expectOne('http://localhost:8080/api/games/score')
      .flush(mockState({ gameOver: true }));
    expect(service.isGameOver()).toBe(true);
  });

  it('blocks additional rolls while a request is in flight', () => {
    service.addRoll(5);
    httpMock.expectOne('http://localhost:8080/api/games/score');
    service.addRoll(3);
    httpMock.expectNone('http://localhost:8080/api/games/score');
  });

  it('resets all state locally without contacting the server', () => {
    service.addRoll(5);
    httpMock.expectOne('http://localhost:8080/api/games/score')
      .flush(mockState());
    service.resetGame();
    httpMock.expectNone('http://localhost:8080/api/games/score');
    expect(service.totalScore()).toBe(0);
    expect(service.isGameOver()).toBe(false);
  });

  it('shows optimistic frame data immediately before server responds', () => {
    service.addRoll(10);
    expect(service.frames()[0].isStrike).toBe(true);
    expect(service.isLoading()).toBe(true);
    httpMock.expectOne('http://localhost:8080/api/games/score')
      .flush(mockState());
  });

  it('rolls back optimistic update and shows error when server fails', () => {
    service.addRoll(5);
    httpMock.expectOne('http://localhost:8080/api/games/score')
      .flush({ message: 'Server error' }, { status: 500, statusText: 'Error' });
    expect(service.pinsRemaining()).toBe(10);
    expect(service.errorMessage()).toBeTruthy();
  });

  it('clears error message on dismiss', () => {
    service.addRoll(5);
    httpMock.expectOne('http://localhost:8080/api/games/score')
      .flush({ message: 'error' }, { status: 500, statusText: 'Error' });
    service.dismissError();
    expect(service.errorMessage()).toBeNull();
  });
});
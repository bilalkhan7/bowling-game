# Bowling Score Calculator

A fullstack bowling score calculator — Angular 21 frontend, Spring Boot 4 backend.

---

## Stack

- **Frontend:** Angular 21, TypeScript, SCSS, Vitest
- **Backend:** Spring Boot 4, Java 25, Gradle, JUnit 5

---

## Getting Started

**Backend**
```bash
cd backend
./gradlew bootRun
```
Runs on `http://localhost:8080`

**Frontend**
```bash
cd frontend
npm install
ng serve
```
Runs on `http://localhost:4200`

**Tests**
```bash
cd frontend && ng test --watch=false
cd backend && ./gradlew test
```

---

## Project Structure

```
bowling-game/
├── frontend/
│   └── src/app/
│       ├── models/       # Domain types
│       ├── services/     # API integration + game state
│       ├── pipes/        # RollDisplayPipe (X, /, –)
│       └── components/
│           ├── bowling-game/   # Game orchestrator
│           ├── frame/          # Single frame display
│           └── roll-input/     # Pin selection
└── backend/
    └── src/main/java/com/europace/bowling/
        ├── controller/   # REST endpoint
        ├── service/      # Scoring engine
        ├── dto/          # Request/Response types
        ├── exception/    # Error handling
        └── config/       # CORS
```

---

## API

`POST /api/games/score`

```json
// Request
{ "rolls": [1,4,4,5,6,4,5,5,10,0,1,7,3,6,4,10,2,8,6] }

// Response
{ "totalScore": 133, "currentFrame": 9, "pinsRemaining": 0, "gameOver": true, "frames": [...] }
```

---

## Architecture Decisions

**Flat rolls array** — bonus rules cross frame boundaries, so a flat array is the natural fit for the algorithm on both sides.

**Optimistic updates** — roll is applied locally the moment the player clicks, backend confirms in the background. On error, state rolls back with a dismissible message.

**Signals + zoneless** — no Zone.js, no NgRx at this scope. Signals cover everything without the overhead.

**RxJS for HTTP, Signals for state** — HttpClient stays Observable-based, local state stays in Signals. They meet at `.subscribe()` in the service.

**Backend as source of truth** — Java engine handles scoring authoritatively. The local Angular engine exists purely for the optimistic display.

---

## Next Steps

- **Auth** — Spring Security + JWT, user accounts, game history per player
- **Persistence** — PostgreSQL via Spring Data JPA, game history endpoint
- **E2E** — Playwright tests covering full game flows
- **Deployment** — Docker + AWS ECS backend, S3/CloudFront frontend
package com.europace.bowling.controller;

import com.europace.bowling.dto.ScoreRequest;
import com.europace.bowling.dto.ScoreResponse;
import com.europace.bowling.service.BowlingScoreService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/games")
public class GameController {

    private static final Logger log = LoggerFactory.getLogger(GameController.class);
    private final BowlingScoreService scoringService;

    public GameController(BowlingScoreService scoringService) {
        this.scoringService = scoringService;
    }

    @PostMapping("/score")
    public ResponseEntity<ScoreResponse> calculateScore(
            @Valid @RequestBody ScoreRequest request) {
        log.info("Score calculation requested for {} rolls", request.rolls().size());
        return ResponseEntity.ok(scoringService.calculateScore(request.rolls()));
    }
}
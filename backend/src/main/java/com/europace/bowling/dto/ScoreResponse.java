package com.europace.bowling.dto;

import java.util.List;

public record ScoreResponse(
    int totalScore,
    int currentFrame,
    int pinsRemaining,
    boolean gameOver,
    List<FrameResult> frames
) {}
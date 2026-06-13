package com.europace.bowling.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record ScoreRequest(
    @NotNull List<@Min(0) @Max(10) Integer> rolls
) {}
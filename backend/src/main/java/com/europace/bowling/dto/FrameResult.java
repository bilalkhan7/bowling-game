package com.europace.bowling.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

@JsonInclude(JsonInclude.Include.ALWAYS)
public record FrameResult(
    List<Integer> rolls,
    Integer score,
    Integer cumulativeScore,
    @JsonProperty("isStrike")   boolean isStrike,
    @JsonProperty("isSpare")    boolean isSpare,
    @JsonProperty("isComplete") boolean isComplete,
    @JsonProperty("isTenth")    boolean isTenth
) {}
package com.europace.bowling.service;

import com.europace.bowling.dto.FrameResult;
import com.europace.bowling.dto.ScoreResponse;
import com.europace.bowling.exception.InvalidRollException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
public class BowlingScoreService {

    private static final Logger log = LoggerFactory.getLogger(BowlingScoreService.class);
    private static final int MAX_PINS = 10;
    private static final int MAX_FRAMES = 10;

    public ScoreResponse calculateScore(List<Integer> rolls) {
        log.debug("Calculating score for {} rolls", rolls.size());
        validateRolls(rolls);

        List<FrameResult> frames = buildFrames(rolls);
        int totalScore = frames.stream()
            .filter(f -> f.cumulativeScore() != null)
            .mapToInt(FrameResult::cumulativeScore)
            .max().orElse(0);
        boolean gameOver = !frames.isEmpty() && frames.get(MAX_FRAMES - 1).isComplete();
        int currentFrame = findCurrentFrame(frames);
        int pinsRemaining = gameOver ? 0 : calculatePinsRemaining(frames, currentFrame);

        return new ScoreResponse(totalScore, currentFrame, pinsRemaining, gameOver, frames);
    }

    private void validateRolls(List<Integer> rolls) {
        for (Integer pins : rolls) {
            if (pins == null || pins < 0 || pins > MAX_PINS) {
                throw new InvalidRollException("Pin count must be between 0 and " + MAX_PINS);
            }
        }
    }

    private List<FrameResult> buildFrames(List<Integer> rolls) {
        List<FrameResult> frames = new ArrayList<>();
        int rollIndex = 0;

        for (int frameIndex = 0; frameIndex < MAX_FRAMES; frameIndex++) {
            boolean isTenth = frameIndex == MAX_FRAMES - 1;

            if (isTenth) {
                frames.add(buildTenthFrame(rolls, rollIndex, frames));
                break;
            }

            if (rollIndex >= rolls.size()) {
                frames.add(emptyFrame(false));
                continue;
            }

            int first = rolls.get(rollIndex);

            if (first == MAX_PINS) {
                boolean hasBonus = rolls.size() > rollIndex + 2;
                Integer score = hasBonus
                    ? MAX_PINS + rolls.get(rollIndex + 1) + rolls.get(rollIndex + 2)
                    : null;
                Integer prev = prevCumulative(frames);
                frames.add(new FrameResult(
                    List.of(first), score,
                    score != null && prev != null ? prev + score : null,
                    true, false, true, false
                ));
                rollIndex += 1;
                continue;
            }

            if (rolls.size() <= rollIndex + 1) {
                frames.add(new FrameResult(
                    List.of(first), null, null,
                    false, false, false, false
                ));
                rollIndex += 1;
                continue;
            }

            int second = rolls.get(rollIndex + 1);
            boolean isSpare = first + second == MAX_PINS;
            Integer prev = prevCumulative(frames);

            if (isSpare) {
                boolean hasBonus = rolls.size() > rollIndex + 2;
                Integer score = hasBonus ? MAX_PINS + rolls.get(rollIndex + 2) : null;
                frames.add(new FrameResult(
                    List.of(first, second), score,
                    score != null && prev != null ? prev + score : null,
                    false, true, true, false
                ));
            } else {
                int score = first + second;
                frames.add(new FrameResult(
                    List.of(first, second), score,
                    prev != null ? prev + score : score,
                    false, false, true, false
                ));
            }
            rollIndex += 2;
        }

        while (frames.size() < MAX_FRAMES) {
            frames.add(emptyFrame(frames.size() == MAX_FRAMES - 1));
        }

        return frames;
    }

    private FrameResult buildTenthFrame(List<Integer> rolls, int rollIndex, List<FrameResult> prev) {
        List<Integer> tenth = new ArrayList<>(
            rolls.subList(Math.min(rollIndex, rolls.size()), rolls.size())
        );
        Integer prevCum = prevCumulative(prev);

        if (tenth.isEmpty()) return emptyFrame(true);

        int r1 = tenth.get(0);
        boolean firstStrike = r1 == MAX_PINS;
        boolean spare = !firstStrike && tenth.size() >= 2 && r1 + tenth.get(1) == MAX_PINS;

        if (firstStrike) {
            if (tenth.size() < 3) return new FrameResult(new ArrayList<>(tenth), null, null, true, false, false, true);
            int score = tenth.get(0) + tenth.get(1) + tenth.get(2);
            return new FrameResult(tenth.subList(0, 3), score,
                prevCum != null ? prevCum + score : score, true, false, true, true);
        }

        if (tenth.size() < 2) return new FrameResult(new ArrayList<>(tenth), null, null, false, false, false, true);

        if (spare) {
            if (tenth.size() < 3) return new FrameResult(new ArrayList<>(tenth), null, null, false, true, false, true);
            int score = tenth.get(0) + tenth.get(1) + tenth.get(2);
            return new FrameResult(tenth.subList(0, 3), score,
                prevCum != null ? prevCum + score : score, false, true, true, true);
        }

        int score = tenth.get(0) + tenth.get(1);
        return new FrameResult(List.of(tenth.get(0), tenth.get(1)), score,
            prevCum != null ? prevCum + score : score, false, false, true, true);
    }

    private int findCurrentFrame(List<FrameResult> frames) {
        for (int i = 0; i < frames.size(); i++) {
            if (!frames.get(i).isComplete()) return i;
        }
        return MAX_FRAMES - 1;
    }

    private int calculatePinsRemaining(List<FrameResult> frames, int currentFrame) {
        FrameResult current = frames.get(currentFrame);
        if (currentFrame == 9) return tenthFramePins(current.rolls());
        if (current.rolls().isEmpty()) return MAX_PINS;
        return MAX_PINS - current.rolls().get(0);
    }

    private int tenthFramePins(List<Integer> rolls) {
        if (rolls.isEmpty()) return MAX_PINS;
        int r1 = rolls.get(0);
        if (rolls.size() == 1) return r1 == MAX_PINS ? MAX_PINS : MAX_PINS - r1;
        if (rolls.size() == 2) {
            if (r1 == MAX_PINS) {
                int r2 = rolls.get(1);
                return r2 == MAX_PINS ? MAX_PINS : MAX_PINS - r2;
            }
            return MAX_PINS;
        }
        return 0;
    }

    private Integer prevCumulative(List<FrameResult> frames) {
        if (frames.isEmpty()) return 0;
        return frames.get(frames.size() - 1).cumulativeScore();
    }

    private FrameResult emptyFrame(boolean isTenth) {
        return new FrameResult(Collections.emptyList(), null, null, false, false, false, isTenth);
    }
}
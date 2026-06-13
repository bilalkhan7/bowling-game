package com.europace.bowling.service;

import com.europace.bowling.dto.ScoreResponse;
import com.europace.bowling.exception.InvalidRollException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.*;

class BowlingScoreServiceTest {

    private BowlingScoreService service;

    @BeforeEach
    void setUp() {
        service = new BowlingScoreService();
    }

    @Test
    void scores_zero_for_a_complete_gutter_game() {
        ScoreResponse result = service.calculateScore(Collections.nCopies(20, 0));
        assertThat(result.totalScore()).isEqualTo(0);
        assertThat(result.gameOver()).isTrue();
    }

    @Test
    void scores_300_for_a_perfect_game_of_twelve_strikes() {
        ScoreResponse result = service.calculateScore(Collections.nCopies(12, 10));
        assertThat(result.totalScore()).isEqualTo(300);
        assertThat(result.gameOver()).isTrue();
    }

    @Test
    void scores_150_for_all_spares_with_five_bonus() {
        ScoreResponse result = service.calculateScore(Collections.nCopies(21, 5));
        assertThat(result.totalScore()).isEqualTo(150);
    }

    @Test
    void reproduces_the_133_point_example_from_the_specification() {
        List<Integer> rolls = Arrays.asList(1,4,4,5,6,4,5,5,10,0,1,7,3,6,4,10,2,8,6);
        ScoreResponse result = service.calculateScore(rolls);
        assertThat(result.totalScore()).isEqualTo(133);
    }

    @Test
    void withholds_spare_score_until_bonus_roll_arrives() {
        ScoreResponse afterSpare = service.calculateScore(List.of(7, 3));
        assertThat(afterSpare.frames().get(0).cumulativeScore()).isNull();

        ScoreResponse afterBonus = service.calculateScore(List.of(7, 3, 4));
        assertThat(afterBonus.frames().get(0).cumulativeScore()).isEqualTo(14);
    }

    @Test
    void grants_two_bonus_rolls_after_strike_in_tenth_frame() {
        List<Integer> rolls = new java.util.ArrayList<>(Collections.nCopies(18, 0));
        rolls.addAll(List.of(10, 6, 3));
        ScoreResponse result = service.calculateScore(rolls);
        assertThat(result.totalScore()).isEqualTo(19);
        assertThat(result.gameOver()).isTrue();
    }

    @Test
    void ends_game_after_two_open_rolls_in_tenth_frame() {
        List<Integer> rolls = new java.util.ArrayList<>(Collections.nCopies(18, 0));
        rolls.addAll(List.of(4, 5));
        ScoreResponse result = service.calculateScore(rolls);
        assertThat(result.gameOver()).isTrue();
        assertThat(result.totalScore()).isEqualTo(9);
    }

    @Test
    void rejects_invalid_pin_count() {
        assertThatThrownBy(() -> service.calculateScore(List.of(11)))
            .isInstanceOf(InvalidRollException.class);
    }

    @Test
    void returns_ten_frames_for_any_roll_sequence() {
        ScoreResponse result = service.calculateScore(List.of(5, 3));
        assertThat(result.frames()).hasSize(10);
    }

    @Test
    void reports_pins_remaining_after_first_roll() {
        ScoreResponse result = service.calculateScore(List.of(7));
        assertThat(result.pinsRemaining()).isEqualTo(3);
    }
}
package com.mafia.domain.game.model.game;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum GamePhase {
    DAY_DISCUSSION, // 낮 - 토론
    DAY_VOTE,       // 낮 - 투표
    DAY_FINAL_STATEMENT, // 낮 - 변론
    DAY_FINAL_VOTE, // 낮 - 최종 투표
    NIGHT_ACTION;    // 밤 - 행동 선택

    @JsonValue
    public String toJson() {
        return name();
    }

    @JsonCreator
    public static GamePhase fromJson(String value) {
        return GamePhase.valueOf(value);
    }
}

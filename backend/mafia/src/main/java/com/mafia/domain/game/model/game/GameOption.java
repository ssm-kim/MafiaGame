package com.mafia.domain.game.model.game;

import lombok.Data;

@Data
public class GameOption {
    private int zombie;
    private int mutant;
    // 밤 시간
    private int nightTimeSec;
    // 토론 시간
    private int disTimeSec;

    public GameOption(){
        this.zombie = 2;
        this.mutant = 1;
        this.nightTimeSec = 30;
        this.disTimeSec = 60;
    }
}

package com.mafia.domain.game.model.game;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class GameOption {
    private int zombie;
    private int mutant;
    private int doctorCount;
    // 밤 시간
    private int nightTimeSec;
    // 토론 시간
    private int dayDisTimeSec;

    public GameOption(){
        this.zombie = 2;
        this.mutant = 1;
        this.doctorCount = 2;
        this.nightTimeSec = 30;
        this.dayDisTimeSec = 60;
    }

    public GameOption(int preset){
        this.zombie = 2;
        this.mutant = 0;
        this.doctorCount = 2;
        this.nightTimeSec = 30;
        this.dayDisTimeSec = 60;
        if(preset == 8) this.mutant = 1;

    }
}

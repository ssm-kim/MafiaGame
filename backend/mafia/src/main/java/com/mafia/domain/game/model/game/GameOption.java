package com.mafia.domain.game.model.game;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
@Schema(description = "게임 옵션을 설정하는 클래스")
public class GameOption {
  
    @Schema(description = "좀비의 수", example = "2")
    private int zombie;
    @Schema(description = "변종의 수", example = "1")
    private int mutant;
    @Schema(description = "의사 능력 사용 가능 횟수", example = "2")
    private int doctorSkillUsage;
    @Schema(description = "밤 시간(초 단위)", example = "30")
    private int nightTimeSec;
    @Schema(description = "토론 시간(초 단위)", example = "60")
    private int dayDisTimeSec;


    public GameOption() {
        this.zombie = 2;
        this.mutant = 1;
        this.doctorSkillUsage = 2;
        this.nightTimeSec = 30;
        this.dayDisTimeSec = 60;
    }

    public GameOption(int preset) {
        this.zombie = 2;
        this.mutant = 0;
        this.doctorSkillUsage = 2;
        this.nightTimeSec = 30;
        this.dayDisTimeSec = 60;
        if (preset == 8) {
            this.mutant = 1;
        }

    }
}

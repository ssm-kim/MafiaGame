package com.mafia.domain.game.model.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PlayerInfo {
    @Schema(description = "플레이어 번호", example = "1001")
    private Integer playerNo;

    @Schema(description = "플레이어의 닉네임", example = "Gamer123")
    private String nickname;

    @Schema(description = "플레이어의 사망 여부", example = "false")
    private boolean isDead;

}

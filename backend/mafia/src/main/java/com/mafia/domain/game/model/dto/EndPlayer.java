package com.mafia.domain.game.model.dto;

import com.mafia.domain.game.model.game.Player;
import com.mafia.domain.game.model.game.Role;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EndPlayer {
    @Schema(description = "플레이어 번호", example = "1001")
    private Integer playerNo;

    @Schema(description = "플레이어의 닉네임", example = "Gamer123")
    private String nickname;

    @Schema(description = "플레이어의 사망 여부", example = "false")
    private boolean dead;

    @Schema(description = "플레이어의 직업", example = "CITIZEN")
    private Role role;

    @Schema(description = "플레이어 승리여부", example = "true")
    private boolean win;

    public EndPlayer(int playerNo, Player player, boolean isWin){
        this.playerNo = playerNo;
        this.nickname = player.getNickName();
        this.dead = player.isDead();
        this.role = player.getRole();
        this.win = isWin;
    }
}

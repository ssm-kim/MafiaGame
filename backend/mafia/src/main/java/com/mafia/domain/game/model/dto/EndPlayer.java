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

    @Schema(description = "플레이어의 직업", example = "CITIZEN")
    private Role role;

    public EndPlayer(int playerNo, Player player){
        this.playerNo = playerNo;
        this.nickname = player.getNickName();
        this.role = player.getRole();
    }
}

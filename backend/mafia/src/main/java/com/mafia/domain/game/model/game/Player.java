package com.mafia.domain.game.model.game;

import com.mafia.domain.game.model.User;
import com.mafia.domain.member.model.entity.Member;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Schema(description = "게임에 참여하는 플레이어 정보를 나타내는 클래스")
public class Player {

    @Schema(description = "플레이어의 사용자 ID", example = "1001")
    private Long memberId;

    @Schema(description = "플레이어의 닉네임", example = "Gamer123")
    private String nickname;

    @Schema(description = "플레이어의 역할", example = "CITIZEN", allowableValues = {"CITIZEN", "ZOMBIE",
        "MUTANT", "POLICE", "PLAGUE_DOCTOR"})
    private Role role;

    @Schema(description = "플레이어의 사망 여부", example = "false")
    private boolean isDead;

    @Schema(description = "플레이어가 투표 가능 여부", example = "true")
    private boolean enableVote;

    public Player(Participant participant) {
        this.memberId = participant.getMemberId();
        this.nickname = participant.getNickname();
        this.role = Role.CITIZEN;
        this.isDead = false;
        this.enableVote = true;
    }
}
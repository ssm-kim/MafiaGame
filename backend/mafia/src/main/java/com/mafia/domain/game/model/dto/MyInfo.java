package com.mafia.domain.game.model.dto;

import com.mafia.domain.game.model.game.Player;
import com.mafia.domain.game.model.game.Role;
import io.swagger.v3.oas.annotations.media.Schema;
import java.util.Set;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MyInfo {
    @Schema(description = "플레이어 번호", example = "1001")
    private Integer playerNo;

    @Schema(description = "플레이어의 닉네임", example = "Gamer123")
    private String nickname;

    @Schema(description = "플레이어 채팅방 구독 목록", example = "room-1-day-chat")
    private Set<String> subscriptions;

    @Schema(description = "플레이어의 사망 여부", example = "false")
    private boolean isDead;

    @Schema(description = "내 직업", example = "CITIZEN")
    private Role role;

    @Schema(description = "오디오 음소거 여부", example = "false")
    private boolean muteAudio;

    @Schema(description = "마이크 음소거 여부", example = "true")
    private boolean muteMic;

    @Schema(description = "Openvidu 접속 세션 토큰", example = "wss://[domain]?sessionId=???&token=???")
    private String openviduToken;

    MyInfo(Integer playerNo, Player player){
        this.playerNo = playerNo;
        this.nickname = player.getNickName();
        this.subscriptions = player.getSubscriptions();
        this.isDead = player.isDead();
        this.role = player.getRole();
        this.muteAudio = player.isMuteAudio();
        this.muteMic = player.isMuteMic();
        this.openviduToken = player.getOpenviduToken();
    }
}

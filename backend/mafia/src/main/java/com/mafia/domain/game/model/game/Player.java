package com.mafia.domain.game.model.game;

import com.mafia.domain.room.model.redis.Participant;
import io.swagger.v3.oas.annotations.media.Schema;
import java.util.HashSet;
import java.util.Set;
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

    @Schema(description = "플레이어 채팅방 구독 목록", example = "room-1-day-chat")
    private Set<String> subscriptions;

    @Schema(description = "플레이어의 사망 여부", example = "false")
    private boolean isDead;

    @Schema(description = "플레이어가 투표 가능 여부", example = "true")
    private boolean enableVote;

    @Schema(description = "오디오 음소거 여부", example = "false")
    private boolean muteAudio;

    @Schema(description = "마이크 음소거 여부", example = "true")
    private boolean muteMic;

    public Player(Participant participant) {
        this.memberId = participant.getMemberId();
        this.nickname = participant.getNickName();
        this.role = Role.CITIZEN;
        this.subscriptions = new HashSet<>();
        this.isDead = false;
        this.enableVote = true;
        this.muteAudio = false;
        this.muteMic = false;
    }

    public void subscribe(String channel) {
        subscriptions.add(channel);
    }

    public boolean isSubscribed(String channel) {
        return subscriptions.contains(channel);
    }

    public void updateSubscriptionsOnDeath(Long gameId) {
        subscribe("game-" + gameId + "-night-chat");
        subscribe("game-" + gameId + "-dead-chat");
        subscribe("game-" + gameId + "-mafia-system");
    }
}
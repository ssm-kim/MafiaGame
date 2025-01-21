package com.mafia.room.model.dto.response;

import com.mafia.room.model.entity.RoomPlayer;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class RoomPlayerResponse {
    private Long memberId;
    private Long roomId;
    private String role;
    private Boolean isVote;
    private Boolean isReady;
    private Boolean isAlive;

    public static RoomPlayerResponse from(RoomPlayer player) {
        RoomPlayerResponse dto = new RoomPlayerResponse();
        dto.memberId = player.getId().getMemberId();
        dto.roomId = player.getId().getRoomId();
        dto.role = player.getRole();
        dto.isVote = player.getIsVote();
        dto.isReady = player.getIsReady();
        dto.isAlive = player.getIsAlive();
        return dto;
    }
}
package com.mafia.domain.room.model.dto.response;

import com.mafia.domain.room.model.entity.Room;
import com.mafia.domain.room.model.entity.RoomPlayer;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class RoomPlayerResponse {
    private Long memberId;
    private Boolean isReady;
    private Boolean isHost;

    public static RoomPlayerResponse from(RoomPlayer player, Room room) {
        RoomPlayerResponse dto = new RoomPlayerResponse();
        dto.memberId = player.getId().getMemberId();
        dto.isReady = player.getIsReady();
        dto.isHost = player.getId().getMemberId().equals(room.getMemberId());
        return dto;
    }

}

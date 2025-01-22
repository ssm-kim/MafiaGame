package com.mafia.room.model.dto.request;

import com.mafia.room.model.entity.RoomPlayer;
import com.mafia.room.model.entity.RoomPlayerId;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class RoomPlayerRequest {
    private Long memberId;
    private Long roomId;

    public RoomPlayer toEntity() {
        RoomPlayer roomPlayer = new RoomPlayer();
        roomPlayer.setId(new RoomPlayerId(this.memberId, this.roomId));
        return roomPlayer;
    }
}
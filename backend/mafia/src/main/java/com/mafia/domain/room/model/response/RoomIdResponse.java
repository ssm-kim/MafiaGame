package com.mafia.domain.room.model.response;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class RoomIdResponse {

    Long roomId;

    public RoomIdResponse(Long roomId) {
        this.roomId = roomId;
    }
}

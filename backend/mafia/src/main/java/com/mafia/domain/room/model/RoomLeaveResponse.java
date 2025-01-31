package com.mafia.domain.room.model;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class RoomLeaveResponse {

    boolean isHost;

    public RoomLeaveResponse(boolean isHost) {
        this.isHost = isHost;
    }
}

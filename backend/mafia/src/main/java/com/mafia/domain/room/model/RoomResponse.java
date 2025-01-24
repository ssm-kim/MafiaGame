package com.mafia.domain.room.model;

import lombok.Data;

@Data
public class RoomResponse {
    private Long roomId;
    private String roomTitle;
    private Integer peopleCnt;
}

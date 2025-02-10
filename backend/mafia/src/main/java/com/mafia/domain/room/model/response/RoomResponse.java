package com.mafia.domain.room.model.response;

import lombok.Data;

@Data
public class RoomResponse {

    private Long roomId;
    private String roomTitle;
    private Integer peopleCnt;
}

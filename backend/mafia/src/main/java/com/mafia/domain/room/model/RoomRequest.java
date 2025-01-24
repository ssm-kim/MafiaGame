package com.mafia.domain.room.model;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class RoomRequest {

    private Long hostId;
    private String roomTitle;
    private String roomPassword;
}
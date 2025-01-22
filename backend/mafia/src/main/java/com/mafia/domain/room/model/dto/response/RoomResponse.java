package com.mafia.domain.room.model.dto.response;

import com.mafia.domain.room.model.entity.Room;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
public class RoomResponse {
    private Long roomId;
    private Long memberId;
    private String roomTitle;
    private Boolean roomStatus;
    private String roomOption;
    private Integer curPlayers;
    private Boolean isVoice;
    private LocalDateTime createdAt;

    public RoomResponse(Room room) {
        this.roomId = room.getRoomId();
        this.memberId = room.getMemberId();
        this.roomTitle = room.getRoomTitle();
        this.roomStatus = room.getRoomStatus();
        this.roomOption = room.getRoomOption();
        this.curPlayers = room.getCurPlayers();
        this.isVoice = room.getIsVoice();
        this.createdAt = room.getCreatedAt();
    }
}
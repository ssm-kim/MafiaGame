package com.mafia.room.model.dto.response;

import com.mafia.room.model.entity.Room;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@NoArgsConstructor
public class RoomResponse {
    private Long roomId;
    private Long memberId;
    private String roomTitle;
    private Boolean roomStatus;
    private String roomOption;
    private Integer maxPlayers;
    private Boolean isVoice;
    private LocalDateTime createdAt;
    private List<RoomPlayerResponse> players;  // 상세 조회에만 포함

    public RoomResponse(Room room) {
        this.roomId = room.getRoomId();
        this.memberId = room.getMemberId();
        this.roomTitle = room.getRoomTitle();
        this.roomStatus = room.getRoomStatus();
        this.roomOption = room.getRoomOption();
        this.maxPlayers = room.getMaxPlayers();
        this.isVoice = room.getIsVoice();
        this.createdAt = room.getCreatedAt();
    }
}
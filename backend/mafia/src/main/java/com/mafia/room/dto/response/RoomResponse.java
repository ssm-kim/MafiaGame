package com.mafia.room.dto.response;

import com.mafia.room.entity.Room;
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

    public static RoomResponse from(Room room) {
        RoomResponse dto = new RoomResponse();
        dto.roomId = room.getRoomId();
        dto.memberId = room.getMemberId();
        dto.roomTitle = room.getRoomTitle();
        dto.roomStatus = room.getRoomStatus();
        dto.roomOption = room.getRoomOption();
        dto.maxPlayers = room.getMaxPlayers();
        dto.isVoice = room.getIsVoice();
        dto.createdAt = room.getCreatedAt();
        return dto;
    }
}
package com.mafia.domain.room.model.dto.request;

import com.mafia.domain.room.model.entity.Room;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class RoomRequest {
    private Long memberId;
    private String roomTitle;
    private String roomPassword;
    private String roomOption;
    private Integer curPlayers;
    private Boolean isVoice;

    public Room toEntity() {
        Room room = new Room();
        room.setMemberId(this.memberId);
        room.setRoomTitle(this.roomTitle);
        room.setRoomPassword(this.roomPassword);
        room.setRoomOption(this.roomOption);
        room.setCurPlayers(this.curPlayers);
        room.setIsVoice(this.isVoice);
        room.setCurPlayers(1);  // 방 생성 시 1명(방장)으로 시작
        room.setRoomStatus(false);
        return room;
    }
}
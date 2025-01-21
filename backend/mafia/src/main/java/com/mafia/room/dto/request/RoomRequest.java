package com.mafia.room.dto.request;

import com.mafia.room.entity.Room;
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
    private Integer maxPlayers;
    private Boolean isVoice;

    public Room toEntity() {
        Room room = new Room();
        room.setMemberId(this.memberId);
        room.setRoomTitle(this.roomTitle);
        room.setRoomPassword(this.roomPassword);
        room.setRoomOption(this.roomOption);
        room.setMaxPlayers(this.maxPlayers);
        room.setIsVoice(this.isVoice);
        room.setRoomStatus(false);
        return room;
    }

    @Override
    public String toString() {
        return "RoomRequest{" +
                "memberId=" + memberId +
                ", roomTitle='" + roomTitle + '\'' +
                ", roomPassword='" + roomPassword + '\'' +
                ", roomOption='" + roomOption + '\'' +
                ", maxPlayers=" + maxPlayers +
                ", isVoice=" + isVoice +
                '}';
    }
}
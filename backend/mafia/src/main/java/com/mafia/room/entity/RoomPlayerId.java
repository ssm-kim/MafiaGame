package com.mafia.room.entity;

import jakarta.persistence.Embeddable;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;

@Embeddable
@Getter @Setter
@NoArgsConstructor
@EqualsAndHashCode
public class RoomPlayerId implements Serializable {
    private Long memberId;  // bigint(20)
    private Long roomId;    // int(10)

    public RoomPlayerId(Long memberId, Long roomId) {
        this.memberId = memberId;
        this.roomId = roomId;
    }
}
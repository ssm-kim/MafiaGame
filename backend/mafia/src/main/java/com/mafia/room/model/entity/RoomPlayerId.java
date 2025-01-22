package com.mafia.room.model.entity;

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
    private Long memberId;  // bigint(10)
    private Long roomId;    // bigint(10)

    public RoomPlayerId(Long memberId, Long roomId) {
        this.memberId = memberId;
        this.roomId = roomId;
    }
}
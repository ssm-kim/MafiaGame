package com.mafia.room.model.entity;

import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter @Setter
@NoArgsConstructor
public class RoomPlayer {
    @EmbeddedId
    private RoomPlayerId id;    // 복합키 사용

    private String role = "citizen";  // 기본값 설정
    private Boolean isVote = true;
    private Boolean isReady = false;
    private Boolean isAlive = true;
}
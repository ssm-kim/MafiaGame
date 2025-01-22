package com.mafia.domain.room.model.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Getter @Setter
@NoArgsConstructor
public class Room {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long roomId;

    private Long memberId;
    private String roomTitle;
    private Boolean roomStatus;
    private String roomPassword;
    private String roomOption;
    private Integer curPlayers;
    private Boolean isVoice;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
package com.mafia.domain.room.model;

import lombok.Data;

@Data
public class Participant {

    private Long memberId;
    private boolean isReady;
    private String nickName;

}

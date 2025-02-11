package com.mafia.domain.room.model.redis;

import lombok.Data;

@Data
public class Participant {

    private Long memberId;
    private String nickName;
    private boolean isReady = false;
    private String sessionId;

}

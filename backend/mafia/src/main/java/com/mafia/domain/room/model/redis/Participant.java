package com.mafia.domain.room.model.redis;

import lombok.Data;

@Data
public class Participant {


    private Long memberId;
    private String nickName;    // 닉네임
    private boolean isReady = false;  // 준비 여부

    public Participant() {

    }

    public Participant(Long memberId, String nickName) {
        this.memberId = memberId;
        this.nickName = nickName;
    }
}

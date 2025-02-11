package com.mafia.domain.room.model.redis;

import lombok.Data;

@Data
public class Participant {

    private String nickName;    // 닉네임
    private boolean isReady = false;  // 준비 여부

    public Participant() {

    }

    public Participant(String nickName) {
        this.nickName = nickName;
    }

    public void put(Long no, Participant requireInfo) {
    }
}

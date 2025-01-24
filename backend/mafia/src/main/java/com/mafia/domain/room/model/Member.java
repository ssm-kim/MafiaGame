package com.mafia.domain.room.model;

import lombok.Data;

@Data
public class Member {

    private Long memberId;
    private String nickName;
    private Boolean isReady = false;
}
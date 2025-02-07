package com.mafia.domain.room.model.webSocket;

import lombok.Data;

@Data
public class EnterMessage {

    private Long memberId;     // 입장하려는 유저 ID
    private String password;   // 방 비밀번호 (있는 경우)
}

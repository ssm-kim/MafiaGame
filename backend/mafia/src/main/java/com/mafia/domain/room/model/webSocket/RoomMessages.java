package com.mafia.domain.room.model.webSocket;

import lombok.Data;

public class RoomMessages {

    @Data
    public static class EnterMessage {

        private String password;   // 방 비밀번호 (있는 경우)
    }

    @Data
    public static class LeaveMessage {

        private String targetSessionId;  // 강퇴할 유저의 세션 ID
    }

    @Data
    public static class KickMessage {

        private String targetSessionId;  // 강퇴할 유저의 세션 ID
    }
}
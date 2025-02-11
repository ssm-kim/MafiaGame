package com.mafia.domain.room.model.webSocket;

import lombok.Data;

public class RoomMessages {

    @Data
    public static class EnterMessage {

        private Long memberId;     // 입장하려는 유저 ID
        private String password;   // 방 비밀번호 (있는 경우)
    }

    @Data
    public static class LeaveMessage {

        private Long memberId;
        private String targetSessionId;  // 강퇴할 유저의 세션 ID
    }

    @Data
    public static class ReadyMessage {

        private Long memberId;
    }

    @Data
    public static class StartGameMessage {

        private Long memberId;
    }

    @Data
    public static class KickMessage {

        private Long hostId;    // 방장 ID
        private Long targetId;  // 강퇴할 유저 ID
    }
}
package com.mafia.domain.room.model.webSocket;

import lombok.Data;

public class RoomMessages {

    @Data
    public static class EnterMessage {

        private String password;   // 방 비밀번호 (있는 경우)
    }

    @Data
    public static class LeaveMessage {

        private Integer participantNo;  // 참가자 번호
    }

    @Data
    public static class ReadyMessage {

        private Integer participantNo;  // 참가자 번호
    }

    @Data
    public static class KickMessage {

        private Integer hostParticipantNo;    // 방장의 참가자 번호 (항상 1)
        private Integer targetParticipantNo;  // 강퇴할 대상의 참가자 번호
    }
}
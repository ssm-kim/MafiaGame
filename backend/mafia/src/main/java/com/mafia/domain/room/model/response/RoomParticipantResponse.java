package com.mafia.domain.room.model.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RoomParticipantResponse {

    private int participantNo;  // 참가자 번호 (1: 방장)
    private String nickname;    // 닉네임
    private boolean isReady;    // 준비 상태
}
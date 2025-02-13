package com.mafia.domain.room.model.redis;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.mafia.domain.game.model.game.GameOption;
import java.util.HashMap;
import java.util.Map;
import lombok.Data;
import lombok.NoArgsConstructor;

@JsonIgnoreProperties(ignoreUnknown = true)
@Data
@NoArgsConstructor
public class RoomInfo {

    private static final long serialVersionUID = 1L;

    private Long roomId;
    private String title;
    private String password;

    private int readyCnt;
    private int requiredPlayers;
    private boolean isActive = false;

    private String chat;
    private GameOption gameOption;

    private Map<Long, Participant> participant;  // (클라이언트) key: 참가자 번호, value: 참가자 정보
    private Map<Integer, Long> memberMapping;    // (서버내부용) key: 참가자 번호, value: memberId

    public RoomInfo(Long roomId, String title, String password, int requiredPlayers,
        GameOption gameOption) {
        this.roomId = roomId;
        this.title = title;
        this.password = password;
        this.requiredPlayers = requiredPlayers;
        this.chat = "room-" + roomId + "-chat";
        this.participant = new HashMap<>();
        this.memberMapping = new HashMap<>();  // 초기화 추가!
        this.gameOption = gameOption;
    }

    public Integer getpartNoByMemberId(Long memberId) {
        return memberMapping.entrySet().stream()
            .filter(entry -> entry.getValue().equals(memberId)) // memberId와 일치하는 값 찾기
            .map(Map.Entry::getKey) // 해당 키(플레이어 번호) 가져오기
            .findFirst()
            .orElse(null); // 없으면 null 반환
    }
}

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
    private Long hostId;
    private String title;
    private String password;
    private String sessionId;

    private int readyCnt;
    private int requiredPlayers;
    private boolean isActive = false;
    private String chat;
    private GameOption gameOption;
    private Map<Long, Participant> participant;  // key: member_id, value: 해당방에 들어간 참가자들

    public RoomInfo(Long roomId, Long hostId, String title, String password) {
        this.roomId = roomId;
        this.hostId = hostId;
        this.title = title;
        this.password = password;
        this.requiredPlayers = 4;
        this.chat = "room-" + roomId + "-chat";
        this.participant = new HashMap<>();
        this.gameOption = new GameOption();
    }
}

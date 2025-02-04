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
    private int readyCnt;
    private boolean roomStatus = false;
    private Map<Long, Participant> participant;  // key: member_id, value: 해당방에 들어간 참가자들
    private int requiredPlayers;
    private GameOption gameOption;
    private String dayChatId;
    private String mafiaChatId;
    private String deadChatId;

    public RoomInfo(Long roomId, Long hostId) {
        this.hostId = hostId;
        this.roomId = roomId;
        this.readyCnt = 0;
        this.requiredPlayers = 4;
        this.participant = new HashMap<>();
        this.gameOption = new GameOption();
    }
}

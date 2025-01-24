package com.mafia.domain.room.model;

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

    private Map<Long, Participant> participant;  // key: member_id, value: 해당방에 들어간 참가자들
    private Long roomId;
    private Long hostId;
    private int readyCnt;
    private GameOption gameOption;


    public RoomInfo(Long roomId, Long hostId) {
        this.hostId = hostId;
        this.roomId = roomId;
        this.readyCnt = 1;
        this.participant = new HashMap<>();
        this.gameOption = new GameOption();
    }
}

package com.mafia.domain.game.controller;

import com.mafia.domain.game.model.pos.PlayerPosition;
import com.mafia.domain.game.service.GamePositionService;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class GamePositionController {

    private final GamePositionService positionService;

    // @DestinationVariable  ->  STOMP 메시지 라우팅 전용 어노테이션
    @MessageMapping("/game/{roomId}/start")
    public void gameStart(@DestinationVariable Long roomId) {
        positionService.initPos(roomId);
    }

    @MessageMapping("/game/{roomId}/pos")
    @SendTo("/topic/game/{roomId}/positions")
    public Map<Long, PlayerPosition> updatePosition(
        @DestinationVariable Long roomId,
        PlayerPosition position) {

        return positionService.updateAndGetPositions(roomId, position);

    }
}

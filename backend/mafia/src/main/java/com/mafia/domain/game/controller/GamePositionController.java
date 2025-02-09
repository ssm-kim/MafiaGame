//package com.mafia.domain.game.controller;
//
//import com.mafia.domain.game.model.pos.PlayerPosition;
//import com.mafia.domain.game.service.GamePositionService;
//import java.util.Map;
//import lombok.RequiredArgsConstructor;
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.context.event.EventListener;
//import org.springframework.messaging.handler.annotation.DestinationVariable;
//import org.springframework.messaging.handler.annotation.MessageMapping;
//import org.springframework.messaging.handler.annotation.SendTo;
//import org.springframework.stereotype.Controller;
//import org.springframework.web.socket.messaging.SessionDisconnectEvent;
//
//@Controller
//@RequiredArgsConstructor
//@Slf4j
//public class GamePositionController {
//
//    private final GamePositionService positionService;
//
//    @MessageMapping("/game/{roomId}/pos")
//    @SendTo("/topic/game/{roomId}/positions")
//    public Map<Long, PlayerPosition> updatePosition(
//        @DestinationVariable Long roomId,
//        PlayerPosition position) {
//        log.info("Position update received - Room: {}, Player: {}, Position: ({}, {})",
//            roomId, position.getMemberId(), position.getX(), position.getY());
//        return positionService.updateAndGetPositions(roomId, position);
//    }
//
//    @EventListener
//    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
//        log.info("Client disconnected : {}", event.getSessionId());
//        positionService.clearAllGamePositions();
//    }
//}
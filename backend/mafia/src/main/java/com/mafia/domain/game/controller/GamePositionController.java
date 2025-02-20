package com.mafia.domain.game.controller;

import com.mafia.domain.chat.model.StompPrincipal;
import com.mafia.domain.game.model.pos.PlayerPosition;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Controller
@RequiredArgsConstructor
@Slf4j
public class GamePositionController {

    private final SimpMessagingTemplate template;
    /*
    TODO :
       사망한 플레이어 위치 처리 - Game 클래스의 Kill 메서드와 연동
       방 삭제 시 위치 정보 정리
     * */

    @MessageMapping("/game/{roomId}/pos")
    @SendTo("/topic/game/{roomId}/positions")
    public PlayerPosition updatePosition(@DestinationVariable Long roomId,
        PlayerPosition position) {

        return position;
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event)
        throws InterruptedException {
        StompPrincipal detail = (StompPrincipal) event.getUser();
        if (detail != null) {
            log.info("Client disconnected : {}", detail.getMemberId());
            Thread.sleep(4000);
            template.convertAndSend("/topic/game/disconnect", detail.getMemberId());
        }
    }
}
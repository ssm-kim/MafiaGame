package com.mafia.domain.room.controller;

import com.mafia.domain.room.model.webSocket.EnterMessage;
import com.mafia.domain.room.service.RoomMessageService;
import com.mafia.domain.room.service.TestRoomRedisService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

@Slf4j
@Controller
@RequiredArgsConstructor
public class RoomWebSocketController {

    private final RoomMessageService roomMessageService;
    private final TestRoomRedisService roomRedisService;

    // 1. 로비 입장 (기존 getAllRooms 활용)
    @MessageMapping("/lobby/enter")
    public void lobbyEnter() {
        log.info("========= Lobby Enter Called =========");
        System.out.println("안녕 난 로비 컨트롤러");
        roomMessageService.sendRoomListToAll();
    }

    // 2. 방 입장 (기존 TestRoomRedisService.enterRoom 활용)
    @MessageMapping("/room/enter/{roomId}")
    public void roomEnter(
        @DestinationVariable Long roomId,
        // @Payload 어노테이션은 클라이언트가 보낸 JSON 데이터를 자동으로 EnterMessage 객체로 변환
        @Payload EnterMessage message

    ) {
        System.out.println("안녕 난 방 입장 컨트롤러");
        // 기존 enterRoom 로직 활용
        roomRedisService.enterRoom(roomId, message.getMemberId(), message.getPassword());

        // 방 정보 변경을 방 안의 유저들에게 알림
        roomMessageService.sendRoomUpdate(roomId);
        // 로비 유저들에게 방 목록 업데이트 알림
        roomMessageService.sendRoomListToAll();
    }
}

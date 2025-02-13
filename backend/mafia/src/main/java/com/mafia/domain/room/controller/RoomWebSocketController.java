package com.mafia.domain.room.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mafia.domain.chat.model.StompPrincipal;
import com.mafia.domain.game.service.GameService;
import com.mafia.domain.room.model.webSocket.RoomMessages;
import com.mafia.domain.room.service.RoomDbService;
import com.mafia.domain.room.service.RoomMessageService;
import com.mafia.domain.room.service.RoomRedisService;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;

/**
 * WebSocket 기반 실시간 Room 이벤트 처리
 */

@Slf4j
@Controller
@RequiredArgsConstructor
public class RoomWebSocketController {

    private final RoomMessageService messageService;
    private final RoomRedisService roomRedisService;
    private final RoomDbService roomDbService;
    private final GameService gameService;
    private final ObjectMapper objectMapper;

    /**
     * 로비 입장 시 방 목록 전송
     */
    @MessageMapping("/lobby/enter")
    public void handleLobbyEnter() {
        log.info("로비 입장 - 방 목록 전송");
        messageService.sendRoomListToAll();
    }

    /**
     * 방 입장 처리 및 참가자 정보 업데이트
     */
    @MessageMapping("/room/enter/{roomId}")
    public void handleRoomEnter(
        @DestinationVariable Long roomId,
        @Payload RoomMessages.EnterMessage message,
        @AuthenticationPrincipal StompPrincipal detail
    ) {
        long memberId = Long.parseLong(detail.getName());
        log.info("방 입장 요청 - 방 번호: {}, memberId: {}", roomId, memberId);

        roomRedisService.enterRoom(roomId, memberId, message.getPassword());
        messageService.sendRoomUpdate(roomId);
        messageService.sendRoomListToAll();
    }

    /**
     * 방 퇴장 처리 (방장 퇴장 시 방 삭제)
     */
    @MessageMapping("/room/leave/{roomId}")
    public void handleRoomLeave(
        @DestinationVariable Long roomId,
        @AuthenticationPrincipal StompPrincipal detail
    ) {
        long memberId = Long.parseLong(detail.getName());
        log.info("방 퇴장 요청 - 방 번호: {}, memberId: {}",
            roomId, memberId);

        boolean isHost = roomRedisService.isHost(roomId, memberId);
        roomRedisService.leaveRoom(roomId, memberId);
        if (isHost) {
            roomDbService.deleteRoom(roomId);
        } else {
            messageService.sendRoomUpdate(roomId);
        }
        messageService.sendRoomListToAll();
    }

    /**
     * 강제 퇴장 처리
     */
    @MessageMapping("/room/kick/{roomId}")
    public void handleKickMember(
        @DestinationVariable Long roomId,
        @Payload RoomMessages.KickMessage message,
        @AuthenticationPrincipal StompPrincipal detail
    ) {
        long memberId = Long.parseLong(detail.getName());
        log.info("강제 퇴장 요청 - 방 번호: {}, 방장: {}, 대상: {}",
            roomId, Long.parseLong(detail.getName()), message.getTargetParticipantNo());

        roomRedisService.kickMember(roomId, memberId, message.getTargetParticipantNo());
        messageService.sendRoomUpdate(roomId);
        messageService.sendRoomListToAll();
    }

    /**
     * 게임 준비 상태 토글
     */
    @MessageMapping("/room/ready/{roomId}")
    public void handleReadyToggle(
        @DestinationVariable Long roomId,
        @AuthenticationPrincipal StompPrincipal detail
    ) {
        long memberId = Long.parseLong(detail.getName());
        log.info("준비 상태 변경 - 방 번호: {}, memberId: {}, 참가자 번호: {}",
            roomId, memberId);

        roomRedisService.toggleReady(roomId, memberId);
        messageService.sendRoomUpdate(roomId);
    }

    /**
     * 게임 시작
     */
    @MessageMapping("/room/start/{roomId}")
    @SendTo("/topic/room/{roomId}")
    public String handleGameStart(
        @DestinationVariable Long roomId,
        @AuthenticationPrincipal StompPrincipal detail
    ) throws JsonProcessingException {
        long memberId = Long.parseLong(detail.getName());
        log.info("게임 시작 요청 - 방 번호: {}, 방장 memberId: {}", roomId, memberId);

        roomRedisService.startGame(roomId, memberId);
        messageService.sendRoomUpdate(roomId);
        messageService.sendRoomListToAll();
        roomDbService.isActive(roomId);

        boolean isStart = gameService.startGame(roomId);
        return objectMapper.writeValueAsString(
            Map.of("gameStart", String.valueOf(isStart))
        );
    }
}
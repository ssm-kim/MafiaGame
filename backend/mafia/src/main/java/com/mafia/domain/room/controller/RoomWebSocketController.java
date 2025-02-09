package com.mafia.domain.room.controller;

import com.mafia.domain.game.service.GameService;
import com.mafia.domain.room.model.webSocket.RoomMessages;
import com.mafia.domain.room.service.RoomDbService;
import com.mafia.domain.room.service.RoomMessageService;
import com.mafia.domain.room.service.RoomRedisService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
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

    /**
     * 로비 입장 - 현재 방 목록 전송
     */
    @MessageMapping("/lobby/enter")
    public void handleLobbyEnter() {
        log.info("로비 입장 - 방 목록 전송");
        messageService.sendRoomListToAll();
    }

    /**
     * 방 입장 처리 및 정보 업데이트
     */
    @MessageMapping("/room/enter/{roomId}")
    public void handleRoomEnter(
        @DestinationVariable Long roomId,
        @Payload RoomMessages.EnterMessage message
    ) {
        log.info("방 입장 요청 - 방 번호: {}, 유저: {}", roomId, message.getMemberId());
        roomRedisService.enterRoom(roomId, message.getMemberId(), message.getPassword());
        messageService.sendRoomUpdate(roomId);
        messageService.sendRoomListToAll();
    }

    /**
     * 방 퇴장 처리 - 방장 퇴장시 방 삭제, 일반 유저는 정보 업데이트
     */
    @MessageMapping("/room/leave/{roomId}")
    public void handleRoomLeave(
        @DestinationVariable Long roomId,
        @Payload RoomMessages.LeaveMessage message
    ) {
        log.info("방 퇴장 요청 - 방 번호: {}, 유저: {}", roomId, message.getMemberId());
        boolean isHost = roomRedisService.isHost(roomId, message.getMemberId());

        roomRedisService.leaveRoom(roomId, message.getMemberId());
        if (isHost) {
            roomDbService.deleteRoom(roomId);
        } else {
            messageService.sendRoomUpdate(roomId);
        }
        messageService.sendRoomListToAll();
    }

    /**
     * 게임 준비 상태 토글
     */
    @MessageMapping("/room/ready/{roomId}")
    public void handleReadyToggle(
        @DestinationVariable Long roomId,
        @Payload RoomMessages.ReadyMessage message
    ) {
        log.info("준비 상태 변경 - 방 번호: {}, 유저: {}", roomId, message.getMemberId());
        roomRedisService.toggleReady(roomId, message.getMemberId());
        messageService.sendRoomUpdate(roomId);
    }

    /**
     * 게임 시작
     */
    @MessageMapping("/room/start/{roomId}")
    public void handleGameStart(
        @DestinationVariable Long roomId,
        @Payload RoomMessages.StartGameMessage message
    ) {
        log.info("게임 시작 - 방 번호: {}, 방장: {}", roomId, message.getMemberId());
        roomRedisService.startGame(roomId, message.getMemberId());

        // 방 정보 업데이트 (방 안의 유저들에게 전송)
        messageService.sendRoomUpdate(roomId);

        // 로비 방 목록 업데이트 (게임 중으로 상태 변경됨)
        messageService.sendRoomListToAll();

        // 방 게임 시작 활성화
        roomDbService.isActive(roomId);

        // 게임 서비스로 방 정보 전달 (주석 해제)
        gameService.startGame(roomId);
    }

    /**
     * 강제 퇴장 처리
     */
    @MessageMapping("/room/kick/{roomId}")
    public void handleKickMember(
        @DestinationVariable Long roomId,
        @Payload RoomMessages.KickMessage message
    ) {
        log.info("강제 퇴장 요청 - 방 번호: {}, 방장: {}, 대상: {}",
            roomId, message.getHostId(), message.getTargetId());
        roomRedisService.kickMember(roomId, message.getHostId(), message.getTargetId());
        messageService.sendRoomUpdate(roomId);
        messageService.sendRoomListToAll();
    }
}

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

@Slf4j
@Controller
@RequiredArgsConstructor
public class RoomWebSocketController {

    private final RoomMessageService messageService;
    private final RoomRedisService roomRedisService;
    private final RoomDbService roomDbService;
    private final GameService gameService;

    // 로비 관련 메시지 처리
    @MessageMapping("/lobby/enter")
    public void handleLobbyEnter() {
        log.info("User entered lobby - sending current room list");
        messageService.sendRoomListToAll();
    }

    // 방 입장
    @MessageMapping("/room/enter/{roomId}")
    public void handleRoomEnter(
        @DestinationVariable Long roomId,
        @Payload RoomMessages.EnterMessage message
    ) {
        log.info("Room enter request - roomId: {}, memberId: {}", roomId, message.getMemberId());
        roomRedisService.enterRoom(roomId, message.getMemberId(), message.getPassword());
        messageService.sendRoomUpdate(roomId);
        messageService.sendRoomListToAll();
    }

    @MessageMapping("/room/leave/{roomId}")
    public void handleRoomLeave(
        @DestinationVariable Long roomId,
        @Payload RoomMessages.LeaveMessage message
    ) {
        log.info("Room leave request - roomId: {}, memberId: {}", roomId, message.getMemberId());
        boolean isHost = roomRedisService.isHost(roomId, message.getMemberId());

        roomRedisService.leaveRoom(roomId, message.getMemberId());
        if (isHost) {
            roomDbService.deleteRoom(roomId);
        } else {
            messageService.sendRoomUpdate(roomId);
        }

        System.out.println("호스트가 있나요 ?  " + isHost);
        messageService.sendRoomListToAll();
    }

    @MessageMapping("/room/ready/{roomId}")
    public void handleReadyToggle(
        @DestinationVariable Long roomId,
        @Payload RoomMessages.ReadyMessage message
    ) {
        log.info("Ready toggle request - roomId: {}, memberId: {}", roomId, message.getMemberId());
        roomRedisService.toggleReady(roomId, message.getMemberId());
        messageService.sendRoomUpdate(roomId);
    }

    @MessageMapping("/room/start/{roomId}")
    public void handleGameStart(
        @DestinationVariable Long roomId,
        @Payload RoomMessages.StartGameMessage message
    ) {
        log.info("Game start request - roomId: {}, memberId: {}", roomId, message.getMemberId());
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

    @MessageMapping("/room/kick/{roomId}")
    public void handleKickMember(
        @DestinationVariable Long roomId,
        @Payload RoomMessages.KickMessage message
    ) {
        log.info("Kick request - roomId: {}, hostId: {}, targetId: {}",
            roomId, message.getHostId(), message.getTargetId());
        roomRedisService.kickMember(roomId, message.getHostId(), message.getTargetId());
        messageService.sendRoomUpdate(roomId);
        messageService.sendRoomListToAll();
    }

}

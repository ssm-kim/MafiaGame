package com.mafia.domain.room.controller;

import com.mafia.domain.game.service.GameService;
import com.mafia.domain.login.model.dto.AuthenticatedUser;
import com.mafia.domain.room.model.webSocket.RoomMessages;
import com.mafia.domain.room.service.RoomDbService;
import com.mafia.domain.room.service.RoomMessageService;
import com.mafia.domain.room.service.RoomRedisService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
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
        @AuthenticationPrincipal AuthenticatedUser detail,
        SimpMessageHeaderAccessor headerAccessor
    ) {
        String sessionId = headerAccessor.getSessionId();
        log.info("방 입장 요청 - 방 번호: {}, 유저: {}, 세션: {}", roomId, detail.getMemberId(), sessionId);

        // 세션ID-멤버ID 매핑 저장
        // roomRedisService.saveSession(sessionId, detail.getMemberId(););

        roomRedisService.enterRoom(roomId, detail.getMemberId(), message.getPassword(), sessionId);
        messageService.sendRoomUpdate(roomId);
        messageService.sendRoomListToAll();
    }

    /**
     * 방 퇴장 처리 (방장 퇴장 시 방 삭제)
     */
    @MessageMapping("/room/leave/{roomId}")
    public void handleRoomLeave(
        @DestinationVariable Long roomId,
        @Payload RoomMessages.LeaveMessage message,
        @AuthenticationPrincipal AuthenticatedUser detail
    ) {
        String targetSessionId = message.getTargetSessionId();
        log.info("방 퇴장 요청 - 방 번호: {}, 유저: {}, 세션: {}", roomId, detail.getMemberId(),
            targetSessionId);
        boolean isHost = roomRedisService.isHost(roomId, detail.getMemberId());

        roomRedisService.leaveRoom(roomId, detail.getMemberId(), targetSessionId);
        if (isHost) {
            roomDbService.deleteRoom(roomId);
        } else {
            messageService.sendRoomUpdate(roomId);
        }
        messageService.sendRoomListToAll();
    }

    /**
     * 강제 퇴장 처리 (방장 권한 확인)
     */
    @MessageMapping("/room/kick/{roomId}")
    public void handleKickMember(
        @DestinationVariable Long roomId,
        @Payload RoomMessages.KickMessage message,
        @AuthenticationPrincipal AuthenticatedUser detail
    ) {
        String targetSessionId = message.getTargetSessionId();
        log.info("강제 퇴장 요청 - 방 번호: {}, 방장: {}, 대상 세션: {}",
            roomId, detail.getMemberId(), targetSessionId);

        roomRedisService.kickMember(roomId, detail.getMemberId(), targetSessionId);
        messageService.sendRoomUpdate(roomId);
        messageService.sendRoomListToAll();
    }

    /**
     * 게임 준비 상태 토글
     */
    @MessageMapping("/room/ready/{roomId}")
    public void handleReadyToggle(
        @DestinationVariable Long roomId,
        @AuthenticationPrincipal AuthenticatedUser detail
    ) {
        log.info("준비 상태 변경 - 방 번호: {}, 유저: {}", roomId, detail.getMemberId());
        roomRedisService.toggleReady(roomId, detail.getMemberId());
        messageService.sendRoomUpdate(roomId);
    }

    /**
     * 게임 시작 처리
     */
    @MessageMapping("/room/start/{roomId}")
    public void handleGameStart(
        @DestinationVariable Long roomId,
        @AuthenticationPrincipal AuthenticatedUser detail
    ) {
        log.info("게임 시작 - 방 번호: {}, 방장: {}", roomId, detail.getMemberId());
        roomRedisService.startGame(roomId, detail.getMemberId());

        // 방 정보 업데이트 (방 안의 유저들에게 전송)
        messageService.sendRoomUpdate(roomId);

        // 로비 방 목록 업데이트 (게임 중으로 상태 변경됨)
        messageService.sendRoomListToAll();

        // 방 게임 시작 활성화
        roomDbService.isActive(roomId);

        // 게임 서비스로 방 정보 전달 (주석 해제)
        gameService.startGame(roomId);
    }
}

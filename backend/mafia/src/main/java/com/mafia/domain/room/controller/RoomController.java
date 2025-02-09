package com.mafia.domain.room.controller;

import com.mafia.domain.login.model.dto.AuthenticatedUser;
import com.mafia.domain.room.model.redis.RoomInfo;
import com.mafia.domain.room.model.request.RoomRequest;
import com.mafia.domain.room.model.response.RoomIdResponse;
import com.mafia.domain.room.model.response.RoomResponse;
import com.mafia.domain.room.service.RoomDbService;
import com.mafia.global.common.model.dto.BaseResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Room 관련 REST API Controller 방 생성, 조회, 삭제 등 기본적인 방 관리 기능을 담당
 */

@RestController
@RequestMapping("/api/room")
@RequiredArgsConstructor
public class RoomController {

    private final SimpMessageSendingOperations messagingTemplate;
    private final RoomDbService roomDbService;

    /**
     * 새로운 게임 방을 생성 방 생성 후 로비의 구독자들에게 업데이트된 방 목록을 전송
     */
    @PostMapping
    public ResponseEntity<BaseResponse<RoomIdResponse>> createRoom(
        @RequestBody RoomRequest roomRequest,
        @AuthenticationPrincipal AuthenticatedUser detail
    ) {
        RoomIdResponse response = roomDbService.createRoom(roomRequest, detail.getMemberId());
        messagingTemplate.convertAndSend("/topic/lobby", roomDbService.getAllRooms());
        return ResponseEntity.ok(new BaseResponse<>(response));
    }

    /**
     * 전체 방 목록 조회
     */
    @GetMapping
    public ResponseEntity<BaseResponse<List<RoomResponse>>> getAllRooms() {
        List<RoomResponse> rooms = roomDbService.getAllRooms();
        return ResponseEntity.ok(new BaseResponse<>(rooms));
    }

    /**
     * 특정 방의 상세 정보를 조회
     */
    @GetMapping("/{roomId}")
    public ResponseEntity<BaseResponse<RoomInfo>> getRoom(
        @PathVariable Long roomId) {
        RoomInfo room = roomDbService.getRoom(roomId);
        return ResponseEntity.ok(new BaseResponse<>(room));
    }

    /**
     * 특정 방을 삭제
     */
    @DeleteMapping("/{roomId}")
    public ResponseEntity<BaseResponse<Void>> deleteRoom(
        @PathVariable Long roomId) {
        roomDbService.deleteRoom(roomId);
        return ResponseEntity.ok(new BaseResponse<>());
    }
}
package com.mafia.domain.room.controller;

import com.mafia.domain.login.model.dto.CustomOAuth2User;
import com.mafia.domain.room.model.RoomRequest;
import com.mafia.domain.room.model.RoomResponse;
import com.mafia.domain.room.service.RoomDbService;
import com.mafia.domain.room.service.RoomRedisService;
import com.mafia.global.common.model.dto.BaseResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/room")
@RequiredArgsConstructor
public class RoomController {

    private final RoomDbService roomDbService;
    private final RoomRedisService roomRedisService;

    /**
     * 새로운 게임방을 생성합니다.
     */
    @PostMapping
    public ResponseEntity<BaseResponse<Boolean>> createRoom(
        @RequestBody RoomRequest roomRequest,
        @AuthenticationPrincipal CustomOAuth2User detail
    ) {
        return ResponseEntity.ok(
            new BaseResponse<>(roomDbService.createRoom(roomRequest, detail.getMemberId())));
    }

    /**
     * 게임방을 삭제합니다.
     */
    @DeleteMapping("/{roomId}")
    public ResponseEntity<BaseResponse<Boolean>> deleteRoom(
        @PathVariable Long roomId) {
        roomDbService.deleteRoom(roomId);
        return ResponseEntity.ok(new BaseResponse<>());
    }

    /**
     * 모든 게임방 목록을 조회합니다.
     */
    @GetMapping
    public ResponseEntity<BaseResponse<List<RoomResponse>>> getAllRooms() {
        // Redis에서 모든 방의 현재 인원수를 한번에 조회
        List<RoomResponse> rooms = roomDbService.getAllRooms();
        return ResponseEntity.ok(new BaseResponse<>(rooms));
    }

    /**
     * 방 입장
     */
    @PostMapping("/{roomId}/enter")
    public ResponseEntity<BaseResponse<String>> enterRoom(
        @PathVariable Long roomId,
        @AuthenticationPrincipal CustomOAuth2User detail) {
        roomRedisService.enterRoom(roomId, detail.getMemberId());
        return ResponseEntity.ok(new BaseResponse<>("Entered room"));
    }

    /**
     * 방 퇴장
     */
    @PostMapping("/{roomId}/leave")
    public ResponseEntity<BaseResponse<String>> leaveRoom(
        @PathVariable Long roomId,
        @AuthenticationPrincipal CustomOAuth2User detail) {
        roomRedisService.leaveRoom(roomId, detail.getMemberId());
        return ResponseEntity.ok(new BaseResponse<>("Left room"));
    }

    /**
     * 준비 완료 여부
     */
    @PostMapping("/{roomId}/ready")
    public ResponseEntity<BaseResponse<String>> toggleReady(
        @PathVariable Long roomId,
        @AuthenticationPrincipal CustomOAuth2User detail) {
        roomRedisService.toggleReady(roomId, detail.getMemberId());
        return ResponseEntity.ok(new BaseResponse<>("Ready toggled"));
    }
}
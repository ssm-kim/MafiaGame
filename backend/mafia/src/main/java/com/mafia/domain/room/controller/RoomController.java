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

    // 할일
    // 방은 GameOption에서 설정한 최소/최대 인원 설정
    // 방장이 시작 시작 눌렀을 때 게임 로직 서비스 호출

    /*
    TODO: 방 관리 서비스
        1. 방은 하나의 게임 단위로 관리된다.
        2. 방은 GameOption에서 설정한 최소/최대 인원 제한을 따른다. (기본 4-8명)
        3. 플레이어는 한 번에 하나의 방에만 참여 가능하다.
        4. 호스트는 게임 시작만 가능하며, 준비는 불가능하다.
        5. 게임 시작은 모든 플레이어가 준비 상태일 때만 가능하다.
        6. 게임 진행 중에는 입장이 불가능하다.
        7. 호스트가 방을 나가면 방이 삭제된다.
    */

    @PostMapping
    public ResponseEntity<BaseResponse<Boolean>> createRoom(
        @RequestBody RoomRequest roomRequest,
        @AuthenticationPrincipal CustomOAuth2User detail
    ) {
        return ResponseEntity.ok(
            new BaseResponse<>(roomDbService.createRoom(roomRequest, detail.getMemberId())));
    }

    @DeleteMapping("/{roomId}")
    public ResponseEntity<BaseResponse<Boolean>> deleteRoom(
        @PathVariable Long roomId,
        @AuthenticationPrincipal CustomOAuth2User detail) {
        roomDbService.deleteRoom(roomId, detail.getMemberId());
        return ResponseEntity.ok(new BaseResponse<>());
    }

    @GetMapping
    public ResponseEntity<BaseResponse<List<RoomResponse>>> getAllRooms() {
        List<RoomResponse> rooms = roomDbService.getAllRooms();
        return ResponseEntity.ok(new BaseResponse<>(rooms));
    }

    @PostMapping("/{roomId}/enter")
    public ResponseEntity<BaseResponse<String>> enterRoom(
        @PathVariable Long roomId,
        @AuthenticationPrincipal CustomOAuth2User detail) {
        roomRedisService.enterRoom(roomId, detail.getMemberId());
        return ResponseEntity.ok(new BaseResponse<>("Entered room"));
    }

    @PostMapping("/{roomId}/leave")
    public ResponseEntity<BaseResponse<String>> leaveRoom(
        @PathVariable Long roomId,
        @AuthenticationPrincipal CustomOAuth2User detail) {
        roomRedisService.leaveRoom(roomId, detail.getMemberId());
        return ResponseEntity.ok(new BaseResponse<>("Left room"));
    }

    @PostMapping("/{roomId}/ready")
    public ResponseEntity<BaseResponse<String>> toggleReady(
        @PathVariable Long roomId,
        @AuthenticationPrincipal CustomOAuth2User detail) {
        roomRedisService.toggleReady(roomId, detail.getMemberId());
        return ResponseEntity.ok(new BaseResponse<>("Ready toggled"));
    }
}
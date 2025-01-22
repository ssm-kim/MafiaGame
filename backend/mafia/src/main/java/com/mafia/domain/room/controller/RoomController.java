package com.mafia.domain.room.controller;

import com.mafia.domain.room.model.dto.request.RoomRequest;
import com.mafia.domain.room.model.dto.response.RoomPlayerResponse;
import com.mafia.domain.room.model.dto.response.RoomResponse;
import com.mafia.domain.room.service.RoomService;
import com.mafia.global.common.model.dto.BaseResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/room")
@RequiredArgsConstructor
public class RoomController {
    private final RoomService roomService;

    /** 새로운 게임방을 생성합니다. */
    @PostMapping
    public ResponseEntity<BaseResponse<RoomResponse>> createRoom(@RequestBody RoomRequest roomRequest) {
        RoomResponse response = roomService.createRoom(roomRequest);
        return ResponseEntity.ok(new BaseResponse<>(response));
    }

    /** 모든 게임방 목록을 조회합니다. */
    @GetMapping
    public ResponseEntity<BaseResponse<List<RoomResponse>>> getAllRooms() {
        return ResponseEntity.ok(new BaseResponse<>(roomService.getAllRooms()));
    }

    /** 게임방을 삭제합니다. */
    @DeleteMapping("/{roomId}")
    public ResponseEntity<BaseResponse<String>> deleteRoom(@PathVariable Long roomId) {
        roomService.deleteRoom(roomId);
        return ResponseEntity.ok(new BaseResponse<>("Successfully deleted room"));
    }

    /** 게임방 입장 (인원수 증가) */
    @PostMapping("/{roomId}/enter")
    public ResponseEntity<BaseResponse<String>> enterRoom(
            @PathVariable Long roomId,
            @RequestParam Long memberId
            ) {

        roomService.increasePlayerCount(roomId, memberId);

        return ResponseEntity.ok(new BaseResponse<>("Successfully entered room"));
    }

    /** 게임방 퇴장 (인원수 감소) */
    @PostMapping("/{roomId}/leave")
    public ResponseEntity<BaseResponse<String>> leaveRoom(
            @PathVariable Long roomId,
            @RequestParam Long memberId) {

        roomService.decreasePlayerCount(roomId, memberId);

        return ResponseEntity.ok(new BaseResponse<>("Successfully left room"));
    }

    /** 게임방의 플레이어 목록을 조회합니다. */
    @GetMapping("/{roomId}/players")
    public ResponseEntity<BaseResponse<List<RoomPlayerResponse>>> getRoomPlayers(
            @PathVariable Long roomId) {
        return ResponseEntity.ok(new BaseResponse<>(roomService.getRoomPlayers(roomId)));
    }

    /** 준비 상태를 토글합니다. */
    @PostMapping("/{roomId}/ready")
    public ResponseEntity<BaseResponse<String>> toggleReady(
            @PathVariable Long roomId,
            @RequestParam Long memberId) {
        roomService.toggleReady(roomId, memberId);
        return ResponseEntity.ok(new BaseResponse<>("Successfully ready state toggle"));
    }

    /** 게임을 시작합니다. */
    @PostMapping("/{roomId}/start")
    public ResponseEntity<BaseResponse<String>> startGame(
            @PathVariable Long roomId,
            @RequestParam Long memberId) {
        roomService.startGame(roomId, memberId);
        return ResponseEntity.ok(new BaseResponse<>("Successfully Game start"));
    }

}
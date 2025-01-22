package com.mafia.domain.room.controller;

import com.mafia.global.common.model.dto.BaseResponse;
import com.mafia.domain.room.model.dto.request.RoomRequest;
import com.mafia.domain.room.model.dto.response.RoomResponse;
import com.mafia.domain.room.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rooms")
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

//    /** 특정 게임방의 상세 정보를 조회합니다. */
//    @GetMapping("/{roomId}")
//    public ResponseEntity<BaseResponse<RoomResponse>> getRoom(@PathVariable Long roomId) {
//        return ResponseEntity.ok(new BaseResponse<>(roomService.getRoom(roomId)));
//    }

//    /** 게임방 정보를 수정합니다. */
//    @PutMapping("/{roomId}")
//    public ResponseEntity<BaseResponse<RoomResponse>> updateRoom(
//            @PathVariable Long roomId,
//            @RequestBody RoomRequest roomRequest) {
//        return ResponseEntity.ok(new BaseResponse<>(roomService.updateRoom(roomId, roomRequest)));
//    }
}
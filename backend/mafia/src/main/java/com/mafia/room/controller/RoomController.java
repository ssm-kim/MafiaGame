package com.mafia.room.controller;

import com.mafia.global.common.model.dto.BaseResponse;
import com.mafia.global.common.model.dto.BaseResponseStatus;
import com.mafia.room.dto.request.RoomRequest;
import com.mafia.room.dto.response.RoomResponse;
import com.mafia.room.entity.Room;
import com.mafia.room.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class RoomController {
    private final RoomService roomService;

    /** 새로운 게임방을 생성합니다. */
    @PostMapping
    public BaseResponse<RoomResponse> createRoom(@RequestBody RoomRequest requestDto) {
        RoomResponse response = roomService.createRoom(requestDto);
        return new BaseResponse<>(response);
    }

    /** 모든 게임방 목록을 조회합니다. */
    @GetMapping
    public BaseResponse<List<RoomResponse>> getAllRooms() {
        return new BaseResponse<>(roomService.getAllRooms());
    }

    /** 특정 게임방의 상세 정보를 조회합니다. */
    @GetMapping("/{roomId}")
    public BaseResponse<RoomResponse> getRoom(@PathVariable Long roomId) {
        return new BaseResponse<>(roomService.getRoom(roomId));
    }

    /** 게임방 정보를 수정합니다. */
    @PutMapping("/{roomId}")
    public BaseResponse<RoomResponse> updateRoom(
            @PathVariable Long roomId,
            @RequestBody RoomRequest requestDto) {
        return new BaseResponse<>(roomService.updateRoom(roomId, requestDto));
    }

    /** 게임방을 삭제합니다. */
    @DeleteMapping("/{roomId}")
    public BaseResponse<String> deleteRoom(@PathVariable Long roomId) {
        roomService.deleteRoom(roomId);
        return new BaseResponse<>("Successfully deleted room");
    }
}
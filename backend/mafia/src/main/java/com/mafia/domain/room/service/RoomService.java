package com.mafia.domain.room.service;

import com.mafia.domain.room.model.dto.request.RoomRequest;
import com.mafia.domain.room.model.dto.response.RoomResponse;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Transactional(readOnly = true)
public interface RoomService {

    RoomResponse createRoom(RoomRequest roomRequest);
    List<RoomResponse> getAllRooms();
    RoomResponse getRoom(Long roomId);
    RoomResponse updateRoom(Long roomId, RoomRequest roomRequest);
    void deleteRoom(Long roomId);

    // 인원 증감 메서드
    void increasePlayerCount(Long roomId, Long memberId);
    void decreasePlayerCount(Long roomId, Long memberId);
}
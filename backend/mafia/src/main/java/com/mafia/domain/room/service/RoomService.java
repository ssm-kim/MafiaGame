package com.mafia.domain.room.service;

import com.mafia.domain.room.model.dto.request.RoomRequest;
import com.mafia.domain.room.model.dto.response.RoomPlayerResponse;
import com.mafia.domain.room.model.dto.response.RoomResponse;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Transactional(readOnly = true)
public interface RoomService {

    // 방 생성 - 최초 1회만 설정 가능
    RoomResponse createRoom(RoomRequest roomRequest);
    // 방 목록 조회
    List<RoomResponse> getAllRooms();
    // 방 삭제 - 방장만 가능
    void deleteRoom(Long roomId);

    // 인원 증감
    void increasePlayerCount(Long roomId, Long memberId);
    void decreasePlayerCount(Long roomId, Long memberId);

    // 방 참가 후 준비완료
    List<RoomPlayerResponse> getRoomPlayers(Long roomId);
    void toggleReady(Long roomId, Long memberId);
    void startGame(Long roomId, Long memberId);
}
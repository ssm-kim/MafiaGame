package com.mafia.domain.room.service;

import com.mafia.domain.room.model.Room;
import com.mafia.domain.room.model.RoomRequest;
import com.mafia.domain.room.model.RoomResponse;
import com.mafia.domain.room.repository.RoomRepository;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class RoomDbService {

    private final RoomRepository DbRoomRepository;
    private final RoomRedisService roomRedisService;

    /**
     * 새로운 게임방을 생성합니다.
     */
    public boolean createRoom(RoomRequest roomRequest) {
        // 1. RDB에 방 생성
        Room room = new Room();
        room.setHostId(roomRequest.getHostId());
        room.setRoomTitle(roomRequest.getRoomTitle());

        Room savedRoom = DbRoomRepository.save(room);

        // 2. Redis에 방 정보 저장
        roomRedisService.createRoomInfo(savedRoom.getRoomId(), savedRoom.getHostId());

        return true;
    }

    /**
     * 모든 게임방 목록을 반환합니다.
     */
    public List<RoomResponse> getAllRooms() {
        List<Room> rooms = DbRoomRepository.findAll();
        HashMap<Long, Integer> allRoomInfo = roomRedisService.roomsCount();
        List<RoomResponse> result = new ArrayList<>();

        for (Room room : rooms) {
            RoomResponse roomResponse = new RoomResponse();
            roomResponse.setRoomTitle(room.getRoomTitle());
            roomResponse.setRoomId(room.getRoomId());
            roomResponse.setPeopleCnt(allRoomInfo.get(room.getRoomId()));
            result.add(roomResponse);
        }
        return result;
    }

    /**
     * 게임방을 삭제합니다.
     */
    public void deleteRoom(Long roomId) {
        DbRoomRepository.deleteById(roomId);
        roomRedisService.deleteById(roomId);
    }
}
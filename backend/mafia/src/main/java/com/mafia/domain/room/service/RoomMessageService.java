package com.mafia.domain.room.service;

import com.mafia.domain.room.model.RoomResponse;
import com.mafia.domain.room.model.redis.RoomInfo;
import java.util.HashMap;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RoomMessageService {

    private final SimpMessageSendingOperations messagingTemplate;
    private final RoomDbService roomDbService;
    private final TestRoomRedisService roomRedisService;

    // 로비의 모든 유저에게 방 목록 전송
    public void sendRoomListToAll() {
        // 기존 getAllRooms 활용
        List<RoomResponse> rooms = roomDbService.getAllRooms();
        // 기존 roomsCount 활용
        HashMap<Long, Integer> roomPlayerCounts = roomRedisService.roomsCount();

        for (RoomResponse room : rooms) {
            room.setPeopleCnt(roomPlayerCounts.getOrDefault(room.getRoomId(), 0));
        }

        messagingTemplate.convertAndSend("/topic/lobby", rooms);
    }

    // 특정 방의 정보를 해당 방 유저들에게 전송
    public void sendRoomUpdate(Long roomId) {
        // 기존 findById 활용
        RoomInfo roomInfo = roomRedisService.findById(roomId);
        messagingTemplate.convertAndSend("/topic/room/" + roomId, roomInfo);
    }
}

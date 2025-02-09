package com.mafia.domain.room.service;

import com.mafia.domain.room.model.redis.RoomInfo;
import com.mafia.domain.room.model.response.RoomResponse;
import java.util.HashMap;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Service;

/**
 * 실시간 방 정보 메시지 전송 서비스 - WebSocket을 통해 로비와 방의 실시간 정보를 전송
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class RoomMessageService {

    private final SimpMessageSendingOperations messagingTemplate;
    private final RoomRedisService roomRedisService;
    private final RoomDbService roomDbService;

    /**
     * 로비의 전체 방 목록 전송 - 각 방의 현재 인원수 정보를 포함
     */
    public void sendRoomListToAll() {
        HashMap<Long, Integer> roomPlayerCounts = roomRedisService.getRoomPlayerCounts();
        List<RoomResponse> rooms = roomDbService.getAllRooms();

        // Redis 데이터로 현재 인원 업데이트
        for (RoomResponse room : rooms) {
            room.setPeopleCnt(roomPlayerCounts.getOrDefault(room.getRoomId(), 0));
        }

        log.info("로비 방 목록 전송 - 총 {}개 방", rooms.size());
        messagingTemplate.convertAndSend("/topic/lobby", rooms);
    }

    /**
     * 특정 방의 실시간 정보를 해당 방 참가자들에게 전송
     */
    public void sendRoomUpdate(Long roomId) {
        RoomInfo roomInfo = roomRedisService.findById(roomId);
        log.info("방 정보 업데이트 - 방 번호: {}", roomId);
        messagingTemplate.convertAndSend("/topic/room/" + roomId, roomInfo);
    }
}

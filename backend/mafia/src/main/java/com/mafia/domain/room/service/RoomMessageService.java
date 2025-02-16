package com.mafia.domain.room.service;

import com.mafia.domain.room.model.redis.Participant;
import com.mafia.domain.room.model.redis.RoomInfo;
import com.mafia.domain.room.model.response.RoomParticipantResponse;
import com.mafia.domain.room.model.response.RoomResponse;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
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

        log.info("로비 방 목록 전송 - 전체 방 개수: {}\n", rooms.size());
        messagingTemplate.convertAndSend("/topic/lobby", rooms);
    }

    /**
     * 방 참가자들에게 실시간 참가자 정보를 전송
     */
    public void sendRoomUpdate(Long roomId) {
        RoomInfo roomInfo = roomRedisService.findById(roomId);
        Map<Integer, RoomParticipantResponse> participantInfo = new HashMap<>();

        for (Entry<Integer, Long> entry : roomInfo.getMemberMapping().entrySet()) {
            int participantNo = entry.getKey();
            long memberId = entry.getValue();
            Participant participant = roomInfo.getParticipant().get(memberId);

            RoomParticipantResponse response = RoomParticipantResponse.builder()
                .participantNo(participantNo)
                .nickname(participant.getNickName())
                .isReady(participant.isReady())
                .build();
            participantInfo.put(participantNo, response);
        }

        log.info("방 정보 업데이트 - roomId: {}, 총 참가자 수: {}, 준비된 참가자 수( 방장 제외 ): {}\n",
            roomId,
            participantInfo.size(),
            participantInfo.values().stream().filter(RoomParticipantResponse::isReady).count());

        messagingTemplate.convertAndSend("/topic/room/" + roomId, participantInfo);
    }

    public void sendRoomStart(Long roomId) {
        List<RoomResponse> rooms = roomDbService.getAllRooms();

        for (RoomResponse room : rooms) {
            if (room.getRoomId().equals(roomId)) {
                room.setStart(true);
            }
        }

        log.info("게임 시작 알림 - roomId: {}, 게임 진행중인 방 개수: {}\n",
            roomId,
            rooms.stream().filter(RoomResponse::isStart).count());

        messagingTemplate.convertAndSend("/topic/lobby", rooms);
    }
}
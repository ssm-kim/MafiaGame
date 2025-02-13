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
        List<RoomResponse> rooms = roomDbService.getAllRooms();
        log.info("로비 방 목록 전송 - 총 {}개 방", rooms.size());

        // 로비 유저들은 방 목록만 받음 (준비 상태 등 상세 정보 제외)
        messagingTemplate.convertAndSend("/topic/lobby", rooms);
    }

    /**
     * 방 참가자들에게 실시간 참가자 정보를 전송
     */
    public void sendRoomUpdate(Long roomId) {
        RoomInfo roomInfo = roomRedisService.findById(roomId);
        log.info("방 정보 업데이트 - 방 번호: {}", roomId);

        // participantNo를 키로 하는 Map으로 구성하여 프론트엔드에서 쉽게 참가자 정보를 업데이트할 수 있도록 함
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

        messagingTemplate.convertAndSend("/topic/room/" + roomId, participantInfo);
    }
}

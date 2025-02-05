package com.mafia.domain.game.service;

import com.mafia.domain.game.model.pos.PlayerPosition;
import com.mafia.domain.room.model.redis.Participant;
import com.mafia.domain.room.model.redis.RoomInfo;
import com.mafia.domain.room.repository.RoomRedisRepository;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class GamePositionService {

    private final Map<Long, Map<Long, PlayerPosition>> gamePositions = new ConcurrentHashMap<>();
    private final RoomRedisRepository roomRedisRepository;

    public void initPos(Long roomId) {
        // Redis에서 방 정보 조회
        RoomInfo roomInfo = roomRedisRepository.findById(roomId);
        Map<Long, PlayerPosition> positions = new ConcurrentHashMap<>();
        int playerCnt = roomInfo.getRequiredPlayers();

        // 플레이어 수에 맞게 초기 위치 배열 생성
        int[][] initPos = new int[playerCnt][2];
        int spacing = 100;  // 플레이어 간 간격

        for (int i = 0; i < playerCnt; i++) {
            initPos[i][0] = 100 + (i % 3) * spacing;  // 3열로 배치
            initPos[i][1] = 100 + (i / 3) * spacing;  // 필요한 만큼 행 추가
        }

        int i = 0;
        for (Participant participant : roomInfo.getParticipant().values()) {
            positions.put(participant.getMemberId(), new PlayerPosition(
                participant.getMemberId(),
                initPos[i][0],
                initPos[i][1]
            ));
            i++;
        }
        gamePositions.put(roomId, positions);

    }
 
    public Map<Long, PlayerPosition> updateAndGetPositions(Long roomId,
        PlayerPosition newPosition) {

        log.info("Position update for room {}: MemberId {} at ({}, {})", roomId,
            newPosition.getMemberId(), newPosition.getX(), newPosition.getY());

        Map<Long, PlayerPosition> roomPositions = gamePositions.get(roomId);
        if (roomPositions != null) {
            roomPositions.put(newPosition.getMemberId(), newPosition);
        }
        return roomPositions;
    }
}

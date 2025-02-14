package com.mafia.domain.room.controller;

import com.mafia.domain.game.model.game.GameOption;
import com.mafia.domain.game.service.GameService;
import com.mafia.domain.room.model.redis.Participant;
import com.mafia.domain.room.model.redis.RoomInfo;
import com.mafia.domain.room.repository.RoomRedisRepository;
import com.mafia.domain.room.service.RoomDbService;
import com.mafia.domain.room.service.RoomRedisService;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/test")
@RequiredArgsConstructor
public class TestDataController {

    private final RoomDbService roomDbService;
    private final RoomRedisService roomRedisService;
    private final RoomRedisRepository redisRepository;
    private final GameService gameService;

    @PostMapping("/init-dummy-data")
    public ResponseEntity<String> initDummyData() {
        try {
            // 첫 번째 방 (길동의 방)
            RoomInfo room1 = new RoomInfo(1L, "테스트방 1", null, 4, new GameOption());
            Participant host1 = new Participant(5L, "길동");  // member_id: 5
            host1.setReady(true);
            room1.getParticipant().put(5L, host1);
            room1.getMemberMapping().put(1, 5L);

            // 두 번째 방 (준표의 방)
            RoomInfo room2 = new RoomInfo(2L, "테스트방 2", null, 7, new GameOption());
            Participant host2 = new Participant(6L, "준표");  // member_id: 6
            host2.setReady(true);
            room2.getParticipant().put(6L, host2);
            room2.getMemberMapping().put(1, 6L);

            // 세 번째 방 (성욱의 방)
            RoomInfo room3 = new RoomInfo(3L, "비밀방 테스트", "1234", 8, new GameOption());
            Participant host3 = new Participant(7L, "성욱");  // member_id: 7
            host3.setReady(true);
            room3.getParticipant().put(7L, host3);
            room3.getMemberMapping().put(1, 7L);

            // 네 번째 방 (철수의 방)
            RoomInfo room4 = new RoomInfo(4L, "테스트방 4", null, 5, new GameOption());
            Participant host4 = new Participant(100L, "철수");  // member_id: 100
            host4.setReady(true);
            room4.getParticipant().put(100L, host4);
            room4.getMemberMapping().put(1, 100L);

            // 맵 데이터 검증
            validateRoomMaps(room1);
            validateRoomMaps(room2);
            validateRoomMaps(room3);
            validateRoomMaps(room4);

            // Redis에 저장
            redisRepository.save(1L, room1);
            redisRepository.save(2L, room2);
            redisRepository.save(3L, room3);
            redisRepository.save(4L, room4);

            log.info("더미 데이터 초기화 완료 - 네 개의 방이 생성됨");

            return ResponseEntity.ok("더미 데이터 초기화 완료");

        } catch (Exception e) {
            log.error("더미 데이터 초기화 중 에러 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("더미 데이터 초기화 실패: " + e.getMessage());
        }
    }

    /**
     * RoomInfo의 맵 데이터 정합성 검증
     */
    private void validateRoomMaps(RoomInfo roomInfo) {
        // 1. participant와 memberMapping의 크기 비교
        if (roomInfo.getParticipant().size() != roomInfo.getMemberMapping().size()) {
            throw new IllegalStateException(
                String.format("방 %d: participant 크기(%d)와 memberMapping 크기(%d)가 일치하지 않습니다.",
                    roomInfo.getRoomId(),
                    roomInfo.getParticipant().size(),
                    roomInfo.getMemberMapping().size())
            );
        }

        // 2. memberMapping의 각 memberId가 participant에 존재하는지 확인
        for (Map.Entry<Integer, Long> entry : roomInfo.getMemberMapping().entrySet()) {
            if (!roomInfo.getParticipant().containsKey(entry.getValue())) {
                throw new IllegalStateException(
                    String.format("방 %d: memberMapping의 memberId %d가 participant에 존재하지 않습니다.",
                        roomInfo.getRoomId(),
                        entry.getValue())
                );
            }
        }

        // 3. 로그 출력
        log.info("방 {} 맵 검증 완료 - participant: {}, memberMapping: {}",
            roomInfo.getRoomId(),
            roomInfo.getParticipant(),
            roomInfo.getMemberMapping()
        );
    }
}
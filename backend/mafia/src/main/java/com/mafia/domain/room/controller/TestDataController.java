package com.mafia.domain.room.controller;

import com.mafia.domain.game.model.game.GameOption;
import com.mafia.domain.room.model.redis.Participant;
import com.mafia.domain.room.model.redis.RoomInfo;
import com.mafia.domain.room.repository.RoomRedisRepository;
import com.mafia.domain.room.service.RoomDbService;
import com.mafia.domain.room.service.RoomRedisService;
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

    @PostMapping("/init-dummy-data")
    public ResponseEntity<String> initDummyData() {
        try {

            // 첫 번째 방 생성 (철수의 방)
            RoomInfo room1 = new RoomInfo(1000L, "철수의 테스트방", null, 4, new GameOption());

            // 방장(철수) 정보만 설정
            Participant host1 = new Participant("철수");
            host1.setReady(true);
            room1.getParticipant().put(1, host1);
            room1.getMemberMapping().put(1, 100L);  // 방장만 매핑

            // 두 번째 방도 동일하게
            RoomInfo room2 = new RoomInfo(2000L, "영희의 테스트방", null, 4, new GameOption());
            Participant host2 = new Participant("영희");
            host2.setReady(true);
            room2.getParticipant().put(1, host2);
            room2.getMemberMapping().put(1, 200L);

            // Redis에 저장
            redisRepository.save(1000L, room1);
            redisRepository.save(2000L, room2);

            log.info("더미 데이터 초기화 완료 - 두 개의 방이 생성됨");
            return ResponseEntity.ok("더미 데이터 초기화 완료");

        } catch (Exception e) {
            log.error("더미 데이터 초기화 중 에러 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("더미 데이터 초기화 실패: " + e.getMessage());
        }
    }
}
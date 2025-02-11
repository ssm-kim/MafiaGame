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
            // 방 생성 (Redis)
            GameOption gameOption = new GameOption();  // 기본 게임 옵션
            RoomInfo roomInfo = new RoomInfo(1000L, "철수의 방", null, 8, gameOption);

            // 방장(철수) 정보 설정
            Participant host = new Participant("철수");
            // host.setReady(true);  // 방장은 항상 ready

            // 1번(방장)으로 등록
            roomInfo.getParticipant().put(1L, host);        // 참가자 맵: 1번 - 방장 정보
            roomInfo.getMemberMapping().put(1, 100L);        // 매핑 맵: 1번 - 방장 memberId

            // 참가자 추가 (영희)
            Participant participant1 = new Participant("영희");
            roomInfo.getParticipant().put(2L, participant1);
            roomInfo.getMemberMapping().put(2, 200L);

            // 참가자 추가 (민수)
            Participant participant2 = new Participant("민수");
            roomInfo.getParticipant().put(3L, participant2);
            roomInfo.getMemberMapping().put(3, 300L);

            // 참가자 추가 (영희)
            Participant participant3 = new Participant("영희aaaaaaaaa");
            roomInfo.getParticipant().put(4L, participant3);
            roomInfo.getMemberMapping().put(4, 400L);

            // 참가자 추가 (민수)
            Participant participant4 = new Participant("민수ssss");
            roomInfo.getParticipant().put(5L, participant4);
            roomInfo.getMemberMapping().put(5, 500L);

            // Redis에 저장
            redisRepository.save(1000L, roomInfo);

            log.info("더미 데이터 초기화 완료");
            return ResponseEntity.ok("더미 데이터 초기화 완료");
        } catch (Exception e) {
            log.error("더미 데이터 초기화 중 에러 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("더미 데이터 초기화 실패: " + e.getMessage());
        }
    }
}
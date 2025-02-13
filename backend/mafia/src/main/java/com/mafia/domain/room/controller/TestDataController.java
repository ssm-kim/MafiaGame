package com.mafia.domain.room.controller;

import com.mafia.domain.game.model.game.GameOption;
import com.mafia.domain.game.service.GameService;
import com.mafia.domain.room.model.redis.Participant;
import com.mafia.domain.room.model.redis.RoomInfo;
import com.mafia.domain.room.repository.RoomRedisRepository;
import com.mafia.domain.room.service.RoomDbService;
import com.mafia.domain.room.service.RoomRedisService;
import java.util.Random;
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

            Random random = new Random();

            // 첫 번째 방 (최대 4명)
            RoomInfo room1 = new RoomInfo(1L, "테스트방 1", null, 4, new GameOption());
            int peopleCnt1 = random.nextInt(4) + 1; // 1~4명 랜덤 (최소 1명은 방장)

            // 방장 등록 (항상 존재)
            Participant host1 = new Participant(5L, "길동");
            room1.getParticipant().put(5L, host1);
            room1.getMemberMapping().put(1, 5L);

            // 추가 참가자 랜덤 등록 (2번부터)
            Long[] memberIds1 = {300L, 400L, 500L}; // 가능한 참가자 풀
            String[] nicknames1 = {"민수", "진희", "준호"};
            for (int i = 0; i < peopleCnt1 - 1; i++) {
                Participant participant = new Participant(memberIds1[i], nicknames1[i]);
                participant.setReady(random.nextBoolean()); // 준비 상태 랜덤
                room1.getParticipant().put(memberIds1[i], participant);
                room1.getMemberMapping().put(i + 2, memberIds1[i]); // 2번부터 순차적으로 할당
            }

            // 두 번째 방 (최대 7명)
            RoomInfo room2 = new RoomInfo(2L, "테스트방 2", null, 7, new GameOption());
            int peopleCnt2 = random.nextInt(7) + 1; // 1~7명 랜덤

            // 방장 등록
            Participant host2 = new Participant(6L, "준표");
            room2.getParticipant().put(6L, host2);
            room2.getMemberMapping().put(1, 6L);

            // 추가 참가자 랜덤 등록
            Long[] memberIds2 = {300L, 400L, 500L, 100L, 200L, 7L}; // 가능한 참가자 풀
            String[] nicknames2 = {"민수", "진희", "준호", "철수", "영희", "성욱"};
            for (int i = 0; i < peopleCnt2 - 1; i++) {
                Participant participant = new Participant(memberIds2[i], nicknames2[i]);
                participant.setReady(random.nextBoolean());
                room2.getParticipant().put(memberIds2[i], participant);
                room2.getMemberMapping().put(i + 2, memberIds2[i]);
            }

            // 세 번째 방 (비밀방, 최대 8명)
            RoomInfo room3 = new RoomInfo(3L, "비밀방 테스트", "1234", 8, new GameOption());
            int peopleCnt3 = random.nextInt(8) + 1; // 1~8명 랜덤

            // 방장 등록
            Participant host3 = new Participant(7L, "성욱");
            room3.getParticipant().put(7L, host3);
            room3.getMemberMapping().put(1, 7L);

            // Redis에 저장
            redisRepository.save(1L, room1);
            redisRepository.save(2L, room2);
            redisRepository.save(3L, room3);

            log.info("더미 데이터 초기화 완료 - room1: {}명, room2: {}명, room3: {}명",
                peopleCnt1, peopleCnt2, peopleCnt3);

            return ResponseEntity.ok("더미 데이터 초기화 완료");

        } catch (Exception e) {
            log.error("더미 데이터 초기화 중 에러 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("더미 데이터 초기화 실패: " + e.getMessage());
        }
    }
}
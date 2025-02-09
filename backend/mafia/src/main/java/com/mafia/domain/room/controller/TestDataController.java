package com.mafia.domain.room.controller;

import com.mafia.domain.game.model.game.GameOption;
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

    @PostMapping("/init-dummy-data")
    public ResponseEntity<String> initDummyData() {
        try {
            // 각 방마다 Redis 데이터 초기화
            // 각 방마다 Redis 데이터 초기화
            roomRedisService.createRoomInfo(1L, 1L, 3, "테스트방 1", null, new GameOption());
            roomRedisService.createRoomInfo(2L, 2L, 3, "테스트방 2", null, new GameOption());
            roomRedisService.createRoomInfo(3L, 3L, 2, "비밀방 테스트", "1234", new GameOption());
            roomRedisService.createRoomInfo(4L, 4L, 8, "테스트방 4", null, new GameOption());

            log.info("더미 데이터 초기화 완료");

            return ResponseEntity.ok("더미 데이터 초기화 완료");
        } catch (Exception e) {
            log.error("더미 데이터 초기화 중 에러 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("더미 데이터 초기화 실패: " + e.getMessage());
        }
    }
}
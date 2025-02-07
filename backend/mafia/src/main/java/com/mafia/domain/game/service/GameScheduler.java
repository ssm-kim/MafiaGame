package com.mafia.domain.game.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mafia.domain.game.event.GamePublisher;
import com.mafia.domain.game.model.game.GamePhase;
import com.mafia.domain.game.repository.GameSeqRepository;
import java.util.HashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.Set;

@Service
@RequiredArgsConstructor
public class GameScheduler {

    private final GameService gameService;
    private final GameSeqRepository gameSeqRepository;
    private final GamePublisher gamePublisher;
 
    @Scheduled(fixedRate = 1000) // 1초마다 실행
    public void processTimers() throws JsonProcessingException {
        Set<String> activeRooms = gameSeqRepository.getAllRooms(); // Redis에 저장된 모든 방의 키 가져오기

        for (String roomKey : activeRooms) {
            long roomId = Long.parseLong(roomKey.split(":")[2]); // 게임 ID 추출
            Long remainingTime = gameSeqRepository.getTimer(roomId);
            GamePhase phaze = gameSeqRepository.getPhase(roomId);

            if (remainingTime == null || remainingTime <= 0) {
                // 시간이 다 되면 다음 페이즈로 전환
                gameService.advanceGamePhase(roomId);
            } else {
                // 타이머 감소
                gameSeqRepository.decrementTimer(roomId, 1);
            }

            // JSON 형태로 메시지 구성
            Map<String, String> timer = new HashMap<>();
            timer.put("time", String.valueOf(remainingTime)); // 남은 시간
            timer.put("phaze", String.valueOf(phaze));

            // JSON 변환
            String jsonMessage = new ObjectMapper().writeValueAsString(timer);

            gamePublisher.publish("game-"+roomId+"-system", jsonMessage);
        }
    }
}

package com.mafia.domain.game.service;

import static com.mafia.global.common.model.dto.BaseResponseStatus.UNKNOWN_PHASE;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mafia.domain.game.event.GamePublisher;
import com.mafia.domain.game.model.dto.GameEndEvent;
import com.mafia.domain.game.model.dto.GameStartEvent;
import com.mafia.domain.game.model.game.Game;
import com.mafia.domain.game.model.game.GamePhase;
import com.mafia.domain.game.repository.GameRepository;
import com.mafia.domain.game.repository.GameSeqRepository;
import com.mafia.global.common.exception.exception.BusinessException;
import com.mafia.global.common.service.GameSubscription;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * 게임의 진행을 관리하는 스케줄러 서비스 클래스.
 * 게임의 타이머를 관리하며 페이즈 전환을 수행한다.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class GameScheduler {

    private final GameSeqRepository gameSeqRepository;
    private final GameRepository gameRepository;
    private final GameService gameService;
    private final GamePublisher gamePublisher;
    private final ObjectMapper objectMapper;
    private final GameSubscription subscription;


    /**
     * 서버가 재시작될 때 실행 중이던 게임을 복원
     */
    @Bean
    public ApplicationRunner recoverActiveGames() {
        return args -> {
            Set<String> activeGameIds = gameSeqRepository.getActiveGames();
            if (activeGameIds != null) {
                for (String gameIdStr : activeGameIds) {
                    Long gameId = Long.parseLong(gameIdStr);
                    restoreGame(gameId);
                }
            }
        };
    }

    /**
     * 게임을 Redis에서 복원하여 다시 실행
     */
    private void restoreGame(Long gameId) {
        GamePhase lastPhase = gameSeqRepository.getPhase(gameId);
        Long lastTimer = gameSeqRepository.getTimer(gameId);

        if (lastPhase != null && lastTimer != null) {
            log.info("[GameScheduler] 서버 재시작 - 게임 {} 복원 (Phase: {}, Timer: {}초)", gameId, lastPhase, lastTimer);
            subscription.subscribe(gameId);

            // 게임 스케줄러 다시 시작
            startGameScheduler(new GameStartEvent(gameId));
        }
    }


    /**
     * 특정 게임 스케줄러 시작 (각 게임이 독립적으로 실행됨)
     */
    @EventListener
    @Async("gameTaskExecutor") // 멀티 쓰레드로 실행
    public void startGameScheduler(GameStartEvent event) {
        Long gameId = event.getGameId();
        gameSeqRepository.setActiveGame(gameId);
        log.info("[GameScheduler] 게임 {} 스케줄러 시작", gameId);

        while (gameSeqRepository.isGameActive(gameId)) { // 게임이 활성화되어 있으면 실행
            try {
                processTimers(gameId);
                TimeUnit.SECONDS.sleep(1); // 1초마다 실행
            } catch (InterruptedException | JsonProcessingException e) {
                Thread.currentThread().interrupt();
            }
        }
    }

    /**
     * 특정 게임(gameId)에 대한 스케줄러를 종료한다.
     *
     * @param event 게임 종료 이벤트 (GameEndEvent)
     */
    @EventListener
    public void stopGameScheduler(GameEndEvent event) {
        Long gameId = event.getGameId();

        // Redis에서 게임 실행 정보 삭제
        gameSeqRepository.removeActiveGame(gameId);
        log.info("[GameScheduler] 게임 {}의 스케줄러가 종료되었습니다.", gameId);
    }

    /**
     * 특정 게임의 타이머를 처리하고 페이즈를 전환한다.
     *
     * @param gameId 게임 ID
     * @throws JsonProcessingException JSON 변환 오류 발생 시 예외 처리
     */
    public void processTimers(long gameId) throws JsonProcessingException {
        Long remainingTime = gameService.getTime(gameId);
        GamePhase phase = gameService.getPhase(gameId);

        if(remainingTime == 5 && phase == GamePhase.DAY_FINAL_STATEMENT){
            gameService.getFinalVoteResult(gameId);
        }

        if (remainingTime < 0) {
            advanceGamePhase(gameId);
        } else {
            gameSeqRepository.decrementTimer(gameId, 1);
        }

        // JSON 메시지 생성 및 publish
        String jsonMessage = objectMapper.writeValueAsString(
            Map.of("time", String.valueOf(remainingTime), "phase", String.valueOf(phase))
        );

        gamePublisher.publish("game-" + gameId + "-system", jsonMessage);
    }


    /**
     * 게임의 페이즈를 전환한다.
     *
     * @param gameId 게임 ID
     * @throws BusinessException 유효하지 않은 페이즈일 경우 예외 발생
     * @throws JsonProcessingException JSON 변환 오류 발생 시 예외 처리
     */
    public void advanceGamePhase(long gameId) throws JsonProcessingException {
        GamePhase curPhase = gameService.getPhase(gameId);
        Game game = gameService.findById(gameId);
        if (game == null || curPhase == null) {
            log.error("Game[{}] not found", gameId);
            return;
        }

        switch (curPhase) {
            case DAY_DISCUSSION -> {
                gameSeqRepository.savePhase(gameId, GamePhase.DAY_VOTE);
                gameSeqRepository.saveTimer(gameId, 60);
            }
            case DAY_VOTE -> {
                if(game.voteResult() == -1){
                    game.updateVoicePermissions("night"); // 좀비만 음성 채팅 활성화
                    gameSeqRepository.savePhase(gameId, GamePhase.NIGHT_ACTION);
                    gameSeqRepository.saveTimer(gameId, game.getSetting().getNightTimeSec());
                } else {
                    gameSeqRepository.savePhase(gameId, GamePhase.DAY_FINAL_STATEMENT);
                    gameSeqRepository.saveTimer(gameId, 30);
                }
            }
            case DAY_FINAL_STATEMENT -> {
                gameSeqRepository.savePhase(gameId, GamePhase.DAY_FINAL_VOTE);
                gameSeqRepository.saveTimer(gameId, 20);
            }
            case DAY_FINAL_VOTE -> {
                gameService.killPlayer(gameId);
                game.updateVoicePermissions("night"); // 좀비만 음성 채팅 활성화
                gameSeqRepository.savePhase(gameId, GamePhase.NIGHT_ACTION);
                gameSeqRepository.saveTimer(gameId, game.getSetting().getNightTimeSec());
            }
            case NIGHT_ACTION -> {
                gameService.killPlayer(gameId);
                game.roundInit();
                game.updateVoicePermissions("day"); // 모든 생존자 음성 채팅 활성화 (토론)
                gameSeqRepository.savePhase(gameId, GamePhase.DAY_DISCUSSION);
                gameSeqRepository.saveTimer(gameId, game.getSetting().getDayDisTimeSec());
            }
            default -> throw new BusinessException(UNKNOWN_PHASE);
        }

        gameRepository.save(game);
        log.info("Game phase advanced in Room {}: New Phase = {}, Timer = {} seconds",
            gameId, gameSeqRepository.getPhase(gameId), gameSeqRepository.getTimer(gameId));
    }


}

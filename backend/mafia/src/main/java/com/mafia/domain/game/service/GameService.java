package com.mafia.domain.game.service;

import static com.mafia.global.common.model.dto.BaseResponseStatus.DEAD_CANNOT_VOTE;
import static com.mafia.global.common.model.dto.BaseResponseStatus.GAME_ALREADY_START;
import static com.mafia.global.common.model.dto.BaseResponseStatus.GAME_NOT_FOUND;
import static com.mafia.global.common.model.dto.BaseResponseStatus.GAME_TIME_OVER;
import static com.mafia.global.common.model.dto.BaseResponseStatus.INVALID_PHASE;
import static com.mafia.global.common.model.dto.BaseResponseStatus.MEDICAL_COUNT_ZERO;
import static com.mafia.global.common.model.dto.BaseResponseStatus.MUTANT_CANNOT_VOTE;
import static com.mafia.global.common.model.dto.BaseResponseStatus.PHASE_NOT_FOUND;
import static com.mafia.global.common.model.dto.BaseResponseStatus.PLAYER_NOT_FOUND;
import static com.mafia.global.common.model.dto.BaseResponseStatus.POLICE_CANNOT_VOTE;
import static com.mafia.global.common.model.dto.BaseResponseStatus.UNKNOWN_PHASE;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mafia.domain.game.event.GamePublisher;
import com.mafia.domain.game.model.game.Game;
import com.mafia.domain.game.model.game.GamePhase;
import com.mafia.domain.game.model.game.Player;
import com.mafia.domain.game.model.game.Role;
import com.mafia.domain.game.model.game.STATUS;
import com.mafia.domain.game.repository.GameRepository;
import com.mafia.domain.game.repository.GameSeqRepository;
import com.mafia.domain.room.model.redis.RoomInfo;
import com.mafia.domain.room.service.RoomRedisService;
import com.mafia.global.common.exception.exception.BusinessException;
import com.mafia.global.common.service.GameSubscription;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * 게임 서비스 클래스 게임 관리와 관련된 비즈니스 로직을 처리합니다. 작성자: YDaewon
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class GameService {

    private final RoomRedisService roomService;
    private final GameRepository gameRepository; // 게임 데이터를 관리하는 리포지토리
    private final GameSeqRepository gameSeqRepository; // 게임 상태 및 시간 정보를 관리하는 리포지토리
    private final VoiceService voiceService; // 🔥 OpenVidu 연동 추가
    private final GamePublisher gamePublisher; // Game Websocket
    private final GameSubscription subscription;

    /**
     * 게임 조회
     *
     * @param gameId 방 ID
     * @return 게임 객체
     * @throws BusinessException 게임이 존재하지 않을 경우 예외 발생
     */
    public Game findById(long gameId) {
        return gameRepository.findById(gameId)
            .orElseThrow(() -> new BusinessException(GAME_NOT_FOUND));
    }

    /**
     * 게임 조회
     *
     * @param gameId   방 ID
     * @param memberId 플레이어 번호
     * @return 플레이어 객체
     */
    public Player findMemberByGame(long gameId, Long memberId) {
        Game game = findById(gameId);
        return game.getPlayers().values().stream()
            .filter(player -> player.getMemberId().equals(memberId))
            .findFirst()
            .orElseThrow(() -> new BusinessException(PLAYER_NOT_FOUND));
    }

    /**
     * 게임 시작
     *
     * @param gameId 방 ID를 그대로 사용한다.
     * @throws BusinessException 이미 시작된 게임이거나 플레이어가 부족할 경우 예외 발생
     */
    public void startGame(long gameId) {
        gameRepository.findById(gameId).ifPresent(game -> {
            new BusinessException(GAME_ALREADY_START);
        });
        Game game = makeGame(gameId);

        log.info("Game {} created.", gameId);
        game.startGame();
        gameSeqRepository.savePhase(gameId, GamePhase.DAY_DISCUSSION); // 낮 토론 시작
        gameSeqRepository.saveTimer(gameId, game.getSetting().getDayDisTimeSec()); // 설정된 시간
        log.info("Game started in Room {}: Phase set to {}, Timer set to {} seconds",
            gameId, GamePhase.DAY_DISCUSSION, game.getSetting().getDayDisTimeSec());

        //Redis 채팅방 생성
        subscription.subscribe(gameId);

        gameRepository.save(game);

        // 🔥 OpenVidu 세션 생성
        try {
            String sessionId = voiceService.createSession(gameId);
            log.info("OpenVidu Session {} created for Game {}", sessionId, gameId);

            // 🔥 모든 플레이어에게 토큰 발급
            for (Long playerId : game.getPlayers().keySet()) {
                String token = voiceService.generateToken(gameId, playerId);
                log.info("Token issued for Player {}: {}", playerId, token);
            }
        } catch (Exception e) {
            log.error("Failed to create OpenVidu session: {}", e.getMessage());
        }


        log.info("Game started in Room {}.", gameId);
    }

    private Game makeGame(long roomId) {
        RoomInfo roominfo = roomService.findById(roomId);

        Game game = new Game(roomId, roominfo.getGameOption());

        // 게임에 참가할 플레이어를 추가한다.
        roominfo.getParticipant().values().forEach(game::addPlayer);

        return game;
    }


    /**
     * 게임 삭제
     *
     * @param gameId 방 ID
     * @throws BusinessException 게임이 존재하지 않을 경우 예외 발생
     */
    public void deleteGame(long gameId) {
        findById(gameId);
        getTime(gameId);
        getPhase(gameId);

        //Redis 채팅 채널 제거
        subscription.unsubscribe(gameId);

        gameRepository.delete(gameId);
        gameSeqRepository.delete(gameId);

        // 🔥 OpenVidu 세션 종료
        try {
            voiceService.closeSession(gameId);
            log.info("OpenVidu Session closed for Game {}", gameId);
        } catch (Exception e) {
            log.error("Failed to close OpenVidu session: {}", e.getMessage());
        }

        log.info("Room {} deleted.", gameId);
    }

    /**
     * 투표 처리
     *
     * @param gameId   방 ID
     * @param playerNo 투표를 하는 사용자 ID
     * @param targetNo 투표 대상 사용자 ID
     * @throws BusinessException 유효하지 않은 투표 조건일 경우 예외 발생
     */
    public void vote(long gameId, Long playerNo, Integer targetNo) { // 투표 sync 고려
        Game game = findById(gameId);
        if (game != null) {
            if (targetNo == -1) // 기권 처리
            {
                log.info("[Game{}] Player {} is abstention", gameId, playerNo);
                return;
            }
            if (game.getPlayers().get(playerNo).isDead()) {
                throw new BusinessException(DEAD_CANNOT_VOTE);
            }
            if (game.getPlayers().get(playerNo).getRole() == Role.POLICE && !game.getPlayers()
                .get(playerNo).isEnableVote()) {
                throw new BusinessException(POLICE_CANNOT_VOTE);
            }
            if (game.getPlayers().get(playerNo).getRole() == Role.MUTANT) {
                throw new BusinessException(MUTANT_CANNOT_VOTE);
            }

            game.vote(playerNo, targetNo);
            gameRepository.save(game);
            log.info("Player {} voted for Target {} in Room {}.", playerNo, targetNo, gameId);
        } else {
            log.warn("Room {} does not exist.", gameId);
        }
    }


    /**
     * 투표 결과 반환
     *
     * @param gameId 방 ID
     *
     */
    public int getVoteResult(long gameId) {
        int target = findById(gameId).voteResult();

        String topic = "game-"+gameId+"-system";
        String message = "Game[" + gameId + "] VoteResult: " + target;
        gamePublisher.publish(topic, message);

        if (target == -1) log.info("[Game{}] No one is selected", gameId);
        else log.info("[Game{}] Target is {}", gameId, target);

        return target;
    }


    /**
     * 최종 찬반 투표: 보내는거 자체가 수락임
     *
     * @param gameId 방 ID
     *
     */
    public void finalVote(long gameId) {
        Game game = findById(gameId);
        game.finalVote();

        gameRepository.save(game);
    }


    /**
     * 최종 찬반 투표 결과 반환
     *
     * @param gameId 방 ID
     *
     */
    public boolean getFinalVoteResult(long gameId) {
        boolean isKill = findById(gameId).finalvoteResult();

        String topic = "game-"+gameId+"-system";
        String message = "Game[" + gameId + "] Vote Kill: " + isKill;
        gamePublisher.publish(topic, message);

        if (isKill) log.info("[Game{}] No one is selected", gameId);
        else log.info("[Game{}] Vote Kill!!!!!", gameId);

        return isKill;
    }


    /**
     * 플레이어 사망 처리
     *
     * @param gameId   방 ID
     * @return 사망 여부
     */
    public boolean killPlayer(long gameId) throws JsonProcessingException {
        Game game = findById(gameId);
        List<Integer> killList = game.processRoundResults();
        if(!killList.isEmpty()){
            // JSON 형태로 메시지 구성
            Map<String, String> death = new HashMap<>();
            for(int death_player : killList){
                death.put("death", String.valueOf(death_player)); // 닉네임 추가
            }
            // JSON 변환
            String jsonMessage = new ObjectMapper().writeValueAsString(death);

            // Redis Pub/Sub을 통해 메시지 전송
            gamePublisher.publish("game-" + gameId + "-system", jsonMessage);
            gameRepository.save(game);
            return true;
        }
        return false;
    }

    /**
     * 타겟 지정(경찰, 의사, 좀비, 돌연변이)(밤에만 가능)
     *
     * @param gameId   방 ID
     * @param playerNo 사용자 ID
     * @param targetNo 죽일 사용자 ID
     * @throws BusinessException 유효하지 않은 조건일 경우 예외 발생
     */
    public String setTarget(long gameId, Long playerNo, Integer targetNo) {
        Game game = findById(gameId);
        Role myrole = game.getPlayers().get(playerNo).getRole();
        String result = "";
        if (myrole == Role.ZOMBIE || myrole == Role.MUTANT) {
            game.setKillTarget(targetNo);
            result = targetNo + "플레이어는 감염 타겟이 되었습니다.";
        } else if(myrole == Role.POLICE){
            Role findrole = game.findRole(playerNo, targetNo);
            result = targetNo + "의 직업은 " + findrole + "입니다.";
        } else if (myrole == Role.PLAGUE_DOCTOR) {
            if (game.getSetting().getDoctorSkillUsage() == 0) {
                result = "남은 백신이 없습니다.";
                throw new BusinessException(MEDICAL_COUNT_ZERO);
            }
            int heal_cnt = game.heal(targetNo);
            result = targetNo + "을 살리기로 했습니다. 남은 백신은 " + heal_cnt + "개 입니다.";
        }

        log.info("[Game{}] Player{} set the target of {}", gameId, targetNo, myrole);
        gameRepository.save(game);
        return result.isEmpty() ? "setTarget 요청 실패" : result;
    }

    /**
     * 게임 종료 여부 확인
     *
     * @param gameId 방 ID
     * @return 게임 상태 (STATUS)
     */
    public STATUS isEnd(long gameId) {
        Game game = findById(gameId);
        return game.getStatus();
    }

    /**
     * 페이즈 전환
     *
     * @param gameId 방 ID
     * @throws BusinessException 유효하지 않은 페이즈일 경우 예외 발생
     */
    public void advanceGamePhase(long gameId) throws JsonProcessingException {
        GamePhase curPhase = gameSeqRepository.getPhase(gameId);
        Game game = findById(gameId);
        if (curPhase == null) {
            throw new BusinessException(PHASE_NOT_FOUND);
        }

        switch (curPhase) {
            case DAY_DISCUSSION -> {
                gameSeqRepository.savePhase(gameId, GamePhase.DAY_VOTE);
                gameSeqRepository.saveTimer(gameId, 20);
            }
            case DAY_VOTE -> {
                if(getVoteResult(gameId) == -1){
                    updateVoicePermissions(gameId, "night"); // 좀비만 음성 채팅 활성화
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
                updateVoicePermissions(gameId, "night"); // 좀비만 음성 채팅 활성화
                gameSeqRepository.savePhase(gameId, GamePhase.NIGHT_ACTION);
                gameSeqRepository.saveTimer(gameId, game.getSetting().getNightTimeSec());
            }
            case NIGHT_ACTION -> {
                updateVoicePermissions(gameId, "day"); // 모든 생존자 음성 채팅 활성화 (토론)
                gameSeqRepository.savePhase(gameId, GamePhase.DAY_DISCUSSION);
                gameSeqRepository.saveTimer(gameId, game.getSetting().getDayDisTimeSec());
            }
            default -> throw new BusinessException(UNKNOWN_PHASE);
        }

        log.info("Game phase advanced in Room {}: New Phase = {}, Timer = {} seconds",
            gameId, gameSeqRepository.getPhase(gameId), gameSeqRepository.getTimer(gameId));
    }

    /**
     * 토론 시간 스킵
     *
     * @param gameId 방 ID
     * @param sec    단축할 시간 (초 단위)
     * @throws BusinessException 남은 시간이 적을 경우 예외 발생
     */
    public void skipDiscussion(long gameId, int sec) {
        int now = gameSeqRepository.getTimer(gameId).intValue();
        if (now - sec < 15) {
            throw new BusinessException(GAME_TIME_OVER);
        }

        gameSeqRepository.decrementTimer(gameId, sec);
    }

    /**
     * 남은 타이머 확인
     *
     * @param gameId 방 ID
     * @return 남은 시간 (초 단위)
     */
    public Long getTime(long gameId) {
        return gameSeqRepository.getTimer(gameId);
    }

    /**
     * 현재 페이즈 확인
     *
     * @param gameId 방 ID
     * @return 현재 페이즈
     * @throws BusinessException 페이즈가 존재하지 않을 경우 예외 발생
     */
    public GamePhase getPhase(long gameId) {
        return Optional.ofNullable(gameSeqRepository.getPhase(gameId))
            .orElseThrow(() -> new BusinessException(PHASE_NOT_FOUND));
    }

    /**
     * 페이즈 별 API 호출 제한
     *
     * @param gameId        방 ID
     * @param expectedPhase 예상되는 페이즈
     * @throws BusinessException 현재 페이즈와 예상 페이즈가 다를 경우 예외 발생
     */
    public void validatePhase(long gameId, GamePhase expectedPhase) {
        GamePhase currentPhase = gameSeqRepository.getPhase(gameId);
        if (currentPhase != expectedPhase) {
            throw new BusinessException(INVALID_PHASE);
        }
    }

    /**
     * 페이즈별 음성 채팅 권한 관리
     */
    private void updateVoicePermissions(long gameId, String phase) {
        Game game = findById(gameId);
        game.getPlayers().forEach((playerNo, player) -> {
            if (player.isDead()) {
                player.setMuteMic(true);
                player.setMuteAudio(false); // 죽은 플레이어는 듣기만 가능
            } else if (phase.equals("day")) {
                // 낮 토론 시간 -> 모든 생존자 마이크+오디오 허용
                player.setMuteMic(false);
                player.setMuteAudio(false);
            } else {
                // 밤 -> 좀비만 말하기+듣기 가능, 나머지는 둘 다 음소거
                if (player.getRole() == Role.ZOMBIE) {
                    player.setMuteMic(false);
                    player.setMuteAudio(false);
                } else {
                    player.setMuteMic(true);
                    player.setMuteAudio(true); // 살아있는 시민 & 경찰 & 의사는 둘 다 음소거
                }
            }
        });
        gameRepository.save(game);
    }

}

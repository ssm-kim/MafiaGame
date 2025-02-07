package com.mafia.domain.game.service;

import static com.mafia.global.common.model.dto.BaseResponseStatus.CANNOT_KILL_ROLE;
import static com.mafia.global.common.model.dto.BaseResponseStatus.DEAD_CANNOT_VOTE;
import static com.mafia.global.common.model.dto.BaseResponseStatus.GAME_ALREADY_START;
import static com.mafia.global.common.model.dto.BaseResponseStatus.GAME_NOT_FOUND;
import static com.mafia.global.common.model.dto.BaseResponseStatus.GAME_TIME_OVER;
import static com.mafia.global.common.model.dto.BaseResponseStatus.INVALID_PHASE;
import static com.mafia.global.common.model.dto.BaseResponseStatus.MEDICAL_COUNT_ZERO;
import static com.mafia.global.common.model.dto.BaseResponseStatus.MUTANT_CANNOT_VOTE;
import static com.mafia.global.common.model.dto.BaseResponseStatus.NOT_DOCTOR_HEAL;
import static com.mafia.global.common.model.dto.BaseResponseStatus.NOT_POLICE_FIND_ROLE;
import static com.mafia.global.common.model.dto.BaseResponseStatus.PHASE_NOT_FOUND;
import static com.mafia.global.common.model.dto.BaseResponseStatus.PLAYER_NOT_FOUND;
import static com.mafia.global.common.model.dto.BaseResponseStatus.POLICE_CANNOT_VOTE;
import static com.mafia.global.common.model.dto.BaseResponseStatus.TARGET_IS_DEAD;
import static com.mafia.global.common.model.dto.BaseResponseStatus.UNKNOWN_PHASE;

import com.mafia.domain.game.event.GameEventPublisher;
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
    private final GameEventPublisher gameEventPublisher; // Game Websocket
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
     * @return 게임 시작 여부 (true: 시작됨)
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
    public void vote(long gameId, Long playerNo, Long targetNo) { // 투표 sync 고려
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
            if (game.getPlayers().get(targetNo).isDead()) {
                game.vote(playerNo, -1L);
                throw new BusinessException(TARGET_IS_DEAD);
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
     * @return 투표 결과 대상 ID
     */
    public Long getVoteResult(long gameId) {
        long target = findById(gameId).voteResult();

        if (target == -1) {
            gameEventPublisher.publishVoteResult(
                "Game[" + gameId + "] VoteResult: -1");
            log.info("[Game{}] No one is selected", gameId);
            return -1L;
        } else {
            gameEventPublisher.publishVoteResult(
                "Game[" + gameId + "] VoteResult: " + target);
            log.info("[Game{}] Target is {}", gameId, target);
            return target;
        }
    }

    /**
     * 플레이어 사망 처리
     *
     * @param gameId   방 ID
     * @param playerNo 사망 처리할 사용자 ID
     * @param isVote   투표로 사망 여부 (true: 투표로 사망, false: 밤 페이즈 사망)
     * @return 사망 여부
     */
    public boolean killPlayer(long gameId, Long playerNo, boolean isVote) {
        Game game = findById(gameId);
        if (game.getPlayers().get(playerNo).isDead()) {
            throw new BusinessException(TARGET_IS_DEAD);
        }
        if (isVote) {
            game.Kill(playerNo);
            gameRepository.save(game);
            return true;
        } else {
            boolean isKill = game.processRoundResults();
            gameRepository.save(game);
            return isKill;
        }
    }

    /**
     * 플레이어 살리기 (의사 전용)
     *
     * @param gameId   방 ID
     * @param playerNo 의사 사용자 ID
     * @param targetNo 보호할 대상 사용자 ID
     * @throws BusinessException 유효하지 않은 조건일 경우 예외 발생
     */
    public void healPlayer(long gameId, Long playerNo, Long targetNo) {
        Game game = findById(gameId);
        if (game.getPlayers().get(playerNo).getRole() != Role.PLAGUE_DOCTOR) {
            throw new BusinessException(NOT_DOCTOR_HEAL);
        }
        if (game.getSetting().getDoctorSkillUsage() == 0) {
            throw new BusinessException(MEDICAL_COUNT_ZERO);
        }
        if (game.getPlayers().get(targetNo).isDead()) {
            throw new BusinessException(TARGET_IS_DEAD);
        }
        game.heal(targetNo);
        gameRepository.save(game);
    }

    /**
     * 플레이어 직업 찾기 (경찰 전용)
     *
     * @param gameId   방 ID
     * @param playerNo 경찰 사용자 ID
     * @param targetNo 탐색할 사용자 ID
     * @return 대상 사용자의 역할
     * @throws BusinessException 유효하지 않은 조건일 경우 예외 발생
     */
    public Role findRole(long gameId, Long playerNo, Long targetNo) {
        Game game = findById(gameId);
        if (game.getPlayers().get(playerNo).getRole() != Role.POLICE) {
            throw new BusinessException(NOT_POLICE_FIND_ROLE);
        }
        if (game.getPlayers().get(targetNo).isDead()) {
            throw new BusinessException(TARGET_IS_DEAD);
        }
        Role role = game.findRole(playerNo, targetNo);
        log.info("[Game{}] Player {} found the role of Player {} as {}", gameId, playerNo, targetNo,
            role);
        gameRepository.save(game);
        return role;
    }

    /**
     * 죽일 사람 지정 (좀비, 돌연변이 전용)
     *
     * @param gameId   방 ID
     * @param playerNo 사용자 ID
     * @param targetNo 죽일 사용자 ID
     * @throws BusinessException 유효하지 않은 조건일 경우 예외 발생
     */
    public void setKillTarget(long gameId, Long playerNo, Long targetNo) {
        Game game = findById(gameId);
        Role myrole = game.getPlayers().get(playerNo).getRole();
        if (myrole != Role.ZOMBIE && myrole != Role.MUTANT) {
            throw new BusinessException(CANNOT_KILL_ROLE);
        }
        if (game.getPlayers().get(targetNo).isDead()) {
            throw new BusinessException(TARGET_IS_DEAD);
        }

        game.setKillTarget(playerNo, targetNo);

        log.info("[Game{}] Player {} set the target of {}", gameId, targetNo, myrole);
        gameRepository.save(game);
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
    public void advanceGamePhase(long gameId) {
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
                gameSeqRepository.savePhase(gameId, GamePhase.DAY_FINAL_STATEMENT);
                gameSeqRepository.saveTimer(gameId, 30);
            }
            case DAY_FINAL_STATEMENT -> {
                gameSeqRepository.savePhase(gameId, GamePhase.DAY_FINAL_VOTE);
                gameSeqRepository.saveTimer(gameId, 20);
            }
            case DAY_FINAL_VOTE -> {
                updateVoicePermissions(gameId, "night"); // 🔥 좀비만 음성 채팅 활성화
                gameSeqRepository.savePhase(gameId, GamePhase.NIGHT_ACTION);
                gameSeqRepository.saveTimer(gameId, game.getSetting().getNightTimeSec());
            }
            case NIGHT_ACTION -> {
                updateVoicePermissions(gameId, "day"); // 🔥 모든 생존자 음성 채팅 활성화 (토론)
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

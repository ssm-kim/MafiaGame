package com.mafia.domain.game.service;

import com.mafia.domain.game.model.game.Game;
import com.mafia.domain.game.model.game.GamePhase;
import com.mafia.domain.game.model.game.Role;
import com.mafia.domain.game.model.game.STATUS;
import com.mafia.domain.game.repository.GameRepository;
import com.mafia.domain.game.repository.GameSeqRepository;
import com.mafia.domain.member.model.entity.Member;
import com.mafia.global.common.exception.exception.BusinessException;

import static com.mafia.global.common.model.dto.BaseResponseStatus.*;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 게임 서비스 클래스 게임 관리와 관련된 비즈니스 로직을 처리합니다. 작성자: YDaewon
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class GameService {

    private final GameRepository gameRepository; // 게임 데이터를 관리하는 리포지토리
    private final GameSeqRepository gameSeqRepository; // 게임 상태 및 시간 정보를 관리하는 리포지토리

    // 방별 동기화를 위한 객체 맵
    private final ConcurrentHashMap<Long, Object> roomLocks = new ConcurrentHashMap<>();

    /**
     * 게임 조회
     *
     * @param roomId 방 ID
     * @return 게임 객체
     * @throws BusinessException 게임이 존재하지 않을 경우 예외 발생
     */
    public Game findById(long roomId) {
        return Optional.ofNullable(gameRepository.findById(roomId))
            .orElseThrow(() -> new BusinessException(GAME_NOT_FOUND));
    }

    /**
     * 게임 삭제
     *
     * @param roomId 방 ID
     * @throws BusinessException 게임이 존재하지 않을 경우 예외 발생
     */
    public void deleteGame(long roomId) {
        findById(roomId);
        getTime(roomId);
        getPhase(roomId);
        gameRepository.delete(roomId);
        gameSeqRepository.delete(roomId);
        log.info("Room {} deleted.", roomId);
    }

    /**
     * 게임 시작
     *
     * @param roomId 방 ID
     * @return 게임 시작 여부 (true: 시작됨)
     * @throws BusinessException 이미 시작된 게임이거나 플레이어가 부족할 경우 예외 발생
     */
    public boolean startGame(long roomId) {
        if (gameRepository.findById(roomId) != null) {
            throw new BusinessException(GAME_ALREADY_START);
        }
        Game game = new Game();
        game.setRoomId(roomId);

        // 게임에 참가할 플레이어를 추가한다.
        /*
        roomRepo.getAllPlayersOfRoom(roomSeq).forEach((k, v)->{
            gmMap.get(roomSeq).addPlayer(PlayerService.getPlayerInfo(k));
        });
        */
        /*
        Test Code
         */

        if (game.getPlayers().size() < 6) {
            throw new BusinessException(PLAYER_NOT_ENOUGH);
        }

        log.info("Room {} created.", roomId);
        game.start_game();
        gameSeqRepository.savePhase(roomId, GamePhase.DAY_DISCUSSION); // 낮 토론 시작
        gameSeqRepository.saveTimer(roomId, game.getOption().getDayDisTimeSec()); // 설정된 시간
        log.info("Game started in Room {}: Phase set to {}, Timer set to {} seconds",
            roomId, GamePhase.DAY_DISCUSSION, game.getOption().getDayDisTimeSec());
        gameRepository.save(game);
        log.info("Game started in Room {}.", roomId);
        return true;
    }

    /**
     * 투표 처리
     *
     * @param roomId   방 ID
     * @param playerNo 투표를 하는 사용자 ID
     * @param targetNo 투표 대상 사용자 ID
     * @throws BusinessException 유효하지 않은 투표 조건일 경우 예외 발생
     */
    public void vote(long roomId, Integer playerNo, Integer targetNo) {
        synchronized (getLock(roomId)) {
            Game game = findById(roomId);
            if (game != null) {
                if (targetNo == -1) // 기권 처리
                {
                    log.info("[Game{}] Player {} is abstention", roomId, playerNo);
                    return;
                }
                if (game.getPlayers().get(playerNo).isDead()) {
                    throw new BusinessException(PLAYER_IS_DEAD);
                }
                if (game.getPlayers().get(targetNo).isDead()) {
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
                log.info("Player {} voted for Target {} in Room {}.", playerNo, targetNo, roomId);
            } else {
                log.warn("Room {} does not exist.", roomId);
            }
        }
    }

    /**
     * 방별 동기화 객체 반환
     *
     * @param roomId 방 ID
     * @return 동기화 객체
     */
    private Object getLock(long roomId) {
        // ConcurrentHashMap을 이용해 방별로 고유한 동기화 객체 생성
        return roomLocks.computeIfAbsent(roomId, id -> new Object());
    }

    /**
     * 투표 결과 반환
     *
     * @param roomId 방 ID
     * @return 투표 결과 대상 ID
     */
    public Integer getVoteResult(long roomId) {
        int target = findById(roomId).voteResult();
        if (target == -1) {
            log.info("[Game{}] No one is selected", roomId);
            return -1;
        } else {
            log.info("[Game{}] Target is {}", roomId, target);
            return target;
        }
    }

    /**
     * 플레이어 사망 처리
     *
     * @param roomId   방 ID
     * @param playerNo 사망 처리할 사용자 ID
     * @param isVote   투표로 사망 여부 (true: 투표로 사망, false: 밤 페이즈 사망)
     * @return 사망 여부
     */
    public boolean killPlayer(long roomId, Integer playerNo, boolean isVote) {
        Game game = findById(roomId);
        if (game.getPlayers().get(playerNo).isDead()) {
            throw new BusinessException(TARGET_IS_DEAD);
        }
        if (isVote) {
            game.Kill(playerNo);
            return true;
        } else {
            boolean isKill = game.processKill();
            gameRepository.save(game);
            return isKill;
        }
    }

    /**
     * 플레이어 살리기 (의사 전용)
     *
     * @param roomId   방 ID
     * @param playerNo 의사 사용자 ID
     * @param targetNo 보호할 대상 사용자 ID
     * @throws BusinessException 유효하지 않은 조건일 경우 예외 발생
     */
    public void healPlayer(long roomId, Integer playerNo, Integer targetNo) {
        Game game = findById(roomId);
        if (game.getPlayers().get(playerNo).getRole() != Role.PLAGUE_DOCTOR) {
            throw new BusinessException(NOT_DOCTOR_HEAL);
        }
        if (game.getDoctorSkillUsage() == 0) {
            throw new BusinessException(MEDICAL_COUNT_ZERO);
        }
        if (game.getPlayers().get(targetNo).isDead()) {
            throw new BusinessException(PLAYER_CANNOT_HEAL);
        }
        game.heal(targetNo);
        gameRepository.save(game);
    }

    /**
     * 플레이어 직업 찾기 (경찰 전용)
     *
     * @param roomId   방 ID
     * @param playerNo 경찰 사용자 ID
     * @param targetNo 탐색할 사용자 ID
     * @return 대상 사용자의 역할
     * @throws BusinessException 유효하지 않은 조건일 경우 예외 발생
     */
    public Role findRole(long roomId, Integer playerNo, Integer targetNo) {
        Game game = findById(roomId);
        if (game.getPlayers().get(playerNo).getRole() != Role.POLICE) {
            throw new BusinessException(CANNOT_KILL_ROLE);
        }
        if (game.getPlayers().get(targetNo).isDead()) {
            throw new BusinessException(TARGET_IS_DEAD);
        }
        Role role = game.findRole(playerNo, targetNo);
        log.info("[Game{}] Player {} found the role of Player {} as {}", roomId, playerNo, targetNo,
            role);
        gameRepository.save(game);
        return role;
    }

    /**
     * 죽일 사람 지정 (좀비, 돌연변이 전용)
     *
     * @param roomId   방 ID
     * @param playerNo 사용자 ID
     * @param targetNo 죽일 사용자 ID
     * @throws BusinessException 유효하지 않은 조건일 경우 예외 발생
     */
    public void setKillTarget(long roomId, Integer playerNo, Integer targetNo) {
        Game game = findById(roomId);
        Role myrole = game.getPlayers().get(playerNo).getRole();
        if (myrole != Role.ZOMBIE && myrole != Role.MUTANT) {
            throw new BusinessException(NOT_DOCTOR_HEAL);
        }
        if (game.getPlayers().get(targetNo).isDead()) {
            throw new BusinessException(TARGET_IS_DEAD);
        }

        if (myrole == Role.ZOMBIE) {
            game.zombieTarget(targetNo);
        } else {
            game.mutantTarget(targetNo);
        }

        log.info("[Game{}] Player {} set the target of {}", roomId, targetNo, myrole);
        gameRepository.save(game);
    }

    /**
     * 게임 종료 여부 확인
     *
     * @param roomId 방 ID
     * @return 게임 상태 (STATUS)
     */
    public STATUS isEnd(long roomId) {
        Game game = findById(roomId);
        return game.getStatus();
    }

    /**
     * 상태 전환
     *
     * @param roomId 방 ID
     * @throws BusinessException 유효하지 않은 페이즈일 경우 예외 발생
     */
    public void advanceGamePhase(long roomId) {
        GamePhase curPhase = gameSeqRepository.getPhase(roomId);
        Game game = findById(roomId);
        if (curPhase == null) {
            throw new BusinessException(PHASE_NOT_FOUND);
        }

        switch (curPhase) {
            case DAY_DISCUSSION -> {
                gameSeqRepository.savePhase(roomId, GamePhase.DAY_VOTE);
                gameSeqRepository.saveTimer(roomId, 20);
            }
            case DAY_VOTE -> {
                gameSeqRepository.savePhase(roomId, GamePhase.DAY_FINAL_STATEMENT);
                gameSeqRepository.saveTimer(roomId, 30);
            }
            case DAY_FINAL_STATEMENT -> {
                gameSeqRepository.savePhase(roomId, GamePhase.DAY_FINAL_VOTE);
                gameSeqRepository.saveTimer(roomId, 20);
            }
            case DAY_FINAL_VOTE -> {
                gameSeqRepository.savePhase(roomId, GamePhase.NIGHT_ACTION);
                gameSeqRepository.saveTimer(roomId, game.getOption().getNightTimeSec());
            }
            case NIGHT_ACTION -> {
                gameRepository.save(game);
                gameSeqRepository.savePhase(roomId, GamePhase.DAY_DISCUSSION);
                gameSeqRepository.saveTimer(roomId, game.getOption().getDayDisTimeSec());
            }
            default -> throw new BusinessException(UNKNOWN_PHASE);
        }

        log.info("Game phase advanced in Room {}: New Phase = {}, Timer = {} seconds",
            roomId, gameSeqRepository.getPhase(roomId), gameSeqRepository.getTimer(roomId));
    }

    /**
     * 토론 시간 스킵
     *
     * @param roomId 방 ID
     * @param sec    단축할 시간 (초 단위)
     * @throws BusinessException 남은 시간이 적을 경우 예외 발생
     */
    public void skipDiscussion(long roomId, int sec) {
        int now = gameSeqRepository.getTimer(roomId).intValue();
        if (now - sec < 15) {
            throw new BusinessException(GAME_TIME_OVER);
        }

        gameSeqRepository.decrementTimer(roomId, sec);
    }

    /**
     * 남은 타이머 확인
     *
     * @param roomId 방 ID
     * @return 남은 시간 (초 단위)
     */
    public Long getTime(long roomId) {
        return gameSeqRepository.getTimer(roomId);
    }

    /**
     * 현재 페이즈 확인
     *
     * @param roomId 방 ID
     * @return 현재 페이즈
     * @throws BusinessException 페이즈가 존재하지 않을 경우 예외 발생
     */
    public GamePhase getPhase(long roomId) {
        return Optional.ofNullable(gameSeqRepository.getPhase(roomId))
            .orElseThrow(() -> new BusinessException(PHASE_NOT_FOUND));
    }

    /**
     * 페이즈 별 API 호출 제한
     *
     * @param roomId        방 ID
     * @param expectedPhase 예상되는 페이즈
     * @throws BusinessException 현재 페이즈와 예상 페이즈가 다를 경우 예외 발생
     */
    public void validatePhase(long roomId, GamePhase expectedPhase) {
        GamePhase currentPhase = gameSeqRepository.getPhase(roomId);
        if (currentPhase != expectedPhase) {
            throw new BusinessException(INVALID_PHASE);
        }
    }
}

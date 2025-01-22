package com.mafia.domain.game.service;

import com.mafia.domain.game.model.User;
import com.mafia.domain.game.model.game.Game;
import com.mafia.domain.game.model.game.Role;
import com.mafia.domain.game.repository.GameRepository;
import com.mafia.global.common.exception.exception.BusinessException;
import static com.mafia.global.common.model.dto.BaseResponseStatus.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
public class GameService {

    private final GameRepository gameRepository;

    // 게임 조회
    public Game findById(long roomId) {
        return Optional.ofNullable(gameRepository.findById(roomId))
                .orElseThrow(() -> new BusinessException(GAME_NOT_FOUND));
    }

    // 게임 삭제
    public void deleteGame(long roomId) {
        findById(roomId);
        gameRepository.delete(roomId);
        log.info("Room {} deleted.", roomId);
    }

    // 플레이어 준비
/*    public void readyPlayer(long roomId, Long userId) {
        Game game = gameRepository.findById(roomId);
        if (game != null) {
            game.ready(userId);
            if(game.isReady()){
                game.setStatus(STATUS.ALLREADY);
            }
            gameRepository.save(game);
            return;
        }
        log.warn("Room {} does not exist.", roomId);
    }*/

    // 게임 시작
    public boolean startGame(long roomId) {
        if(gameRepository.findById(roomId) != null) throw new BusinessException(GAME_ALREADY_START);
        Game game = new Game();
        game.setRoomId(roomId);
        game.readyClear();


        // 게임에 참가할 플레이어를 추가한다.
        /*
        roomRepo.getAllUsersOfRoom(roomSeq).forEach((k, v)->{
            gmMap.get(roomSeq).addUser(userService.getUserInfo(k));
        });
        */
        /*
        Test Code
         */
        List<User> users = new ArrayList<>();
        users.add(new User(1L, "user1"));
        users.add(new User(2L,"user2"));
        users.add(new User(3L,"user3"));
        users.add(new User(4L,"user4"));
        users.add(new User(5L,"user5"));
        users.add(new User(6L,"user6"));
        users.add(new User(7L,"user7"));
        users.add(new User(8L,"user8"));
        for (User user: users){
            game.addPlayer(user);
        }

        if(game.getPlayers().size() < 6) throw new BusinessException(PLAYER_NOT_ENOUGH);


        log.info("Room {} created.", roomId);
        game.start_game();
        gameRepository.save(game);
        log.info("Game started in Room {}.", roomId);
        return true;
    }

    // 투표 처리
    public void vote(long roomId, Long userId, Long targetId) {
        Game game = findById(roomId);
        if (game != null) {
            if(targetId == -1) // 기권 처리
            {
                log.info("[Game{}] User {} is abstention", roomId, userId);
                return ;
            }
            if(game.getPlayers().get(userId).isDead()){
                throw new BusinessException(USER_IS_DEAD);
            }
            if(game.getPlayers().get(targetId).isDead()){
                throw new BusinessException(TARGET_IS_DEAD);
            }
            if(game.getPlayers().get(userId).getRole() == Role.POLICE && !game.getPlayers().get(userId).isEnableVote()){
                throw new BusinessException(POLICE_CANNOT_VOTE);
            }
            if(game.getPlayers().get(userId).getRole() == Role.MUTANT){
                throw new BusinessException(MUTANT_CANNOT_VOTE);
            }

            game.vote(userId, targetId);
            gameRepository.save(game);
            log.info("User {} voted for Target {} in Room {}.", userId, targetId, roomId);
        } else {
            log.warn("Room {} does not exist.", roomId);
        }
    }

    // 투표 결과 반환
    public Long getVoteResult(long roomId) {
        long target = findById(roomId).voteResult();
        if(target == -1){
            log.info("[Game{}] No one is selected", roomId);
            return -1L;
        }
        else{
            log.info("[Game{}] Target is {}", roomId, target);
            return target;
        }
    }

    // 플레이어 사망 처리
    public void killPlayer(long roomId, Long userId) {
        Game game = findById(roomId);
        if(game.getPlayers().get(userId).isDead()){
            throw new BusinessException(USER_ALREADY_DEAD);
        }
        boolean isKill = game.kill(userId);
        gameRepository.save(game);
        if(isKill) log.info("User {} killed in Room {}.", userId, roomId);
        else log.info("[Game{}] Doctor prevented the death of user {}.", roomId, userId);
    }

    // 플레이어 살리기(의사 전용, 2번 가능)
    public void healPlayer(long roomId, Long userId, Long targetId) {
        Game game = findById(roomId);
        if(game.getPlayers().get(userId).getRole() != Role.PLAGUE_DOCTOR) throw new BusinessException(NOT_DOCTOR_HEAL);
        if(game.getDoctorCount() == 0) throw new BusinessException(MEDICAL_COUNT_ZERO);
        if(game.getPlayers().get(targetId).isDead()) throw new BusinessException(USER_ALREADY_DEAD);
        game.heal(targetId);
    }

    // 플레이어 직업 찾기(경찰 전용)
    public void findRole(long roomId, Long userId, Long targetId) {
        Game game = findById(roomId);
        if(game.getPlayers().get(userId).getRole() != Role.POLICE) throw new BusinessException(NOT_POLICE_FINDROLE);
        Role role = game.findRole(userId, targetId);
        log.info("[Game{}] User {} found the role of User {} as {}", roomId, userId, targetId, role);
    }

    // 게임 종료 여부 확인
    public int checkGameOver(long roomId) {
        Game game = findById(roomId);
        return game.isGameOver();
    }
}

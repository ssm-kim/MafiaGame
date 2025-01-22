package com.mafia.domain.game.service;

import com.mafia.domain.game.model.User;
import com.mafia.domain.game.model.game.Game;
import com.mafia.domain.game.repository.GameRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class GameService {

    private final GameRepository gameRepository;


    public Game findById(long roomId) {
        return gameRepository.findById(roomId);
    }

    // 방 삭제
    public void deleteGame(long roomId) {
        if (!gameRepository.exists(roomId)) {
            log.warn("Room {} does not exist.", roomId);
            return;
        }
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
        if (gameRepository.exists(roomId)) {
            log.warn("Room {} already exists.", roomId);
            return false;
        }
        Game game = new Game();
        game.setRoom_id(roomId);
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

        log.info("Room {} created.", roomId);
        game.start_game();
        gameRepository.save(game);
        log.info("Game started in Room {}.", roomId);
        return true;
    }

    // 투표 처리
    public void vote(long roomId, Long userId, Long targetId) {
        Game game = gameRepository.findById(roomId);
        if (game != null) {
            game.vote(userId, targetId);
            gameRepository.save(game);
            log.info("User {} voted for Target {} in Room {}.", userId, targetId, roomId);
        } else {
            log.warn("Room {} does not exist.", roomId);
        }
    }

    // 투표 결과 반환
    public Long getVoteResult(long roomId) {
        Game game = gameRepository.findById(roomId);
        if (game != null) {
            return game.voteResult();
        }
        log.warn("Room {} does not exist.", roomId);
        return -1L;
    }

    // 플레이어 사망 처리
    public void killPlayer(long roomId, Long userId) {
        Game game = gameRepository.findById(roomId);
        if (game != null) {
            game.kill(userId);
            gameRepository.save(game);
            log.info("User {} killed in Room {}.", userId, roomId);
        } else {
            log.warn("Room {} does not exist.", roomId);
        }
    }

    // 게임 종료 여부 확인
    public int checkGameOver(long roomId) {
        Game game = gameRepository.findById(roomId);
        if (game != null) {
            return game.isGameOver();
        }
        log.warn("Room {} does not exist.", roomId);
        return 0; // 게임 진행 중
    }
}

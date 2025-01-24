package com.mafia.domain.game.repository;

import com.mafia.domain.game.model.game.Game;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class GameRepository {

    private final RedisTemplate<String, Object> redisTemplate;


    private String getGamekey(long roomId) {
        return "game:room:" + roomId;
    }

    // 게임 저장
    public void save(Game game) {
        redisTemplate.opsForValue().set(getGamekey(game.getRoomId()), game);
    }

    // 게임 조회
    public Game findById(long roomId) {
        return (Game) redisTemplate.opsForValue().get(getGamekey(roomId));
    }

    // 게임 삭제
    public void delete(long roomId) {
        redisTemplate.delete(getGamekey(roomId));
    }


}
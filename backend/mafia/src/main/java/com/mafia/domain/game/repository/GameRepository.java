package com.mafia.domain.game.repository;

import static com.mafia.global.common.model.dto.BaseResponseStatus.GAME_NOT_FOUND;

import com.mafia.domain.game.model.game.Game;
import com.mafia.domain.game.model.game.GamePhase;
import com.mafia.global.common.exception.exception.BusinessException;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class GameRepository {

    private final RedisTemplate<String, Object> redisTemplate;


    private String getGamekey(long roomId) {
        return "game:" + roomId;
    }

    // 게임 저장
    public void save(Game game) {
        redisTemplate.opsForValue().set(getGamekey(game.getGameId()), game);
    }

    // 게임 조회
    public Optional<Game> findById(long roomId) {
        Object value = redisTemplate.opsForValue().get(getGamekey(roomId));
        if (value instanceof Game game) {
            return Optional.of(game);
        }
        return Optional.empty();
    }

    // 게임 삭제
    public void delete(long roomId) {
        redisTemplate.delete(getGamekey(roomId));
    }


}
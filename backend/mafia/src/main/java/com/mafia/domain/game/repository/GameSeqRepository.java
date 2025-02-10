package com.mafia.domain.game.repository;

import com.mafia.domain.game.model.game.GamePhase;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class GameSeqRepository {

    private final RedisTemplate<String, Object> redisTemplate;
    private static final String ACTIVE_GAMES_KEY = "activeGames";

    private String getPhaseKey(long roomId) {
        return "game:room:" + roomId + ":phase";
    }

    private String getTimerKey(long roomId) {
        return "game:room:" + roomId + ":timer";
    }

    // 게임 상태 조회
    public GamePhase getPhase(long roomId) {
        Object value = redisTemplate.opsForValue().get(getPhaseKey(roomId));

        if (value instanceof String) {
            return GamePhase.valueOf((String) value); // Enum 변환
        }
        return null; // 값이 없거나 예상하지 못한 타입인 경우
    }

    // 게임 상태 저장
    public void savePhase(long roomId, GamePhase phase) {
        redisTemplate.opsForValue().set(getPhaseKey(roomId), phase);
    }

    // 타이머 조회
    public Long getTimer(long roomId) {
        Object value = redisTemplate.opsForValue().get(getTimerKey(roomId));
        if (value instanceof Integer) {
            return ((Integer) value).longValue();
        } else if (value instanceof Long) {
            return (Long) value;
        }
        return null; // 값이 없거나 예상하지 못한 타입인 경우
    }

    // 타이머 설정
    public void saveTimer(long roomId, long seconds) {
        redisTemplate.opsForValue().set(getTimerKey(roomId), seconds);
    }

    // 타이머 감소: s 만큼 감소
    public void decrementTimer(long roomId, long s) {
        redisTemplate.opsForValue().decrement(getTimerKey(roomId), s);
    }

    // 상태와 타이머 삭제
    public void delete(long roomId) {
        redisTemplate.delete(getPhaseKey(roomId));
        redisTemplate.delete(getTimerKey(roomId));
    }

    /**
     * 특정 게임이 활성 상태인지 확인 (Redis에서 조회)
     */
    public boolean isGameActive(Long gameId) {
        return Boolean.TRUE.equals(redisTemplate.opsForSet().isMember(ACTIVE_GAMES_KEY, gameId.toString()));
    }

    /**
     * 실행 중인 모든 게임 목록 가져오기
     */
    public Set<String> getActiveGames() {
        Set<Object> activeGames = redisTemplate.opsForSet().members(ACTIVE_GAMES_KEY);
        if (activeGames != null) {
            return activeGames.stream()
                .filter(obj -> obj instanceof String)
                .map(obj -> (String) obj)
                .collect(Collectors.toSet());
        }
        return Set.of(); // 빈 Set 반환
    }

    /**
     * 특정 게임을 활성 상태로 저장
     */
    public void setActiveGame(Long gameId) {
        redisTemplate.opsForSet().add(ACTIVE_GAMES_KEY, gameId.toString());
    }

    /**
     * 특정 게임을 비활성화
     */
    public void removeActiveGame(Long gameId) {
        redisTemplate.opsForSet().remove(ACTIVE_GAMES_KEY, gameId.toString());
    }
}

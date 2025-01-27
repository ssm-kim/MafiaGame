package com.mafia.domain.game.repository;

import com.mafia.domain.game.model.game.GamePhase;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Repository;

import java.util.Set;

@Repository
@RequiredArgsConstructor
public class GameSeqRepository {

    private final RedisTemplate<String, Object> redisTemplate;

    private String getPhaseKey(long roomId) {
        return "game:room:" + roomId + ":phase";
    }

    public Set<String> getAllRooms() {
        return redisTemplate.keys("game:room:*:timer"); // 모든 방 키 가져오기
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
}

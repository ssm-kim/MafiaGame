package com.mafia.domain.room.repository;


import com.mafia.domain.room.model.RoomInfo;
import java.util.HashMap;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class RoomRedisRepository {

    private final RedisTemplate<String, RoomInfo> redisTemplate;

    private String getRoomKey(long roomId) {
        return "room:" + roomId;
    }

    public Set<String> getAllRooms() {
        return redisTemplate.keys("room:*"); // 모든 방 키 가져오기
    }

    public RoomInfo findById(Long roomId) {
        return redisTemplate.opsForValue().get(getRoomKey(roomId));
    }

    // 방 ID, 방 상태
    public void save(Long roomId, RoomInfo roomInfo) {
        redisTemplate.opsForValue().set(getRoomKey(roomId), roomInfo);
    }

    // 각 방의 참가자 수를 조회합니다.
    public HashMap<Long, Integer> getRoomPlayerCounts() {
        HashMap<Long, Integer> result = new HashMap<>();
        Set<String> roomKeys = getAllRooms();

        for (String key : roomKeys) {
            RoomInfo roomInfo = redisTemplate.opsForValue().get(key);
            if (roomInfo != null) {
                result.put(roomInfo.getRoomId(), roomInfo.getParticipant().size());
            }
        }
        return result;
    }

    public void delete(Long roomId) {
        redisTemplate.delete(getRoomKey(roomId));
    }
}
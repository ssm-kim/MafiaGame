package com.mafia.domain.room.repository;


import com.mafia.domain.room.model.redis.RoomInfo;
import java.util.HashMap;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class RoomRedisRepository {

    private final RedisTemplate<String, RoomInfo> redisTemplate;
    private static final String ROOM_KEY_PREFIX = "list:room:";  // 상수로 분리

    /**
     * Redis key 생성
     */
    private String getRoomKey(long roomId) {
        return ROOM_KEY_PREFIX + roomId;
    }

    /**
     * 모든 방 정보 조회
     */
    public Set<String> getAllRooms() {
        return redisTemplate.keys(ROOM_KEY_PREFIX + "*"); // 모든 방 키 가져오기
    }

    /**
     * roomId로 방 정보 조회
     */
    public RoomInfo findById(Long roomId) {
        return redisTemplate.opsForValue().get(getRoomKey(roomId));
    }

    /**
     * 방 정보 저장/수정
     */
    public void save(Long roomId, RoomInfo roomInfo) {
        redisTemplate.opsForValue().set(getRoomKey(roomId), roomInfo);
    }

    /**
     * 모든 방의 참가자 수 조회
     */
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

    /**
     * 방 삭제
     */
    public void delete(Long roomId) {
        System.out.println("🔴 방 삭제 시도 - roomId: " + roomId);
        redisTemplate.delete(getRoomKey(roomId));
        System.out.println("✅ 방 삭제 완료 - roomId: " + roomId);
    }
}
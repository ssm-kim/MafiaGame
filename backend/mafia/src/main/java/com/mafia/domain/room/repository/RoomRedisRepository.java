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

    private final RedisTemplate<String, RoomInfo> roomRedisTemplate;

    private String getRoomKey(long roomId) {
        return "room:" + roomId;
    }

    public Set<String> getAllRooms() {
        return roomRedisTemplate.keys("room:*"); // 모든 방 키 가져오기
    }


    // 방 ID, 방 상태
    public void save(Long roomId, RoomInfo roomInfo) {
        roomRedisTemplate.opsForValue().set(getRoomKey(roomId), roomInfo);
    }

    // 각 방의 참가자 수를 조회합니다.
    //    {
    //        1L: 3,  // 1번 방에 3명
    //        2L: 5,  // 2번 방에 5명
    //        3L: 2   // 3번 방에 2명
    //    }
    public HashMap<Long, Integer> getRoomPlayerCounts() {
        HashMap<Long, Integer> result = new HashMap<>();
        Set<String> roomKeys = getAllRooms();

        for (String key : roomKeys) {
            RoomInfo roomInfo = roomRedisTemplate.opsForValue().get(key);
            if (roomInfo != null) {
                result.put(roomInfo.getRoomId(), roomInfo.getParticipant().size());
            }
        }
        return result;
    }

    public void delete(Long roomId) {
        roomRedisTemplate.delete(getRoomKey(roomId));
    }

    public RoomInfo findById(Long roomId) {
        return roomRedisTemplate.opsForValue().get(roomId);
    }
}
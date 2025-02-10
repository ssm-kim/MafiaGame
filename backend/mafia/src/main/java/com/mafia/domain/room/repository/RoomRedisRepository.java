package com.mafia.domain.room.repository;


import com.mafia.domain.room.model.redis.RoomInfo;
import java.util.HashMap;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Repository;

@Slf4j
@Repository
@RequiredArgsConstructor
public class RoomRedisRepository {

    private final RedisTemplate<String, Object> redisTemplate;
    private static final String ROOM_KEY_PREFIX = "room:list:";  // 상수로 분리
    private static final String ROOM_SESSION_PREFIX = "room:session:";  // 상수로 분리
    private static final String ROOM_MEMBER_PREFIX = "room:member:";

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
        return (RoomInfo) redisTemplate.opsForValue().get(getRoomKey(roomId));
    }

    /**
     * 방 정보 저장
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
            RoomInfo roomInfo = (RoomInfo) redisTemplate.opsForValue().get(key);
            result.put(roomInfo.getRoomId(), roomInfo.getParticipant().size());
        }
        return result;
    }

    /**
     * 방 삭제
     */
    public void delete(Long roomId) {
        log.info("방 삭제 시도 - roomId: {} ", roomId);
        redisTemplate.delete(getRoomKey(roomId));
        log.info("방 삭제 완료 - roomId: {} ", roomId);
    }

    // 세션 관리
    private String getSessionKey(String sessionId) {
        return ROOM_SESSION_PREFIX + sessionId;
    }

    public void saveSession(String sessionId, Long memberId) {
        redisTemplate.opsForValue().set(getSessionKey(sessionId), memberId);
    }

    public Long findBySessionId(String sessionId) {
        Object value = redisTemplate.opsForValue().get(getSessionKey(sessionId));
        return Long.valueOf(value.toString());
    }

    public void deleteSession(String sessionId) {
        redisTemplate.delete(getSessionKey(sessionId));
    }


    // 유저가 다른 방에 이미 참여한지 여부 파악
    public void saveMemberRoom(Long memberId, Long roomId) {
        redisTemplate.opsForValue().set(ROOM_MEMBER_PREFIX + memberId, roomId);
    }

    /**
     * room:member:1 -> "2"  (멤버1이 2번방에 있다) room:member:5 -> "2"  (멤버5도 2번방에 있다) room:member:8 ->
     * "3"  (멤버8은 3번방에 있다)
     */
    public Long findRoomByMemberId(Long memberId) {
        Object value = redisTemplate.opsForValue().get(ROOM_MEMBER_PREFIX + memberId);

        // null이면 바로 null 반환
        if (value == null) {
            return null;
        }

        return Long.valueOf(value.toString());
    }

    public void deleteMemberRoom(Long memberId) {
        redisTemplate.delete(ROOM_MEMBER_PREFIX + memberId);
    }
}

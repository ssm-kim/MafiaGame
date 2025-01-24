package com.mafia.domain.room.service;

import static com.mafia.global.common.model.dto.BaseResponseStatus.ROOM_NOT_FOUND;

import com.mafia.domain.room.model.RoomInfo;
import com.mafia.domain.room.repository.RoomRedisRepository;
import com.mafia.global.common.exception.exception.BusinessException;
import java.util.HashMap;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


@Service
@RequiredArgsConstructor
@Transactional
public class RoomRedisService {

    private final RoomRedisRepository roomRedisRepository;

    /**
     * 방 정보 조회
     */
    public RoomInfo findById(long roomId) {
        return Optional.ofNullable(roomRedisRepository.findById(roomId))
            .orElseThrow(() -> new BusinessException(ROOM_NOT_FOUND));
    }

    /**
     * 방 생성 시 Redis 정보 저장
     */
    public void createRoomInfo(Long roomId, Long hostId) {

        findById(roomId);  // 방이 없으면 예외처리

        RoomInfo roomInfo = new RoomInfo(roomId, hostId);
        roomRedisRepository.save(roomId, roomInfo);
    }

    /**
     * 현재 방 참가자 수 조회
     *
     * @return HashMap<방ID, 참가자수>
     */
    public HashMap<Long, Integer> roomsCount() {
        return roomRedisRepository.getRoomPlayerCounts();
    }

    public void deleteById(Long roomId) {
        roomRedisRepository.delete(roomId);
    }

    public void enterRoom(Long roomId, Long memberId) {
        roomRedisRepository.
    }
} 
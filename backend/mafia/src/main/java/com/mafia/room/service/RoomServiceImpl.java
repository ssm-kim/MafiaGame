package com.mafia.room.service;

import com.mafia.global.common.exception.exception.BusinessException;
import com.mafia.global.common.model.dto.BaseResponseStatus;
import com.mafia.room.dto.response.RoomResponse;
import com.mafia.room.entity.Room;
import com.mafia.room.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 마피아 게임방 관련 비즈니스 로직을 처리하는 서비스입니다.
 */

@Service
@RequiredArgsConstructor
@Transactional
public class RoomServiceImpl implements RoomService {

    private final RoomRepository roomRepository;


    /**
     * 새로운 게임방을 생성합니다.
     * 생성 시 방 상태(roomStatus)는 false(시작 전)로 설정됩니다.
     * @throws BusinessException 방 제목이 중복된 경우
     */
    @Transactional
    public Room createRoom(Room room) {
        room.setRoomStatus(false);  // 방 생성시 초기 상태
        try {
            return roomRepository.save(room);
        } catch (Exception e) {
            throw new BusinessException(BaseResponseStatus.ROOM_TITLE_DUPLICATE);
        }
    }

    /** 모든 게임방 목록을 반환합니다. */
    @Override
    public List<RoomResponse> getAllRooms() {
        return roomRepository.findAll().stream()
                .map(RoomResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * 특정 게임방을 조회합니다.
     * @throws BusinessException 방을 찾을 수 없는 경우
     */
    @Override
    public Room getRoom(Long roomId) {
        return roomRepository.findById(roomId)
                .orElseThrow(() -> new BusinessException(BaseResponseStatus.ROOM_NOT_FOUND));
    }

    /**
     * 게임방 정보를 수정합니다.
     * @throws BusinessException 방을 찾을 수 없거나 플레이어 수가 유효하지 않은 경우(4~15명)
     */
    @Transactional
    public Room updateRoom(Long roomId, Room roomRequest) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new BusinessException(BaseResponseStatus.ROOM_NOT_FOUND));

        if (roomRequest.getMaxPlayers() != null && (roomRequest.getMaxPlayers() < 4 || roomRequest.getMaxPlayers() > 15)) {
            throw new BusinessException(BaseResponseStatus.ROOM_INVALID_PLAYER_COUNT);
        }

        room.setRoomTitle(roomRequest.getRoomTitle());
        room.setRoomPassword(roomRequest.getRoomPassword());
        room.setRoomOption(roomRequest.getRoomOption());
        room.setMaxPlayers(roomRequest.getMaxPlayers());
        room.setIsVoice(roomRequest.getIsVoice());

        return room;
    }

    /**
     * 게임방을 삭제합니다.
     * @throws BusinessException 방을 찾을 수 없는 경우
     */
    @Transactional
    public void deleteRoom(Long roomId) throws BusinessException {
        if (!roomRepository.existsById(roomId)) {
            throw new BusinessException(BaseResponseStatus.ROOM_NOT_FOUND);
        }
        roomRepository.deleteById(roomId);
    }
}
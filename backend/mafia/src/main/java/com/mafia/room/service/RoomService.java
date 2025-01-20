package com.mafia.room.service;

import com.mafia.global.common.exception.exception.BusinessException;
import com.mafia.global.common.model.dto.BaseResponseStatus;
import com.mafia.room.entity.Room;
import com.mafia.room.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;


@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RoomService {
    private final RoomRepository roomRepository;

    @Transactional
    public Room createRoom(Room room) {
        room.setRoomStatus(false);  // 방 생성시 초기 상태
        return roomRepository.save(room);
    }

    public List<Room> getAllRooms() {
        return roomRepository.findAll();
    }

    public Room getRoom(Long roomId) {
        return roomRepository.findById(roomId)
                .orElseThrow(() -> new BusinessException(BaseResponseStatus.NOT_FOUND));
    }

    @Transactional
    public Room updateRoom(Long roomId, Room roomRequest) {
        Room room = getRoom(roomId);

        room.setRoomTitle(roomRequest.getRoomTitle());
        room.setRoomPassword(roomRequest.getRoomPassword());
        room.setRoomOption(roomRequest.getRoomOption());
        room.setMaxPlayers(roomRequest.getMaxPlayers());
        room.setIsVoice(roomRequest.getIsVoice());

        return room;  // JPA가 자동으로 변경 감지하여 update 실행
    }

    @Transactional
    public void deleteRoom(Long roomId) {
        if (!roomRepository.existsById(roomId)) {
            throw new BusinessException(BaseResponseStatus.NOT_FOUND);
        }
        roomRepository.deleteById(roomId);
    }
}

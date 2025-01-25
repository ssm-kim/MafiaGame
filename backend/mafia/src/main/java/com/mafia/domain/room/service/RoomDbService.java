package com.mafia.domain.room.service;

import static com.mafia.global.common.model.dto.BaseResponseStatus.ALREADY_HAS_ROOM;
import static com.mafia.global.common.model.dto.BaseResponseStatus.ROOM_TITLE_INVALID;
import static com.mafia.global.common.model.dto.BaseResponseStatus.ROOM_TITLE_LIMIT;
import static com.mafia.global.common.model.dto.BaseResponseStatus.UNAUTHORIZED_ACCESS;

import com.mafia.domain.room.model.Room;
import com.mafia.domain.room.model.RoomRequest;
import com.mafia.domain.room.model.RoomResponse;
import com.mafia.domain.room.repository.RoomRepository;
import com.mafia.global.common.exception.exception.BusinessException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class RoomDbService {

    private final RoomRepository DbRoomRepository;
    private final RoomRedisService roomRedisService;

    /**
     * 새로운 게임방 생성
     *
     * @param roomRequest 방 생성 요청 정보 (방 제목)
     * @param memberId    방장 ID
     * @return 방 생성 성공 여부
     * @throws BusinessException INVALID_ROOM_TITLE, ROOM_TITLE_LIMIT
     */
    public boolean createRoom(RoomRequest roomRequest, Long memberId) {
        // 유저가 이미 방을 생성하거나 참여 중인지 확인
        if (roomRedisService.isMemberInfRoom(memberId)) {
            throw new BusinessException(ALREADY_HAS_ROOM);
        }

        // 방 제목 유효성 검증
        if (roomRequest.getRoomTitle() == null ||
            roomRequest.getRoomTitle().isEmpty()) {
            throw new BusinessException(ROOM_TITLE_INVALID);
        }

        // 방 제목 적절한 최대 길이 설정
        if (roomRequest.getRoomTitle().length() > 30) {
            throw new BusinessException(ROOM_TITLE_LIMIT);
        }

        // RDB 방 생성
        Room room = new Room();
        room.setHostId(memberId);
        room.setRoomTitle(roomRequest.getRoomTitle().trim());  // 앞뒤 공백 제거
        Room savedRoom = DbRoomRepository.save(room);

        // Redis 방 정보 저장
        roomRedisService.createRoomInfo(savedRoom.getRoomId(), savedRoom.getHostId());

        return true;
    }

    /**
     * 모든 게임방 목록과 각 방의 현재 인원수 조회
     *
     * @return 방 목록 (방 제목, ID, 현재 인원수)
     */
    public List<RoomResponse> getAllRooms() {
        List<Room> rooms = DbRoomRepository.findAll();
        HashMap<Long, Integer> allRoomInfo = roomRedisService.roomsCount();
        List<RoomResponse> roomList = new ArrayList<>();

        // 각 방의 게임 목록 조회 (제목, 방ID, 현재 인원)
        for (Room room : rooms) {
            RoomResponse roomResponse = new RoomResponse();
            roomResponse.setRoomTitle(room.getRoomTitle());
            roomResponse.setRoomId(room.getRoomId());
            roomResponse.setPeopleCnt(allRoomInfo.get(room.getRoomId()));
            roomList.add(roomResponse);
        }
        return roomList;
    }

    /**
     * 게임방 삭제 (호스트만 가능)
     *
     * @param roomId   방 ID
     * @param memberId 삭제 요청한 사용자 ID
     * @throws BusinessException UNAUTHORIZED_ACCESS
     */
    public void deleteRoom(Long roomId, Long memberId) {
        // 호스트 검증
        if (DbRoomRepository.findByRoomIdAndHostId(roomId, memberId).isEmpty()) {
            throw new BusinessException(UNAUTHORIZED_ACCESS);
        }

        // 호스트만 방 삭제 가능
        DbRoomRepository.deleteById(roomId);
        roomRedisService.deleteById(roomId);
    }
}
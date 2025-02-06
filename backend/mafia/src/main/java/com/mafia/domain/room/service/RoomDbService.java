package com.mafia.domain.room.service;

import static com.mafia.global.common.model.dto.BaseResponseStatus.ALREADY_HAS_ROOM;
import static com.mafia.global.common.model.dto.BaseResponseStatus.ROOM_TITLE_INVALID;
import static com.mafia.global.common.model.dto.BaseResponseStatus.ROOM_TITLE_LIMIT;

import com.mafia.domain.room.model.RoomIdResponse;
import com.mafia.domain.room.model.RoomRequest;
import com.mafia.domain.room.model.RoomResponse;
import com.mafia.domain.room.model.entity.Room;
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
    public RoomIdResponse createRoom(RoomRequest roomRequest, Long memberId) {
        // 유저가 이미 방을 생성하거나 참여 중인지 확인
        if (roomRedisService.isMemberInRoom(memberId)) {
            throw new BusinessException(ALREADY_HAS_ROOM);
        }

        // 방 제목 유효성 검증
        if (roomRequest.getRoomTitle() == null || roomRequest.getRoomTitle().isEmpty()) {
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
        room.setRoomPassword(roomRequest.getRoomPassword());   // null이면 공백
        Room savedRoom = DbRoomRepository.save(room);

        // Redis 방 정보 저장시 필요 인원 수 설정
        roomRedisService.createRoomInfo(savedRoom.getRoomId(), savedRoom.getHostId(),
            roomRequest.getRequiredPlayer());

        // 방 번호 객체 생성
        RoomIdResponse response = new RoomIdResponse();
        response.setRoomId(room.getRoomId());

        return response;
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
            roomResponse.setPeopleCnt(allRoomInfo.getOrDefault(room.getRoomId(), 0));
            roomList.add(roomResponse);
        }

        return roomList;
    }

    /**
     * 게임방 삭제 및 Redis와 RDB에서 방 정보를 모두 삭제
     *
     * @param roomId 방 ID
     */
    public void deleteRoom(Long roomId) {
        DbRoomRepository.deleteById(roomId);
        roomRedisService.deleteById(roomId);
    }
}
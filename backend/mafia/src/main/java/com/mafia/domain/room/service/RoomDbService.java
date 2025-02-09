package com.mafia.domain.room.service;

import static com.mafia.global.common.model.dto.BaseResponseStatus.ALREADY_HAS_ROOM;
import static com.mafia.global.common.model.dto.BaseResponseStatus.INVALID_PASSWORD;
import static com.mafia.global.common.model.dto.BaseResponseStatus.ROOM_NOT_FOUND;

import com.mafia.domain.room.model.entity.Room;
import com.mafia.domain.room.model.redis.RoomInfo;
import com.mafia.domain.room.model.request.RoomRequest;
import com.mafia.domain.room.model.response.RoomIdResponse;
import com.mafia.domain.room.model.response.RoomResponse;
import com.mafia.domain.room.repository.RoomRepository;
import com.mafia.global.common.exception.exception.BusinessException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class RoomDbService {

    private final RoomRepository DbRoomRepository;
    private final RoomRedisService roomRedisService;
    // private final RoomMessageService messageService;

    /**
     * 새로운 게임방 생성
     *
     * @param roomRequest 방 생성 요청 정보 (방 제목)
     * @param memberId    방장 ID
     * @return 방 생성 성공 여부
     * @throws BusinessException INVALID_ROOM_TITLE, ROOM_TITLE_LIMIT
     */
    public RoomIdResponse createRoom(RoomRequest roomRequest, Long memberId) {
        // 비밀번호 유효성 검사
        String password = roomRequest.getPassword();
        if (password != null && (password.length() < 4 || password.length() > 16)) {
            throw new BusinessException(INVALID_PASSWORD);  // 에러 코드는 상황에 맞게 수정
        }

        // 유저가 이미 방을 생성하거나 참여 중인지 확인
        if (roomRedisService.isMemberInRoom(memberId)) {
            throw new BusinessException(ALREADY_HAS_ROOM);
        }

        // RDB 방 생성
        Room room = new Room();
        room.setHostId(memberId);
        room.setTitle(roomRequest.getTitle().trim());
        room.setPassword(roomRequest.getPassword());
        room.setRequiredPlayers(roomRequest.getRequiredPlayers());
        room.changeStatusToInActive();
        Room savedRoom = DbRoomRepository.save(room);

        // Redis에 방 정보 저장
        roomRedisService.createRoomInfo(savedRoom.getRoomId(), savedRoom.getHostId(),
            roomRequest.getRequiredPlayers(), savedRoom.getTitle(), savedRoom.getPassword(),
            roomRequest.getGameOption());

        log.info("Room created - roomId: {}, hostId: {}", savedRoom.getRoomId(), memberId);
        return new RoomIdResponse(savedRoom.getRoomId());
    }

    /**
     * 모든 게임방 목록과 각 방의 현재 인원수 조회
     *
     * @return 방 목록 (방 제목, ID, 현재 인원수)
     */
    public List<RoomResponse> getAllRooms() {
        List<Room> rooms = DbRoomRepository.findAll();
        HashMap<Long, Integer> allRoomInfo = roomRedisService.getRoomPlayerCounts();
        List<RoomResponse> roomList = new ArrayList<>();

        // 각 방의 게임 목록 조회 (제목, 방ID, 현재 인원)
        for (Room room : rooms) {
            RoomResponse roomResponse = new RoomResponse();
            roomResponse.setRoomId(room.getRoomId());
            roomResponse.setRoomTitle(room.getTitle());
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
        // messageService.sendRoomListToAll();
    }

    // 4. 특정 방 정보 조회
    @Transactional(readOnly = true)
    public RoomInfo getRoom(Long roomId) {
        return roomRedisService.findById(roomId);
    }

    // 게임 시작 활성화
    public void isActive(Long roomId) {
        Room room = DbRoomRepository.findById(roomId)
            .orElseThrow(() -> new BusinessException(ROOM_NOT_FOUND));

        room.changeStatusToActive();
    }

}
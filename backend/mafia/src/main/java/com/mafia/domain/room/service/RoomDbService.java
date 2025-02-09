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

/**
 * 게임방 DB 관리 서비스 - RDB와 Redis를 통합 관리하여 방 정보의 영속성과 실시간 처리를 담당
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class RoomDbService {

    private final RoomRepository DbRoomRepository;
    private final RoomRedisService roomRedisService;

    /**
     * 새로운 게임방 생성 - 방 생성 후 RDB 저장 및 Redis 캐싱
     */
    public RoomIdResponse createRoom(RoomRequest roomRequest, Long memberId) {

        // 유효성 검사
        validateRoomCreation(roomRequest, memberId);

        // RDB 방 생성
        Room room = new Room();
        room.setHostId(memberId);
        room.setTitle(roomRequest.getTitle().trim());
        room.setPassword(roomRequest.getPassword());
        room.setRequiredPlayers(roomRequest.getRequiredPlayers());
        room.changeStatusToInActive();
        Room savedRoom = DbRoomRepository.save(room);

        // Redis에 방 생성
        roomRedisService.createRoomInfo(savedRoom.getRoomId(), savedRoom.getHostId(),
            roomRequest.getRequiredPlayers(), savedRoom.getTitle(), savedRoom.getPassword(),
            roomRequest.getGameOption());

        log.info("방 생성 완료 - 방 번호: {}, 방장: {}", savedRoom.getRoomId(), memberId);
        return new RoomIdResponse(savedRoom.getRoomId());
    }

    /**
     * 전체 게임방 목록 조회 - RDB의 방 정보와 Redis의 실시간 인원 정보를 조합하여 반환
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
     * 게임방 삭제 - RDB와 Redis에서 동시 삭제
     */
    public void deleteRoom(Long roomId) {
        DbRoomRepository.deleteById(roomId);
        roomRedisService.deleteById(roomId);
        // messageService.sendRoomListToAll();
    }

    /**
     * 특정 방 정보 조회
     */
    @Transactional(readOnly = true)
    public RoomInfo getRoom(Long roomId) {
        return roomRedisService.findById(roomId);
    }

    /**
     * 게임 시작 상태로 변경
     */
    public void isActive(Long roomId) {
        Room room = DbRoomRepository.findById(roomId)
            .orElseThrow(() -> new BusinessException(ROOM_NOT_FOUND));

        room.changeStatusToActive();
    }

    /**
     * 유틸리티 메서드 방 생성 요청 유효성 검증
     */
    private void validateRoomCreation(RoomRequest roomRequest, Long memberId) {
        // 비밀번호 유효성 검사
        String password = roomRequest.getPassword();
        if (password != null && (password.length() < 4 || password.length() > 16)) {
            throw new BusinessException(INVALID_PASSWORD);
        }

        // 유저의 중복 참여 검사
        if (roomRedisService.isMemberInRoom(memberId)) {
            throw new BusinessException(ALREADY_HAS_ROOM);
        }
    }
}
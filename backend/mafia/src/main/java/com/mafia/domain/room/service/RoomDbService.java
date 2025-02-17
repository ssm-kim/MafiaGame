package com.mafia.domain.room.service;

import static com.mafia.global.common.model.dto.BaseResponseStatus.ALREADY_HAS_ROOM;
import static com.mafia.global.common.model.dto.BaseResponseStatus.LENGTH_PASSWORD;
import static com.mafia.global.common.model.dto.BaseResponseStatus.ROOM_INVALID_PLAYERS;
import static com.mafia.global.common.model.dto.BaseResponseStatus.ROOM_NOT_FOUND;
import static com.mafia.global.common.model.dto.BaseResponseStatus.ROOM_TITLE_INVALID;
import static com.mafia.global.common.model.dto.BaseResponseStatus.ROOM_TITLE_LIMIT;

import com.mafia.domain.room.model.entity.Room;
import com.mafia.domain.room.model.redis.RoomInfo;
import com.mafia.domain.room.model.request.RoomRequest;
import com.mafia.domain.room.model.response.RoomEnterResponse;
import com.mafia.domain.room.model.response.RoomIdResponse;
import com.mafia.domain.room.model.response.RoomResponse;
import com.mafia.domain.room.repository.RoomRepository;
import com.mafia.global.common.exception.exception.BusinessException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map.Entry;
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
        log.info("방 생성 요청 - title: {}, requiredPlayers: {}, password: {}",
            roomRequest.getTitle(),
            roomRequest.getRequiredPlayers(),
            (roomRequest.getPassword() != null ? "있음" : "없음")
        );

        if (roomRequest.getTitle() == null || roomRequest.getTitle().isEmpty()) {
            throw new BusinessException(ROOM_TITLE_INVALID);
        }

        if (roomRequest.getTitle().length() > 50) {
            throw new BusinessException(ROOM_TITLE_LIMIT);
        }

        int requiredPlayers = roomRequest.getRequiredPlayers();
        if (requiredPlayers < 6 || requiredPlayers > 8) {
            throw new BusinessException(ROOM_INVALID_PLAYERS);
        }

        String password = roomRequest.getPassword();
        if (password != null && (password.length() < 4 || password.length() > 16)) {
            throw new BusinessException(LENGTH_PASSWORD);
        }

        if (roomRedisService.isMemberInRoom(memberId)) {
            throw new BusinessException(ALREADY_HAS_ROOM);
        }  // 중복 참여 체크

        // RDB 방 생성
        Room room = new Room();
        room.setHostId(memberId);
        room.setTitle(roomRequest.getTitle().trim());
        room.setPassword(roomRequest.getPassword());
        room.setRequiredPlayers(roomRequest.getRequiredPlayers());
        room.changeStatusToInActive();
        Room savedRoom = DbRoomRepository.save(room);

        // Redis 방 생성 ( Redis 만 게임 옵션 저장 )
        roomRedisService.createRoomInfo(savedRoom.getRoomId(), savedRoom.getHostId(),
            roomRequest.getRequiredPlayers(), savedRoom.getTitle(), savedRoom.getPassword(),
            roomRequest.getGameOption());

        log.info("방 생성 완료 - 방 번호: {}, 방장: {}, 게임 옵션: {}\n",
            room.getRoomId(), room.getHostId(), roomRequest.getGameOption());
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
            roomResponse.setRequiredPlayers(room.getRequiredPlayers());
            roomResponse.setStart(false);
            roomList.add(roomResponse);
        }

        return roomList;
    }

    /**
     * 특정 방 정보 조회
     */
    @Transactional(readOnly = true)
    public RoomInfo getRoom(Long roomId) {

        RoomInfo originRoomInfo = roomRedisService.findById(roomId);

        // 새로운 RoomInfo 객체 생성 필요한 데이터만 복사
        RoomInfo copyRoomInfo = new RoomInfo(
            originRoomInfo.getRoomId(),
            originRoomInfo.getTitle(),
            originRoomInfo.getPassword(),
            originRoomInfo.getRequiredPlayers(),
            originRoomInfo.getGameOption()
        );

        // memberMapping 복사 및 값을 0으로 설정
        HashMap<Integer, Long> newMemberMapping = new HashMap<>();
        for (Entry<Integer, Long> entry : originRoomInfo.getMemberMapping().entrySet()) {
            newMemberMapping.put(entry.getKey(), 0L);
        }
        copyRoomInfo.setMemberMapping(newMemberMapping);

        return copyRoomInfo;
    }

    /**
     * 게임방 삭제 - RDB와 Redis에서 동시 삭제
     */
    public void deleteRoom(Long roomId) {
        DbRoomRepository.deleteById(roomId);
        roomRedisService.deleteById(roomId);
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
     * 방 내부에서 참가자 번호(본인) 조회
     */
    public RoomEnterResponse searchParticipantNo(Long roomId, Long memberId) {
        RoomInfo roomInfo = roomRedisService.findById(roomId);

        int participantNo = roomInfo.getMemberMapping().entrySet().stream()
            .filter(entry -> entry.getValue().equals(memberId))
            .map(Entry::getKey)
            .findFirst()
            .orElse(0);

        return RoomEnterResponse.builder()
            .myParticipantNo(participantNo)
            .build();
    }
}
package com.mafia.domain.room.service;

import com.mafia.domain.room.model.dto.request.RoomRequest;
import com.mafia.domain.room.model.dto.response.RoomResponse;
import com.mafia.domain.room.model.entity.Room;
import com.mafia.domain.room.model.entity.RoomPlayer;
import com.mafia.domain.room.model.entity.RoomPlayerId;
import com.mafia.domain.room.repository.RoomPlayerRepository;
import com.mafia.domain.room.repository.RoomRepository;
import com.mafia.global.common.exception.exception.BusinessException;
import com.mafia.global.common.model.dto.BaseResponseStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * 마피아 게임방 관련 비즈니스 로직을 처리하는 서비스입니다.
 * [클라이언트] → RoomRequest(DTO) → [Controller] → RoomRequest(DTO) → [Service]
 *                                                                        ↓
 *                                                                     Entity 변환
 *                                                                        ↓
 *                                                                 비즈니스 로직 처리
 *                                                                        ↓
 *                                                               RoomResponse(DTO) 변환
 *                                                                        ↓
 * [클라이언트] ← RoomResponse(DTO) ← [Controller] ← RoomResponse(DTO) ← [Service]
 */

@Service
@RequiredArgsConstructor
@Transactional
public class RoomServiceImpl implements RoomService {

    private final RoomRepository roomRepository;
    private final RoomPlayerRepository roomPlayerRepository;

    /**
     * 새로운 게임방을 생성합니다.
     * 생성 시 방 상태(roomStatus)는 false(시작 전)로 설정됩니다.
     * @throws BusinessException 방 제목이 중복된 경우
     */
    @Override
    public RoomResponse createRoom(RoomRequest roomRequest) {
        Room room = roomRequest.toEntity();
        Room savedRoom = roomRepository.save(room);
        return new RoomResponse(savedRoom);
    }

    /** 모든 게임방 목록을 반환합니다. */
    @Override
    public List<RoomResponse> getAllRooms() {
        List<Room> rooms = roomRepository.findAll();



        return rooms.stream()
                .map(room -> {
                    // 각 방의 실제 참가자 수 조회
                    int actualPlayerCount = roomPlayerRepository.findByIdRoomId(room.getRoomId()).size();

                    System.out.println(actualPlayerCount + " ##############");

                    // 실제 참가자 수로 업데이트
                    room.setCurPlayers(actualPlayerCount);
                    roomRepository.save(room);

                    return new RoomResponse(room);
                })
                .collect(Collectors.toList());
    }


    /**
     * 게임방을 삭제합니다.
     * @throws BusinessException 방을 찾을 수 없는 경우
     */
    @Override
    @Transactional
    public void deleteRoom(Long roomId) {
        if (!roomRepository.existsById(roomId)) {
            throw new BusinessException(BaseResponseStatus.ROOM_NOT_FOUND);
        }
        roomRepository.deleteById(roomId);
    }

    @Override
    @Transactional
    public void increasePlayerCount(Long roomId, Long memberId) {
        // 해당 사용자가 현재 다른 방에 참여중인지 확인
        Optional<RoomPlayer> existingPlayer = roomPlayerRepository.findByIdMemberId(memberId);
        if (existingPlayer.isPresent()) {
            // 이 부분이 실행된다는 것은 해당 memberId를 가진 플레이어가 이미 어떤 방에 존재한다는 의미
            throw new BusinessException(BaseResponseStatus.ALREADY_IN_OTHER_ROOM);
        }

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new BusinessException(BaseResponseStatus.ROOM_NOT_FOUND));

        // 이미 방에 참여중인지 확인
        if (roomPlayerRepository.findByIdMemberIdAndIdRoomId(memberId, roomId).isPresent()) {
            throw new BusinessException(BaseResponseStatus.ALREADY_IN_OTHER_ROOM);
        }

        // 현재 실제 참가자 수 확인
        int curPlayerCnt = roomPlayerRepository.findByIdRoomId(roomId).size();

        // 현재 인원이 15명 미만인 경우에만 증가
        if (room.getCurPlayers() >= 15) {
            throw new BusinessException(BaseResponseStatus.ROOM_IS_FULL);
        }

        // 새로운 참가자 생성 (기본값 설정)
        RoomPlayer newPlayer = new RoomPlayer();
        RoomPlayerId newPlayerId = new RoomPlayerId(memberId, roomId);
        System.out.println(newPlayerId + " ################");
        newPlayer.setId(newPlayerId);
        roomPlayerRepository.save(newPlayer);

        // 현재 방의 인원 수 증가
        room.setCurPlayers(curPlayerCnt + 1);
        roomRepository.save(room);
    }

    @Override
    @Transactional
    public void decreasePlayerCount(Long roomId, Long memberId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new BusinessException(BaseResponseStatus.ROOM_NOT_FOUND));

        // 현재 실제 참가자 수 확인
        int curPlayerCnt = roomPlayerRepository.findByIdRoomId(roomId).size();

        // 현재 인원이 1명보다 많은 경우에만 감소
        if (curPlayerCnt <= 1) {
            throw new BusinessException(BaseResponseStatus.ROOM_INVALID_PLAYER_COUNT);
        }

        // 해당 방의 특정 사용자 데이터 삭제
        RoomPlayer player = roomPlayerRepository.findByIdMemberIdAndIdRoomId(memberId, roomId)
                .orElseThrow(() -> new BusinessException(BaseResponseStatus.PLAYER_NOT_FOUND));
        roomPlayerRepository.delete(player);

        // 현재 방의 인원 수 감소
        room.setCurPlayers(curPlayerCnt - 1);
        roomRepository.save(room);
    }

    /**
     * 특정 게임방을 조회합니다.
     * @throws BusinessException 방을 찾을 수 없는 경우
     */
    @Override
    public RoomResponse getRoom(Long roomId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new BusinessException(BaseResponseStatus.ROOM_NOT_FOUND));
        return new RoomResponse(room);
    }

    /**
     * 게임방 정보를 수정합니다.
     * @throws BusinessException 방을 찾을 수 없거나 플레이어 수가 유효하지 않은 경우(4~15명)
     */
    @Override
    @Transactional
    public RoomResponse updateRoom(Long roomId, RoomRequest roomRequest) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new BusinessException(BaseResponseStatus.ROOM_NOT_FOUND));

        if (roomRequest.getCurPlayers() != null &&
                (roomRequest.getCurPlayers() < 4 || roomRequest.getCurPlayers() > 15)) {
            throw new BusinessException(BaseResponseStatus.ROOM_INVALID_PLAYER_COUNT);
        }

        room.setRoomTitle(roomRequest.getRoomTitle());
        room.setRoomPassword(roomRequest.getRoomPassword());
        room.setRoomOption(roomRequest.getRoomOption());
        room.setCurPlayers(roomRequest.getCurPlayers());
        room.setIsVoice(roomRequest.getIsVoice());

        return new RoomResponse(room);
    }
}
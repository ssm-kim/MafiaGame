package com.mafia.domain.room.service;

import com.mafia.domain.room.model.dto.request.RoomRequest;
import com.mafia.domain.room.model.dto.response.RoomPlayerResponse;
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


@Service
@RequiredArgsConstructor
@Transactional
public class RoomServiceImpl implements RoomService {

    private final RoomRepository roomRepository;
    private final RoomPlayerRepository roomPlayerRepository;

    /**
     * 새로운 게임방을 생성합니다.
     * 생성 시 방 상태(roomStatus)는 false(시작 전)로 설정됩니다.
     */
    @Override
    public RoomResponse createRoom(RoomRequest roomRequest) {

        // 해당 유저가 이미 다른 방에 있는지 확인
        if (roomPlayerRepository.findByIdMemberId(roomRequest.getMemberId()).isPresent()) {
            throw new BusinessException(BaseResponseStatus.ALREADY_IN_OTHER_ROOM);
        }

        // 방 생성
        Room room = roomRequest.toEntity();
        Room savedRoom = roomRepository.save(room);

        // 방장을 참가자로 등록
        RoomPlayer roomPlayer = new RoomPlayer();
        roomPlayer.setId(new RoomPlayerId(roomRequest.getMemberId(), savedRoom.getRoomId()));
        roomPlayerRepository.save(roomPlayer);

        return new RoomResponse(savedRoom);
    }

    /** 모든 게임방 목록을 반환합니다. */
    @Override
    public List<RoomResponse> getAllRooms() {
        List<Room> rooms = roomRepository.findAll();
        return rooms.stream()
                .map(room -> {
                    // 각 방의 실제 참가자 수 조회 및 업데이트
                    int actualPlayerCount = roomPlayerRepository.findByIdRoomId(room.getRoomId()).size();
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

        // 새로운 참가자 생성
        RoomPlayer newPlayer = new RoomPlayer();
        newPlayer.setId(new RoomPlayerId(memberId, roomId));
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

        // 방장이 나가는 경우 방 삭제
        if (room.getMemberId().equals(memberId)) {
            deleteRoom(roomId);
            return;
        }

        // 해당 방의 특정 사용자 데이터 삭제
        RoomPlayer player = roomPlayerRepository.findByIdMemberIdAndIdRoomId(memberId, roomId)
                .orElseThrow(() -> new BusinessException(BaseResponseStatus.PLAYER_NOT_FOUND));
        roomPlayerRepository.delete(player);

        // 실제 참가자 수 확인
        int curPlayerCnt = roomPlayerRepository.findByIdRoomId(roomId).size();

        // 방의 인원 수 감소
        room.setCurPlayers(curPlayerCnt - 1);
        roomRepository.save(room);
    }

    @Override
    public List<RoomPlayerResponse> getRoomPlayers(Long roomId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new BusinessException(BaseResponseStatus.ROOM_NOT_FOUND));

        List<RoomPlayer> players = roomPlayerRepository.findByIdRoomId(roomId);
        return players.stream()
                .map(player -> RoomPlayerResponse.from(player, room))
                .collect(Collectors.toList());
    }

    @Override
    public void toggleReady(Long roomId, Long memberId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new BusinessException(BaseResponseStatus.ROOM_NOT_FOUND));

        // 방장은 준비할 필요 없음
        if (room.getMemberId().equals(memberId)) {
            throw new BusinessException(BaseResponseStatus.HOST_CANNOT_READY);
        }

        RoomPlayer player = roomPlayerRepository.findByIdMemberIdAndIdRoomId(memberId, roomId)
                .orElseThrow(() -> new BusinessException(BaseResponseStatus.PLAYER_NOT_FOUND));

        player.setIsReady(!player.getIsReady());  // 토글
        roomPlayerRepository.save(player);
    }

    @Override
    public void startGame(Long roomId, Long memberId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new BusinessException(BaseResponseStatus.ROOM_NOT_FOUND));

        // 방장 권한 체크
        if (!room.getMemberId().equals(memberId)) {
            throw new BusinessException(BaseResponseStatus.UNAUTHORIZED_ACCESS);
        }

        // 모든 플레이어의 준비상태 확인
        List<RoomPlayer> players = roomPlayerRepository.findByIdRoomId(roomId);
        boolean allReady = players.stream()
                .filter(p -> !p.getId().getMemberId().equals(room.getMemberId()))  // 방장 제외
                .allMatch(RoomPlayer::getIsReady);  // 모두 준비완료인지

        if (!allReady) {
            throw new BusinessException(BaseResponseStatus.NOT_ALL_PLAYERS_READY);
        }

        room.setRoomStatus(true);  // 게임 시작 상태로 변경
        roomRepository.save(room);
    }
}
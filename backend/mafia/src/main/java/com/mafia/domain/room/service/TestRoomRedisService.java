package com.mafia.domain.room.service;

import static com.mafia.global.common.model.dto.BaseResponseStatus.ALREADY_HAS_ROOM;
import static com.mafia.global.common.model.dto.BaseResponseStatus.HOST_CANNOT_READY;
import static com.mafia.global.common.model.dto.BaseResponseStatus.INVALID_ROOM_PASSWORD;
import static com.mafia.global.common.model.dto.BaseResponseStatus.PLAYER_NOT_FOUND;
import static com.mafia.global.common.model.dto.BaseResponseStatus.ROOM_FULL;
import static com.mafia.global.common.model.dto.BaseResponseStatus.ROOM_NOT_FOUND;

import com.mafia.domain.member.service.MemberService;
import com.mafia.domain.room.model.entity.Room;
import com.mafia.domain.room.model.redis.Participant;
import com.mafia.domain.room.model.redis.RoomInfo;
import com.mafia.domain.room.repository.RoomRedisRepository;
import com.mafia.domain.room.repository.RoomRepository;
import com.mafia.global.common.exception.exception.BusinessException;
import java.util.HashMap;
import java.util.Optional;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


@Service
@RequiredArgsConstructor
@Transactional
public class TestRoomRedisService {

    private final RoomRedisRepository roomRedisRepository;
    private final RoomRepository roomRepository;
    private final MemberService memberService;

    /**
     * Redis에서 방 정보 조회
     *
     * @param roomId 방 ID
     * @throws BusinessException ROOM_NOT_FOUND
     */
    public RoomInfo findById(long roomId) {
        return Optional.ofNullable(roomRedisRepository.findById(roomId))
            .orElseThrow(() -> new BusinessException(ROOM_NOT_FOUND));
    }

    /**
     * 방 생성 시 Redis에 방 정보 저장 방장을 첫 참가자로 등록
     *
     * @param roomId         방 ID
     * @param hostId         방장 ID
     * @param requiredPlayer 게임 시작에 필요한 인원 수
     */
    public void createRoomInfo(Long roomId, Long hostId, int requiredPlayer) {
        RoomInfo roomInfo = new RoomInfo(roomId, hostId);
        Participant host = new Participant();

        // 테스트용 닉네임 설정
        host.setMemberId(hostId);
        host.setNickName("테스트유저" + hostId);

        roomInfo.getParticipant().put(hostId, host);
        roomInfo.getGameOption().setRequiredPlayers(requiredPlayer);
        roomRedisRepository.save(roomId, roomInfo);
    }


    /**
     * 현재 방 참가자 수 조회
     *
     * @return Map<방ID, 참가자수>
     */
    public HashMap<Long, Integer> roomsCount() {
        return roomRedisRepository.getRoomPlayerCounts();
    }

    public void deleteById(Long roomId) {
        roomRedisRepository.delete(roomId);
    }

    /**
     * 참가자 방 입장 처리
     *
     * @param roomId   방 ID
     * @param memberId 참가자 ID
     * @param password 방 비밀번호 (없는 경우 null)
     * @throws BusinessException ALREADY_HAS_ROOM, ROOM_NOT_FOUND, INVALID_ROOM_PASSWORD, ROOM_FULL
     */
    public void enterRoom(Long roomId, Long memberId, String password) {
        if (isMemberInRoom(memberId)) {
            throw new BusinessException(ALREADY_HAS_ROOM);
        }

        Room room = roomRepository.findById(roomId)
            .orElseThrow(() -> new BusinessException(ROOM_NOT_FOUND));

        if (room.getRoomPassword() != null && !room.getRoomPassword().equals(password)) {
            throw new BusinessException(INVALID_ROOM_PASSWORD);
        }

        RoomInfo roomInfo = findById(roomId);

        if (roomInfo.getParticipant().size() >= roomInfo.getGameOption().getRequiredPlayers()) {
            throw new BusinessException(ROOM_FULL);
        }

        // 테스트용 참가자 정보 생성
        Participant participant = new Participant();
        participant.setMemberId(memberId);
        participant.setNickName("테스트유저" + memberId);

        roomInfo.getParticipant().put(memberId, participant);
        roomRedisRepository.save(roomId, roomInfo);
    }

    /**
     * 참가자 방 퇴장 처리
     *
     * @param roomId   방 ID
     * @param memberId 참가자 ID
     */
    public void leaveRoom(Long roomId, Long memberId) {
        // 방 정보 조회
        RoomInfo roomInfo = findById(roomId);

        // 방장 퇴장인 경우 방 삭제
        if (isHost(roomId, memberId)) {
            roomRedisRepository.delete(roomId);
            return;
        }

        // 일반 유저 퇴장
        roomInfo.getParticipant().remove(memberId);
        roomRedisRepository.save(roomId, roomInfo);
    }

    /**
     * 참가자 준비 상태를 토글 (호스트 불가)
     *
     * @throws BusinessException HOST_CANNOT_READY, PLAYER_NOT_FOUND
     */
    public void toggleReady(Long roomId, Long memberId) {
        // 현재 방 정보 조회
        RoomInfo roomInfo = findById(roomId);

        // 호스트 준비 시도 차단
        if (isHost(roomId, memberId)) {
            throw new BusinessException(HOST_CANNOT_READY);
        }

        // 참가자 정보 조회
        Participant participant = roomInfo.getParticipant().get(memberId);
        if (participant == null) {
            throw new BusinessException(PLAYER_NOT_FOUND);
        }

        // 준비 상태 토글
        participant.setReady(!participant.isReady());

        // 전체 참가자 중 준비된 사람 수 계산
        int curReadyCnt = 0;
        for (Participant p : roomInfo.getParticipant().values()) {
            if (p.isReady()) {
                curReadyCnt++;
            }
        }

        roomInfo.setReadyCnt(curReadyCnt);
        roomRedisRepository.save(roomId, roomInfo);

        // return !participant.isReady();
    }

    /**
     * 유저가 이미 방을 생성하거나 참여중인지 확인
     *
     * @param memberId 참가자 ID
     */
    public boolean isMemberInRoom(Long memberId) {
        Set<String> allRoomKeys = roomRedisRepository.getAllRooms();

        for (String roomKey : allRoomKeys) {
            // key가 "list:room:1" 형태이므로 마지막 숫자만 추출
            String roomId = roomKey.substring(roomKey.lastIndexOf(":") + 1);
            RoomInfo roomInfo = roomRedisRepository.findById(Long.valueOf(roomId));

            if (roomInfo != null && roomInfo.getParticipant().containsKey(memberId)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 현재방의 방장인지 확인
     *
     * @param roomId   방 ID
     * @param memberId 참가자 ID
     */
    public boolean isHost(Long roomId, Long memberId) {
        RoomInfo roomInfo = findById(roomId);
        return roomInfo.getHostId().equals(memberId);
    }
}
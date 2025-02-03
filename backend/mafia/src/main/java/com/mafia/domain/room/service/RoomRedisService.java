package com.mafia.domain.room.service;

import static com.mafia.global.common.model.dto.BaseResponseStatus.ALREADY_HAS_ROOM;
import static com.mafia.global.common.model.dto.BaseResponseStatus.HOST_CANNOT_READY;
import static com.mafia.global.common.model.dto.BaseResponseStatus.INVALID_ROOM_PASSWORD;
import static com.mafia.global.common.model.dto.BaseResponseStatus.PLAYER_NOT_FOUND;
import static com.mafia.global.common.model.dto.BaseResponseStatus.ROOM_FULL;
import static com.mafia.global.common.model.dto.BaseResponseStatus.ROOM_NOT_FOUND;

import com.mafia.domain.member.model.dto.response.MemberResponse;
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
public class RoomRedisService {

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
        Participant host = new Participant();  // 방장을 첫 참가자로 추가

        MemberResponse memberInfo = memberService.getMemberInfo(hostId);
        host.setMemberId(hostId);
        host.setNickName(memberInfo.getNickname());

        roomInfo.getParticipant().put(hostId, host);
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
        // 유저가 이미 방을 생성하거나 참여 중인지 확인
        if (isMemberInRoom(memberId)) {
            throw new BusinessException(ALREADY_HAS_ROOM);
        }

        // RDB에서 방 존재 여부
        Room room = roomRepository.findById(roomId)
            .orElseThrow(() -> new BusinessException(ROOM_NOT_FOUND));

        // 비밀번호 확인
        if (room.getRoomPassword() != null && !room.getRoomPassword().equals(password)) {
            throw new BusinessException(INVALID_ROOM_PASSWORD);
        }

        // Redis에서 방 정보 조회
        RoomInfo roomInfo = findById(roomId);

        // 입장 전에 인원 수 체크
        if (roomInfo.getParticipant().size() >= roomInfo.getRequiredPlayers()) {
            throw new BusinessException(ROOM_FULL);
        }

        // 참가자 정보 생성 (회원 ID, 닉네임)
        Participant participant = new Participant();
        participant.setMemberId(memberId);

        // 실제 멤버 정보로 닉네임 설정
        MemberResponse memberInfo = memberService.getMemberInfo(memberId);
        participant.setNickName(memberInfo.getNickname());

        // 참가자 추가 및 Redis 저장
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
    }

    /**
     * 유저가 이미 방을 생성하거나 참여중인지 확인
     *
     * @param memberId 참가자 ID
     */
    public boolean isMemberInRoom(Long memberId) {
        Set<String> allRoomKeys = roomRedisRepository.getAllRooms();

        for (String roomKey : allRoomKeys) {
            RoomInfo roomInfo = roomRedisRepository.findById(Long.valueOf(roomKey.split(":")[2]));
            if (roomInfo != null && roomInfo.getParticipant().containsKey(memberId)) {
                return true;
            }  // 유저가 이미 방에 참여 중인 경우
        }
        return false;  // 유저가 어떤 방에도 참여하지 않은 경우
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
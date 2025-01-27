package com.mafia.domain.room.service;

import static com.mafia.global.common.model.dto.BaseResponseStatus.HOST_CANNOT_READY;
import static com.mafia.global.common.model.dto.BaseResponseStatus.PLAYER_NOT_FOUND;
import static com.mafia.global.common.model.dto.BaseResponseStatus.ROOM_NOT_FOUND;

import com.mafia.domain.member.model.dto.response.MemberResponse;
import com.mafia.domain.member.service.MemberService;
import com.mafia.domain.room.model.Participant;
import com.mafia.domain.room.model.RoomInfo;
import com.mafia.domain.room.repository.RoomRedisRepository;
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
    private final MemberService memberService;

    /**
     * 방 정보 조회
     *
     * @throws BusinessException ROOM_NOT_FOUND 방을 찾을 수 없는 경우
     */
    public RoomInfo findById(long roomId) {
        return Optional.ofNullable(roomRedisRepository.findById(roomId))
            .orElseThrow(() -> new BusinessException(ROOM_NOT_FOUND));
    }

    /**
     * 방 생성 시 Redis 정보 저장
     *
     * @param roomId 방 ID
     * @param hostId 방장 ID
     */
    public void createRoomInfo(Long roomId, Long hostId) {
        RoomInfo roomInfo = new RoomInfo(roomId, hostId);

        // 방장을 첫 참가자로 추가
        Participant host = new Participant();
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
     * 참가자 방 입장
     *
     * @param roomId   방 ID
     * @param memberId 참가자 ID
     */
    public void enterRoom(Long roomId, Long memberId) {

        // 방 정보 조회
        RoomInfo roomInfo = findById(roomId);
        MemberResponse memberInfo = memberService.getMemberInfo(memberId);

        // 참가자 정보 생성 (회원 ID, 닉네임)
        Participant participant = new Participant();
        participant.setMemberId(memberId);
        participant.setNickName(memberInfo.getNickname());

        // 참가자 추가
        roomInfo.getParticipant().put(memberId, participant);

        // Redis 저장
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

        // 일반 유저 퇴장
        roomInfo.getParticipant().remove(memberId);
        roomRedisRepository.save(roomId, roomInfo);
    }

    /**
     * 참가자 준비 상태를 토글 (호스트 불가)
     *
     * @throws BusinessException HOST_CANNOT_READY 방장이 준비를 시도하는 경우
     * @throws BusinessException PLAYER_NOT_FOUND 참가자를 찾을 수 없는 경우
     */
    public void toggleReady(Long roomId, Long memberId) {
        // 현재 방 정보 조회
        RoomInfo roomInfo = findById(roomId);

        // 호스트 준비 시도 차단
        if (roomInfo.getHostId().equals(memberId)) {
            throw new BusinessException(HOST_CANNOT_READY);
        }

        // 참가자 정보 조회
        Participant participant = roomInfo.getParticipant().get(memberId);
        if (participant == null) {
            throw new BusinessException(PLAYER_NOT_FOUND);
        }

        // 준비 상태 토글
        boolean curReady = participant.isReady();

        participant.setReady(!curReady);

        roomInfo.setReadyCnt(curReady ?
            roomInfo.getReadyCnt() + 1 : roomInfo.getReadyCnt() - 1);

        roomRedisRepository.save(roomId, roomInfo);
    }

    public boolean isMemberInfRoom(Long memberId) {
        Set<String> allRoomKeys = roomRedisRepository.getAllRooms();

        System.out.println("Redis allRoomKeys: " + allRoomKeys);
        
        for (String roomKey : allRoomKeys) {
            RoomInfo roomInfo = roomRedisRepository.findById(Long.valueOf(roomKey.split(":")[1]));
            if (roomInfo != null && roomInfo.getParticipant().containsKey(memberId)) {
                return true;
            }  // 유저가 이미 방에 참여 중인 경우
        }
        return false;  // 유저가 어떤 방에도 참여하지 않은 경우
    }
}
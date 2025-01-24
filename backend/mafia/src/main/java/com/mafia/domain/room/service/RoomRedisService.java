package com.mafia.domain.room.service;

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
     */
    public RoomInfo findById(long roomId) {
        return Optional.ofNullable(roomRedisRepository.findById(roomId))
            .orElseThrow(() -> new BusinessException(ROOM_NOT_FOUND));
    }

    /**
     * 방 생성 시 Redis 정보 저장
     */
    public void createRoomInfo(Long roomId, Long hostId) {

        findById(roomId);  // 방이 없으면 예외처리

        RoomInfo roomInfo = new RoomInfo(roomId, hostId);
        roomRedisRepository.save(roomId, roomInfo);
    }

    /**
     * 현재 방 참가자 수 조회
     *
     * @return HashMap<방ID, 참가자수>
     */
    public HashMap<Long, Integer> roomsCount() {
        return roomRedisRepository.getRoomPlayerCounts();
    }

    public void deleteById(Long roomId) {
        roomRedisRepository.delete(roomId);
    }

    /**
     * 참가자 방 입장 처리
     */
    public void enterRoom(Long roomId, Long memberId) {

        // 방 정보 조회
        RoomInfo roomInfo = findById(roomId);
        MemberResponse memberInfo = memberService.getMemberInfo(memberId);

        // 참가자 생성
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
     */
    public void leaveRoom(Long roomId, Long memberId) {
        // 방 정보 조회
        RoomInfo roomInfo = findById(roomId);

        // 참가자 제거
        roomInfo.getParticipant().remove(memberId);

        // Redis 저장
        roomRedisRepository.save(roomId, roomInfo);
    }

    /**
     * 참가자 준비 상태를 토글
     */
    public void toggleReady(Long roomId, Long memberId) {
        // 현재 방 정보 조회
        RoomInfo roomInfo = findById(roomId);

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
}
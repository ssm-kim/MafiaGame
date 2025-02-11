package com.mafia.domain.room.service;

import static com.mafia.global.common.model.dto.BaseResponseStatus.ALREADY_HAS_ROOM;
import static com.mafia.global.common.model.dto.BaseResponseStatus.CANNOT_KICK_HOST;
import static com.mafia.global.common.model.dto.BaseResponseStatus.HOST_CANNOT_READY;
import static com.mafia.global.common.model.dto.BaseResponseStatus.INVALID_PASSWORD;
import static com.mafia.global.common.model.dto.BaseResponseStatus.NOT_ALL_READY;
import static com.mafia.global.common.model.dto.BaseResponseStatus.PLAYER_COUNT_INVALID;
import static com.mafia.global.common.model.dto.BaseResponseStatus.PLAYER_NOT_FOUND;
import static com.mafia.global.common.model.dto.BaseResponseStatus.ROOM_FULL;
import static com.mafia.global.common.model.dto.BaseResponseStatus.ROOM_NOT_FOUND;
import static com.mafia.global.common.model.dto.BaseResponseStatus.UNAUTHORIZED_ACCESS;
import static com.mafia.global.common.model.dto.BaseResponseStatus.UNAUTHORIZED_HOST_ACTION;

import com.mafia.domain.game.model.game.GameOption;
import com.mafia.domain.member.model.dto.response.MemberResponse;
import com.mafia.domain.member.service.MemberService;
import com.mafia.domain.room.model.entity.Room;
import com.mafia.domain.room.model.redis.Participant;
import com.mafia.domain.room.model.redis.RoomInfo;
import com.mafia.domain.room.repository.RoomRedisRepository;
import com.mafia.domain.room.repository.RoomRepository;
import com.mafia.global.common.exception.exception.BusinessException;
import com.mafia.global.common.service.RoomSubscription;
import java.util.HashMap;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


/**
 * 게임방 실시간 정보 관리 서비스 (Redis) - 방 참가자, 준비 상태 등 실시간으로 변경되는 정보를 관리
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class RoomRedisService {

    private final RoomRedisRepository redisRepository;
    private final RoomRepository roomRepository;
    private final MemberService memberService;
    private final RoomSubscription subscription;

    /**
     * Redis에서 방 정보 조회
     */
    public RoomInfo findById(long roomId) {
        return Optional.ofNullable(redisRepository.findById(roomId))
            .orElseThrow(() -> new BusinessException(ROOM_NOT_FOUND));
    }

    /**
     * 방 생성 및 초기 설정 - 방장을 첫 참가자로 등록하고 방 구독 처리
     */
    public void createRoomInfo(Long roomId, Long hostId, int requiredPlayer, String title,
        String password, GameOption gameOption) {
        log.info("방 생성 시작: roomId={}, hostId={}, 필요인원={}", roomId, hostId, requiredPlayer);

        RoomInfo roomInfo = new RoomInfo(roomId, hostId, title, password);
        roomInfo.setRequiredPlayers(requiredPlayer);
        roomInfo.setGameOption(gameOption);
        roomInfo.setPassword(password);
        roomInfo.setTitle(title);

        // 방장 정보 설정
        Participant host = new Participant();
        MemberResponse memberInfo = memberService.getMemberInfo(hostId);
        host.setMemberId(hostId);
        host.setNickName(memberInfo.getNickname());

        roomInfo.getParticipant().put(hostId, host);
        subscription.subscribe(roomId);
        redisRepository.save(roomId, roomInfo);

        redisRepository.saveMemberRoom(hostId, roomId);

        log.info("방 생성 완료 - 방 번호: {}, 방장: {}", roomId, memberInfo.getNickname());
    }

    /**
     * 방 입장 처리 - 중복 입장, 비밀번호, 정원 초과 등 체크 후 입장 처리
     */
    public void enterRoom(Long roomId, Long memberId, String password, String sessionId) {
        log.info("유저 방 입장 시도: roomId={}, memberId={}, sessionId={}", roomId, memberId, sessionId);

        // 이미 다른 방에 있는지 체크
        if (isMemberInRoom(memberId)) {
            throw new BusinessException(ALREADY_HAS_ROOM);
        }

        // RDB에서 방 존재 여부와 비밀번호 체크
        Room room = roomRepository.findById(roomId)
            .orElseThrow(() -> new BusinessException(ROOM_NOT_FOUND));
        if (room.getPassword() != null && !room.getPassword().equals(password)) {
            throw new BusinessException(INVALID_PASSWORD);
        }

        // Redis에서 방 정보 조회 및 인원 체크
        RoomInfo roomInfo = findById(roomId);
        if (roomInfo.getParticipant().size() >= roomInfo.getRequiredPlayers()) {
            throw new BusinessException(ROOM_FULL);
        }

        // 참가자 정보 생성 (회원 ID, 닉네임)
        Participant participant = new Participant();
        participant.setMemberId(memberId);
        MemberResponse memberInfo = memberService.getMemberInfo(memberId);  // 멤버 서비스 정보에서 닉네임을 가져옴.
        participant.setNickName(memberInfo.getNickname());
        participant.setSessionId(sessionId);

        // 참가자 추가 및 Redis 저장
        roomInfo.getParticipant().put(memberId, participant);
        redisRepository.save(roomId, roomInfo);

        // 방-멤버 매핑 저장
        redisRepository.saveMemberRoom(memberId, roomId);
        
        // 세션 정보 저장
        redisRepository.saveSession(sessionId, memberId);

        log.info("방 입장 완료 - 방 번호: {}, 닉네임: {}, 세션: {}",
            roomId, memberInfo.getNickname(), sessionId);
    }

    /**
     * 방 퇴장 처리 - 방장 퇴장시 방 삭제, 일반 유저는 참가자 목록에서 제거
     */
    public void leaveRoom(Long roomId, Long memberId, String sessionId) {
        log.info("유저 방 퇴장: roomId={}, memberId={}, sessionId={}", roomId, memberId, sessionId);
        RoomInfo roomInfo = findById(roomId);

        if (isHost(roomId, memberId)) {
            deleteById(roomId);
            return;
        }

        roomInfo.getParticipant().remove(memberId);
        redisRepository.save(roomId, roomInfo);

        // 방-멤버 매핑 삭제
        redisRepository.deleteMemberRoom(memberId);

        // 세션 정보도 삭제
        redisRepository.deleteSession(sessionId);
        log.info("방 퇴장 완료 - 방 번호: {}, 유저: {}, 남은 인원: {}",
            roomId, memberId, roomInfo.getParticipant().size());
    }

    /**
     * 강제 퇴장 처리 - 방장 권한 확인 후 강제 퇴장 진행
     */
    public void kickMember(Long roomId, Long hostId, String targetSessionId) {
        log.info("유저 강퇴 시도: roomId={}, hostId={}, targetId={}", roomId, hostId, targetSessionId);

        // 세션ID로 실제 멤버ID 조회
        Long targetId = redisRepository.findBySessionId(targetSessionId);
        if (targetId == null) {
            throw new BusinessException(UNAUTHORIZED_HOST_ACTION);
        }

        // 요청한 사람이 방장인지 확인
        if (!isHost(roomId, hostId)) {
            throw new BusinessException(UNAUTHORIZED_HOST_ACTION);
        }

        // 강퇴 대상이 방장인지 확인
        if (isHost(roomId, targetId)) {
            throw new BusinessException(CANNOT_KICK_HOST);
        }

        leaveRoom(roomId, targetId, targetSessionId);
    }

    /**
     * 게임 준비 상태 토글 - 방장 제외 참가자의 준비 상태 변경
     */
    public void toggleReady(Long roomId, Long memberId) {
        log.info("준비상태 토글: roomId={}, memberId={}", roomId, memberId);
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
        redisRepository.save(roomId, roomInfo);
        log.info("준비 상태 변경 - 방 번호: {}, 유저: {}, 준비상태: {}, 총 준비: {}",
            roomId, memberId, participant.isReady(), roomInfo.getReadyCnt());
    }

    /**
     * 게임 시작 - 방장 권한, 인원 수, 전체 준비 상태 확인 후 게임 시작
     */
    public void startGame(Long roomId, Long memberId) {
        // 호스트 체크
        if (!isHost(roomId, memberId)) {
            throw new BusinessException(UNAUTHORIZED_ACCESS);
        }

        RoomInfo roomInfo = findById(roomId);

        // 필요 인원 체크
        if (roomInfo.getParticipant().size() != roomInfo.getRequiredPlayers()) {
            throw new BusinessException(PLAYER_COUNT_INVALID);
        }

        // 모든 참가자 준비상태 체크 (방장 제외)
        if (roomInfo.getReadyCnt() != roomInfo.getParticipant().size() - 1) {
            throw new BusinessException(NOT_ALL_READY);
        }

        // 게임 상태 변경
        roomInfo.setActive(true);
        redisRepository.save(roomId, roomInfo);

        log.info("게임 시작 - 방 번호: {}, 참가자 수: {}", roomId, roomInfo.getParticipant().size());
    }

    // 유틸리티 메서드

    /**
     * 방 삭제 및 구독 해제
     */
    public void deleteById(Long roomId) {
        log.info("방 삭제 : roomId={}", roomId);
        subscription.unsubscribe(roomId);
        redisRepository.delete(roomId);
    }

    /**
     * 전체 방의 참가자 수 조회
     */
    public HashMap<Long, Integer> getRoomPlayerCounts() {
        return redisRepository.getRoomPlayerCounts();
    }

    /**
     * 방장 여부 확인
     */
    public boolean isHost(Long roomId, Long memberId) {
        RoomInfo roomInfo = findById(roomId);
        System.out.println("#### " + memberId + " #### " + roomInfo.getHostId());
        return roomInfo.getHostId().equals(memberId);
    }

    /**
     * 유저의 중복 참여 확인 room:member:1 -> "2"  (멤버1이 2번방에 있다) room:member:5 -> "2"  (멤버5도 2번방에 있다)
     * room:member:8 -> "3"  (멤버8은 3번방에 있다)
     */
    public boolean isMemberInRoom(Long memberId) {
        return redisRepository.findRoomByMemberId(memberId) != null;
    }
}
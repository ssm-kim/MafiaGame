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
import java.util.Map;
import java.util.Optional;
import java.util.Set;
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

        // 기본 방 정보 설정
        RoomInfo roomInfo = new RoomInfo(roomId, title, password, requiredPlayer, gameOption);

        // 방장 정보 설정 (방장은 항상 1번)
        MemberResponse memberInfo = memberService.getMemberInfo(hostId);
        Participant host = new Participant(hostId,memberInfo.getNickname());

        // 1번 (방장) 등록
        roomInfo.getParticipant().put(hostId, host);      // 참가자 맵:    1번 - 유저 정보
        roomInfo.getMemberMapping().put(1, hostId);  // 멤버 매핑 맵: 1번 - 방장 memberId

        subscription.subscribe(roomId);
        redisRepository.save(roomId, roomInfo);

        log.info("방 생성 완료 - 방 번호: {}, 방장: {}", roomId, memberInfo.getNickname());
    }

    /**
     * 방 입장 처리 - 중복 입장, 비밀번호, 정원 초과 등 체크 후 입장 처리
     */
    public void enterRoom(Long roomId, Long memberId, String password) {
        // RoomInfo에서 해당 참가자 번호의 memberId 조회
        RoomInfo roomInfo = findById(roomId);
        log.info("유저 방 입장 시도: roomId={}, memberId={}", roomId, memberId);

        // 이미 다른 방에 있는지 체크
        if (isMemberInRoom(memberId)) {
            throw new BusinessException(ALREADY_HAS_ROOM);
        }

        // RDB에서 방 존재 여부
        Room room = roomRepository.findById(roomId)
            .orElseThrow(() -> new BusinessException(ROOM_NOT_FOUND));

        // 비밀번호 체크
        if (room.getPassword() != null && !room.getPassword().equals(password)) {
            throw new BusinessException(INVALID_PASSWORD);
        }

        // 방 정보 조회 및 인원 체크
        if (roomInfo.getParticipant().size() >= roomInfo.getRequiredPlayers()) {
            throw new BusinessException(ROOM_FULL);
        }

        // 새로운 참가자 번호 할당 (가장 작은 빈 번호)
        int newParticipantNo = 2;  // 1번은 방장
        while (roomInfo.getMemberMapping().containsKey(newParticipantNo)) {
            newParticipantNo++;
        }
        //roomInfo.setInitParticipantNo(newParticipantNo);  // 1, 2, 3번에서 2번에 나가고 새로운 유저가 들어오면 2번 할당

        // 참가자 정보 생성 (회원 ID, 닉네임)
        MemberResponse memberInfo = memberService.getMemberInfo(memberId);  // 멤버 서비스에서 닉네임을 가져옴.
        Participant participant = new Participant(memberId, memberInfo.getNickname());  // 닉네임은 실제 구현에 맞게 수정 필요

        // 참가자 맵과 매핑 맵에 추가
        roomInfo.getParticipant().put(memberId, participant);
        roomInfo.getMemberMapping().put(newParticipantNo, memberId);  // memberMapping 추가

        redisRepository.save(roomId, roomInfo);
        log.info("방 입장 완료 - 방 번호: {}, 참가자 번호: {}, 닉네임: {}",
            roomId, newParticipantNo, memberInfo.getNickname());
    }

    /**
     * 방 퇴장 처리 - 방장 퇴장시 방 삭제, 일반 유저는 참가자 목록에서 제거
     */
    public void leaveRoom(Long roomId, Long memberId) {
        RoomInfo roomInfo = findById(roomId);
        int participantNo = roomInfo.getpartNoByMemberId(memberId);
        log.info("유저 방 퇴장: roomId={}, memberId={}, 참가자 번호={}",
            roomId, memberId, participantNo);

        // 방장(1번) 퇴장이면 바로 방 삭제
        if (isHost(roomId, memberId)) {
            deleteById(roomId);  // 방 삭제
            log.info("방장 퇴장으로 인한 방 삭제 완료 - 방 번호: {}", roomId);
            return;
        }

        // 일반 참가자 퇴장: 두 맵에서 모두 제거
        roomInfo.getParticipant().remove(memberId);
        roomInfo.getMemberMapping().remove(participantNo);
        redisRepository.save(roomId, roomInfo);

        log.info("방 퇴장 완료 - 방 번호: {}, 참가자 번호: {}, 남은 인원: {}",
            roomId, participantNo, roomInfo.getParticipant().size());
    }

    /**
     * 강제 퇴장 처리 - 방장 권한 확인 후 강제 퇴장 진행
     */
    public void kickMember(Long roomId, Long hostMemberId, Integer targetParticipantNo) {
        RoomInfo roomInfo = findById(roomId);
        log.info("강제 퇴장 시도: roomId={}, 방장 memberId={}, 대상 participantNo={}",
            roomId, hostMemberId, targetParticipantNo);

        // 방장 권한 확인
        if (!isHost(roomId, hostMemberId)) {
            throw new BusinessException(UNAUTHORIZED_HOST_ACTION);
        }

        // 강퇴 대상이 방장인지 확인
        if (targetParticipantNo == 1) {
            throw new BusinessException(CANNOT_KICK_HOST);
        }

        leaveRoom(roomId, roomInfo.getMemberMapping().get(targetParticipantNo));
    }

    /**
     * 게임 준비 상태 토글 - 방장 제외 참가자의 준비 상태 변경
     */
    public void toggleReady(Long roomId, Long memberId) {
        RoomInfo roomInfo = findById(roomId);
        int participantNo = roomInfo.getpartNoByMemberId(memberId);
        log.info("준비상태 토글: roomId={}, participantNo={}", roomId, participantNo);

        // 디버깅을 위한 로그 추가
        log.info("현재 참가자 목록: {}", roomInfo.getParticipant());
        log.info("현재 멤버 매핑: {}", roomInfo.getMemberMapping());

        // memberId로 방장 체크
        if (isHost(roomId, memberId)) {
            throw new BusinessException(HOST_CANNOT_READY);
        }

        // 참가자 정보 조회
        Participant participant = roomInfo.getParticipant().get(memberId);  // 키가 없으면
        if (participant == null) {
            throw new BusinessException(PLAYER_NOT_FOUND);
        }

        // 준비 상태 토글
        participant.setReady(!participant.isReady());

        // 전체 참가자 중 준비된 사람 수 계산
        int curReadyCnt = (int) roomInfo.getParticipant().entrySet().stream()
            .filter(entry -> entry.getValue().isReady())
            .count();

        roomInfo.setReadyCnt(curReadyCnt);
        redisRepository.save(roomId, roomInfo);
        log.info("준비 상태 변경 - 방 번호: {}, 참가자 번호: {}, 준비 상태: {}, 총 준비: {}",
            roomId, participantNo, participant.isReady(), roomInfo.getReadyCnt());
    }

    /**
     * 게임 시작 - 방장 권한, 인원 수, 전체 준비 상태 확인 후 게임 시작
     */
    public void startGame(Long roomId, Long memberId) {
        log.info("게임 시작 시도: roomId={}, memberId={}", roomId, memberId);

        RoomInfo roomInfo = findById(roomId);

        // 방장 권한 확인
        if (!isHost(roomId, memberId)) {
            throw new BusinessException(UNAUTHORIZED_ACCESS);
        }

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

        log.info("게임 시작 완료 - 방 번호: {}, 참가자 수: {}", roomId, roomInfo.getParticipant().size());
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
        Map<Integer, Long> memberMapping = roomInfo.getMemberMapping();
        Long hostId = memberMapping.get(1);  // 방장(1번)의 memberId
        return hostId.equals(memberId);
    }

    /**
     * 유저의 중복 참여 확인
     */
    public boolean isMemberInRoom(Long memberId) {
        Set<String> allRoomKeys = redisRepository.getAllRooms();

        for (String roomKey : allRoomKeys) {
            RoomInfo roomInfo = redisRepository.findById(Long.valueOf(roomKey.split(":")[2]));
            boolean duplication = roomInfo.getMemberMapping().containsValue(memberId);

            if (duplication) {
                return true;
            }  // 유저가 이미 방에 참여 중인 경우
        }
        return false;  // 유저가 어떤 방에도 참여하지 않은 경우
    }
}
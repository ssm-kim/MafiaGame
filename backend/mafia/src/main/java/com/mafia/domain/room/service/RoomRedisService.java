package com.mafia.domain.room.service;

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
    private RoomInfo roomInfo;

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
        roomInfo = new RoomInfo(roomId, title, password, requiredPlayer, gameOption);

        // 방장 정보 설정 (방장은 항상 1번)
        Participant host = new Participant();
        MemberResponse memberInfo = memberService.getMemberInfo(hostId);
        host.setNickName(memberInfo.getNickname());
        host.setReady(true);  // 방장은 항상 true

        // 1번 (방장) 등록
        roomInfo.getParticipant().put(1, host);     // 참가자 맵:    1번 - 유저 정보
        roomInfo.getMemberMapping().put(1, hostId);  // 멤버 매핑 맵: 1번 - 방장 memberId

        subscription.subscribe(roomId);
        redisRepository.save(roomId, roomInfo);

        log.info("방 생성 완료 - 방 번호: {}, 방장: {}", roomId, memberInfo.getNickname());
    }

    /**
     * 방 입장 처리 - 중복 입장, 비밀번호, 정원 초과 등 체크 후 입장 처리
     */
    // 테스트 용
    public void enterRoom(Long roomId, String password) {
        roomInfo = findById(roomId);

        log.info("유저 방 입장 시도: roomId={}", roomId);
        log.info("현재 방 상태 - 참가자: {}, 매핑: {}", roomInfo.getParticipant(),
            roomInfo.getMemberMapping());

        // RDB에서 방 존재 여부와 비밀번호 체크
        Room room = roomRepository.findById(roomId)
            .orElseThrow(() -> new BusinessException(ROOM_NOT_FOUND));
        if (room.getPassword() != null && !room.getPassword().equals(password)) {
            throw new BusinessException(INVALID_PASSWORD);
        }

        // Redis에서 방 정보 조회 및 인원 체크
        roomInfo = findById(roomId);
        if (roomInfo.getParticipant().size() >= roomInfo.getRequiredPlayers()) {
            throw new BusinessException(ROOM_FULL);
        }

        // 새로운 참가자 번호 할당 (가장 작은 빈 번호)
        int newParticipantNo = 2;  // 1번은 방장
        while (roomInfo.getParticipant().containsKey(newParticipantNo)) {
            newParticipantNo++;
        }

        // 참가자 정보 생성
        Participant participant = new Participant("테스트 유저");  // 닉네임은 실제 구현에 맞게 수정 필요
        roomInfo.setInitParticipantNo(newParticipantNo);

        // 참가자 맵과 매핑 맵에 추가
        roomInfo.getParticipant().put(newParticipantNo, participant);
        // memberMapping은 나중에 실제 memberId와 매핑할 때 추가

        redisRepository.save(roomId, roomInfo);
        log.info("방 입장 완료 - 방 번호: {}, 참가자 번호: {}", roomId, newParticipantNo);
    }

//    public void enterRoom(Long roomId, Integer participantNo, String password) {
//        // RoomInfo에서 해당 참가자 번호의 memberId 조회
//        roomInfo = findById(roomId);
//
//        Long memberId = roomInfo.getMemberMapping().get(participantNo);
//
//        log.info("유저 방 입장 시도: roomId={}, memberId={}", roomId, memberId);
//
//        // 이미 다른 방에 있는지 체크
//        if (isMemberInRoom(memberId)) {
//            throw new BusinessException(ALREADY_HAS_ROOM);
//        }
//
//        // RDB에서 방 존재 여부와 비밀번호 체크
//        Room room = roomRepository.findById(roomId)
//            .orElseThrow(() -> new BusinessException(ROOM_NOT_FOUND));
//        if (room.getPassword() != null && !room.getPassword().equals(password)) {
//            throw new BusinessException(INVALID_PASSWORD);
//        }
//
//        // 방 정보 조회 및 인원 체크
//        if (roomInfo.getParticipant().size() >= roomInfo.getRequiredPlayers()) {
//            throw new BusinessException(ROOM_FULL);
//        }
//
//        // 새로운 참가자 번호 할당 (가장 작은 빈 번호)
//        int newParticipantNo = 2;  // 1번은 방장
//        while (roomInfo.getParticipant().containsKey(newParticipantNo)) {
//            newParticipantNo++;
//        }
//
//        // 참가자 정보 생성 (회원 ID, 닉네임)
//        MemberResponse memberInfo = memberService.getMemberInfo(memberId);  // 멤버 서비스에서 닉네임을 가져옴.
//        Participant participant = new Participant(
//            memberInfo.getNickname());  // 닉네임은 실제 구현에 맞게 수정 필요
//        roomInfo.setInitParticipantNo(newParticipantNo);
//
//        // 참가자 맵과 매핑 맵에 추가
//        roomInfo.getParticipant().put(newParticipantNo, participant);
//
//        // 참가자 추가 및 Redis 저장
//        roomInfo.getParticipant().put(Math.toIntExact(memberId), participant);
//
//        redisRepository.save(roomId, roomInfo);
//        log.info("방 입장 완료 - 방 번호: {}, 참가자 번호: {}, 닉네임: {}",
//            roomId, newParticipantNo, memberInfo.getNickname());
//    }

    /**
     * 방 퇴장 처리 - 방장 퇴장시 방 삭제, 일반 유저는 참가자 목록에서 제거
     */
    public void leaveRoom(Long roomId, Integer participantNo) {
        roomInfo = findById(roomId);

        // 참가자 번호로 memberId 찾기
        Long memberId = roomInfo.getMemberMapping().get(participantNo);

        log.info("유저 방 퇴장: roomId={}, participantNo={}, memberId={}",
            roomId, participantNo, memberId);

        // 방장(1번) 퇴장이면 바로 방 삭제
        if (isHost(roomId, participantNo)) {
            deleteById(roomId);  // 방 삭제
            log.info("방장 퇴장으로 인한 방 삭제 완료 - 방 번호: {}", roomId);
            return;
        }

        // 일반 참가자 퇴장: 두 맵에서 모두 제거
        roomInfo.getParticipant().remove(participantNo);
        roomInfo.getMemberMapping().remove(participantNo);

        redisRepository.save(roomId, roomInfo);
        log.info("방 퇴장 완료 - 방 번호: {}, 참가자 번호: {}, 남은 인원: {}",
            roomId, participantNo, roomInfo.getParticipant().size());
    }

    /**
     * 강제 퇴장 처리 - 방장 권한 확인 후 강제 퇴장 진행
     */
    public void kickMember(Long roomId, Integer hostParticipantNo, Integer targetParticipantNo) {
        log.info("유저 강제 퇴장 시도: roomId={}, 방장 참가자 번호 ={}, 강제퇴장 대상 참가자 번호={}",
            roomId, hostParticipantNo, targetParticipantNo);

        // 요청한 사람이 방장인지 확인 (1번인지 체크)
        if (!isHost(roomId, hostParticipantNo)) {
            throw new BusinessException(UNAUTHORIZED_HOST_ACTION);
        }

        // 강퇴 대상이 방장인지 확인 (1번인지 체크)
        if (isHost(roomId, targetParticipantNo)) {
            throw new BusinessException(CANNOT_KICK_HOST);
        }
        leaveRoom(roomId, targetParticipantNo);
    }

    /**
     * 게임 준비 상태 토글 - 방장 제외 참가자의 준비 상태 변경
     */
    public void toggleReady(Long roomId, Integer participantNo) {
        log.info("준비상태 토글: roomId={}, participantNo={}", roomId, participantNo);

        // 현재 방 정보 조회
        roomInfo = findById(roomId);

        // 디버깅을 위한 로그 추가
        log.info("현재 참가자 목록: {}", roomInfo.getParticipant());
        log.info("현재 멤버 매핑: {}", roomInfo.getMemberMapping());

        // 호스트 준비 시도 차단
        if (isHost(roomId, participantNo)) {
            throw new BusinessException(HOST_CANNOT_READY);
        }

        // 참가자 정보 조회
        Participant participant = roomInfo.getParticipant()
            .get(participantNo);  // 키가 없으면
        System.out.println(participant + " ########");
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
    public void startGame(Long roomId, Integer participantNo) {
        log.info("게임 시작 시도: roomId={}, participantNo={}", roomId, participantNo);

        // 호스트 체크
        if (!isHost(roomId, participantNo)) {
            throw new BusinessException(UNAUTHORIZED_ACCESS);
        }

        roomInfo = findById(roomId);

        // 필요 인원 체크
        if (roomInfo.getParticipant().size() != roomInfo.getRequiredPlayers()) {
            throw new BusinessException(PLAYER_COUNT_INVALID);
        }

        // 모든 참가자 준비상태 체크 (방장 제외)
        if (roomInfo.getReadyCnt() != roomInfo.getParticipant().size()) {
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
    public boolean isHost(Long roomId, Integer participantNo) {
        findById(roomId);  // 방 존재 여부
        return participantNo == 1;  // 방장은 항상 1번
    }

    /**
     * 유저의 중복 참여 확인
     */
    public boolean isMemberInRoom(Long memberId) {
        Set<String> allRoomKeys = redisRepository.getAllRooms();

        for (String roomKey : allRoomKeys) {
            roomInfo = redisRepository.findById(Long.valueOf(roomKey.split(":")[2]));
            if (roomInfo != null && roomInfo.getParticipant().containsKey(memberId)) {
                return true;
            }  // 유저가 이미 방에 참여 중인 경우
        }
        return false;  // 유저가 어떤 방에도 참여하지 않은 경우
    }
}
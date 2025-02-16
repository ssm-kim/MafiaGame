package com.mafia.domain.room.service;

import static com.mafia.global.common.model.dto.BaseResponseStatus.GAME_ALREADY_STARTED;
import static com.mafia.global.common.model.dto.BaseResponseStatus.HOST_CANNOT_READY;
import static com.mafia.global.common.model.dto.BaseResponseStatus.INVALID_PASSWORD;
import static com.mafia.global.common.model.dto.BaseResponseStatus.NOT_ALL_READY;
import static com.mafia.global.common.model.dto.BaseResponseStatus.PLAYER_COUNT_INVALID;
import static com.mafia.global.common.model.dto.BaseResponseStatus.PLAYER_NOT_FOUND;
import static com.mafia.global.common.model.dto.BaseResponseStatus.ROOM_CREATE_FAIL;
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
import java.util.Objects;
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
    private final RoomRepository DbRoomRepository;
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
        try {
            MemberResponse memberInfo = memberService.getMemberInfo(hostId);
            Participant host = new Participant(hostId, memberInfo.getNickname());

            // 기본 방 정보 설정  ->  방 생성 시 1번은 항상 방장
            RoomInfo roomInfo = new RoomInfo(roomId, title, password, requiredPlayer, gameOption);
            roomInfo.getParticipant().put(hostId, host);  // 참가자 맵:    방장 memberId - 유저 정보
            roomInfo.getMemberMapping().put(1, hostId);   // 멤버 매핑 맵: 참가자 번호 - 방장 memberId

            subscription.subscribe(roomId);
            redisRepository.save(roomId, roomInfo);
        } catch (Exception e) {
            log.error("Redis 방 생성 실패: roomId={}, error={}", roomId, e.getMessage());
            throw new BusinessException(ROOM_CREATE_FAIL);
        }
    }

    /**
     * 방 입장 처리 - 중복 입장, 비밀번호, 정원 초과 등 체크 후 입장 처리
     */
    public void enterRoom(Long roomId, Long memberId, String password) {
        RoomInfo roomInfo = findById(roomId);
        log.debug("방 입장 시도 - roomId: {}, memberId: {}", roomId, memberId);

        validateGameNotStarted(roomInfo);  // 게임 진행 중 여부 확인

        if (isHost(roomId, memberId)) {
            log.debug("방장의 중복 입장 시도 무시 - roomId: {}, memberId: {}", roomId, memberId);
            return;
        }   // roomDbService.createRoom에서 이미 Redis에 방 생성됨

        if (isMemberInRoom(memberId)) {
            log.info("다른 방에 참여 중: roomId={}, memberId={}", roomId, memberId);
            return;
        }

        if (roomInfo.getPassword() != null && !roomInfo.getPassword().equals(password)) {
            throw new BusinessException(INVALID_PASSWORD);
        }

        if (roomInfo.getParticipant().size() >= roomInfo.getRequiredPlayers()) {
            throw new BusinessException(ROOM_FULL);
        }

        int newParticipantNo = 2;  // 1번은 방장
        while (roomInfo.getMemberMapping().containsKey(newParticipantNo)) {
            newParticipantNo++;
        }  // 새로운 참가자 번호 할당 (가장 작은 빈 번호)

        // 참가자 정보 생성 (회원 ID, 닉네임)
        MemberResponse memberInfo = memberService.getMemberInfo(memberId);
        Participant participant = new Participant(memberId, memberInfo.getNickname());

        // 참가자 맵과 멤버 매핑 맵에 추가
        roomInfo.getParticipant().put(memberId, participant);
        roomInfo.getMemberMapping().put(newParticipantNo, memberId);

        redisRepository.save(roomId, roomInfo);
        log.info("방 입장 완료 - roomId: {}, title: {}, participantNo: {}, memberId: {}, nickname: {}\n",
            roomId, roomInfo.getTitle(), newParticipantNo, memberId, participant.getNickName());
    }

    /**
     * 방 퇴장 처리 - 방장 퇴장시 방 삭제, 일반 유저는 참가자 목록에서 제거
     */
    public void leaveRoom(Long roomId, Long memberId) {
        RoomInfo roomInfo = findById(roomId);
        int participantNo = roomInfo.getpartNoByMemberId(memberId);
        log.info("방 퇴장 요청 - roomId: {}, memberId: {}", roomId, memberId);

        validateGameNotStarted(roomInfo);  // 게임 진행 중 여부 확인

        // 참가자 맵과 멤버 매핑 맵에서 제거
        roomInfo.getParticipant().remove(memberId);
        roomInfo.getMemberMapping().remove(participantNo);
        redisRepository.save(roomId, roomInfo);

        log.info("방 퇴장 완료 - roomId: {}, participantNo: {}\n", roomId, participantNo);
    }

    /**
     * 강제 퇴장 처리 - 방장 권한 확인 후 강제 퇴장 진행
     */
    public void kickMember(Long roomId, Long hostMemberId, Integer targetParticipantNo) {
        RoomInfo roomInfo = findById(roomId);
        log.info("강제 퇴장 시도: roomId={}, hostId={}, Target - participantNo={}\n",
            roomId, hostMemberId, targetParticipantNo);

        validateGameNotStarted(roomInfo);  // 게임 진행 중 여부 확인

        if (!isHost(roomId, hostMemberId)) {
            throw new BusinessException(UNAUTHORIZED_HOST_ACTION);
        }

        leaveRoom(roomId, roomInfo.getMemberMapping().get(targetParticipantNo));
    }

    /**
     * 게임 준비 상태 토글 - 방장 제외 참가자의 준비 상태 변경
     */
    public void toggleReady(Long roomId, Long memberId) {
        RoomInfo roomInfo = findById(roomId);
        int participantNo = roomInfo.getpartNoByMemberId(memberId);
        log.info("준비 상태 변경 - roomId: {}, memberId: {}, participantNo: {}", roomId, memberId,
            participantNo);

        validateGameNotStarted(roomInfo);  // 게임 진행 중 여부 확인

        if (isHost(roomId, memberId)) {
            throw new BusinessException(HOST_CANNOT_READY);
        }

        Participant participant = roomInfo.getParticipant().get(memberId);
        if (participant == null) {
            throw new BusinessException(PLAYER_NOT_FOUND);
        }

        participant.setReady(!participant.isReady());

        int curReadyCnt = (int) roomInfo.getParticipant().entrySet().stream()
            .filter(entry -> entry.getValue().isReady())
            .count();          // 전체 참가자 중 준비된 사람 수 계산

        roomInfo.setReadyCnt(curReadyCnt);
        redisRepository.save(roomId, roomInfo);

        log.info(
            "준비 상태 변경 완료 - roomId: {}, participantNo: {}, nickName: {}, ready: {}, curReady / allReady: {} / {}\n",
            roomId, participantNo, participant.getNickName(), !participant.isReady(),
            roomInfo.getReadyCnt(), roomInfo.getParticipant().size() - 1);
    }

    /**
     * 게임 시작 - 방장 권한, 인원 수, 전체 준비 상태 확인 후 게임 시작
     */
    public void startGame(Long roomId, Long memberId) {
        log.info("게임 시작 요청 - roomId: {}, hostId: {}", roomId, memberId);
        RoomInfo roomInfo = findById(roomId);

        if (!isHost(roomId, memberId)) {
            throw new BusinessException(UNAUTHORIZED_ACCESS);
        }

        if (roomInfo.getParticipant().size() != roomInfo.getRequiredPlayers()) {
            throw new BusinessException(PLAYER_COUNT_INVALID);
        }

        if (roomInfo.getReadyCnt() != roomInfo.getParticipant().size() - 1) {
            throw new BusinessException(NOT_ALL_READY);
        }

        roomInfo.setActive(true);  // 게임 상태 변경
        redisRepository.save(roomId, roomInfo);
        log.info("게임 시작 완료 - roomId: {}, gameActive: {}\n", roomId, roomInfo.isActive());
    }

    /**
     * 방 삭제 및 구독 해제
     */
    public void deleteById(Long roomId) {
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
        Room room = DbRoomRepository.findById(roomId)
            .orElseThrow(() -> new BusinessException(ROOM_NOT_FOUND));
        return Objects.equals(room.getHostId(), memberId);
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

    /**
     * 게임 진행 중 여부 확인
     *
     * @throws BusinessException 게임이 이미 시작된 경우
     */
    private void validateGameNotStarted(RoomInfo roomInfo) {
        if (roomInfo.isActive()) {
            throw new BusinessException(GAME_ALREADY_STARTED);
        }
    }
}
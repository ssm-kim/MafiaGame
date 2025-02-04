package com.mafia.domain.room.controller;

import static com.mafia.global.common.model.dto.BaseResponseStatus.NOT_ALL_READY;
import static com.mafia.global.common.model.dto.BaseResponseStatus.PLAYER_COUNT_INVALID;
import static com.mafia.global.common.model.dto.BaseResponseStatus.UNAUTHORIZED_ACCESS;

import com.mafia.domain.chat.model.dto.ChatRoom;
import com.mafia.domain.chat.model.enumerate.ChatRoomType;
import com.mafia.domain.chat.service.ChatService;
import com.mafia.domain.game.service.GameService;
import com.mafia.domain.room.model.RoomIdResponse;
import com.mafia.domain.room.model.RoomLeaveResponse;
import com.mafia.domain.room.model.RoomRequest;
import com.mafia.domain.room.model.RoomResponse;
import com.mafia.domain.room.model.redis.RoomInfo;
import com.mafia.domain.room.service.RoomDbService;
import com.mafia.domain.room.service.TestRoomRedisService;
import com.mafia.global.common.exception.exception.BusinessException;
import com.mafia.global.common.model.dto.BaseResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/room/test")
@RequiredArgsConstructor
public class TestRoomController {

    private final RoomDbService roomDbService;
    private final TestRoomRedisService TestRoomRedisService;
    private final GameService gameService;
    private final ChatService chatService;

    /*
       TODO: 방 관리 서비스
           1. 방은 하나의 게임 단위이며, 방장(호스트)에 의해 관리된다.
           2. 방 생성 시 설정한 인원수(4/6/8명..)에 맞춰야 게임을 시작할 수 있다.
           3. 한 유저는 동시에 하나의 방에만 참여할 수 있다.
           4. 호스트는 게임 시작 권한만 있으며, 준비 상태를 변경할 수 없다.
           5. 게임은 모든 참가자(호스트 제외)가 준비 완료했을 때만 시작할 수 있다.
           6. 방장이 퇴장하면 방이 삭제되며, 일반 참가자가 퇴장하면 방은 유지된다.
           7. 비밀번호가 설정된 방은 비밀번호 입력 후 입장이 가능하다.
   */

    // 로그인 인증 없이 테스트 코드
    @PostMapping
    public ResponseEntity<BaseResponse<RoomIdResponse>> createRoom(
        @RequestBody RoomRequest roomRequest,
        @RequestParam Long memberId
    ) {
        RoomIdResponse response = roomDbService.createRoom(roomRequest, memberId);
        return ResponseEntity.ok(new BaseResponse<>(response));
    }

    @DeleteMapping("/{roomId}")
    public ResponseEntity<BaseResponse<Void>> deleteRoom(
        @PathVariable Long roomId) {
        roomDbService.deleteRoom(roomId);
        return ResponseEntity.ok(new BaseResponse<>());
    }

    @GetMapping
    public ResponseEntity<BaseResponse<List<RoomResponse>>> getAllRooms() {
        List<RoomResponse> rooms = roomDbService.getAllRooms();
        return ResponseEntity.ok(new BaseResponse<>(rooms));
    }

    @PostMapping("/{roomId}/enter")
    public ResponseEntity<BaseResponse<Void>> enterRoom(
        @PathVariable Long roomId,
        @RequestParam Long memberId,
        @RequestBody(required = false) RoomRequest roomRequest) {

        String password = (roomRequest != null ? roomRequest.getRoomPassword() : null);
        TestRoomRedisService.enterRoom(roomId, memberId, password);

        return ResponseEntity.ok(new BaseResponse<>());
    }

    @PostMapping("/{roomId}/leave")
    public ResponseEntity<BaseResponse<RoomLeaveResponse>> leaveRoom(
        @PathVariable Long roomId,
        @RequestParam Long memberId) {

        // 먼저 호스트 여부 체크
        boolean isHost = TestRoomRedisService.isHost(roomId, memberId);

        // Redis에서 참가자 정보 삭제 (호스트 여부 체크 포함)
        TestRoomRedisService.leaveRoom(roomId, memberId);

        // 호스트라면 RDB에서도 삭제
        if (isHost) {
            roomDbService.deleteRoom(roomId);
        }

        // 호스트이면 true 반환, 일반유저이면 false 반환
        RoomLeaveResponse roomLeaveResponse = new RoomLeaveResponse(isHost);

        return ResponseEntity.ok(new BaseResponse<>(roomLeaveResponse));
    }

    // 방장 강제퇴장 기능
    @PostMapping("/{roomId}/kick")
    public ResponseEntity<BaseResponse<Void>> kickMember(
        @PathVariable Long roomId,
        @RequestParam Long hostId,
        @RequestParam Long targetId) {
        TestRoomRedisService.kickMember(roomId, hostId, targetId);
        return ResponseEntity.ok(new BaseResponse<>());
    }

    @PostMapping("/{roomId}/ready")
    public ResponseEntity<BaseResponse<Void>> toggleReady(
        @PathVariable Long roomId,
        @RequestParam Long memberId) {
        TestRoomRedisService.toggleReady(roomId, memberId);
        return ResponseEntity.ok(new BaseResponse<>());
    }

    // 해당 방 정보에 대한 모든 정보 key value
    @PostMapping("/{roomId}/start")
    public ResponseEntity<BaseResponse<RoomInfo>> startGame(
        @PathVariable Long roomId,
        @RequestParam Long memberId) {

        // 방장 체크
        if (!TestRoomRedisService.isHost(roomId, memberId)) {
            throw new BusinessException(UNAUTHORIZED_ACCESS);
        }

        RoomInfo roomInfo = TestRoomRedisService.findById(roomId);
        roomInfo.setRoomStatus(true);
        int currentPlayers = roomInfo.getParticipant().size();

        // 참가자 수 체크
        if (currentPlayers != roomInfo.getRequiredPlayers()) {
            throw new BusinessException(PLAYER_COUNT_INVALID);
        }

        // 모든 참가자 준비 상태 체크
        if (roomInfo.getReadyCnt() != currentPlayers - 1) { // 방장 제외라서 -1
            throw new BusinessException(NOT_ALL_READY);
        }

        // 채팅방 생성
        ChatRoom dayChat = chatService.createRoom(ChatRoomType.DAY_CHAT, roomId);
        ChatRoom mafiaChat = chatService.createRoom(ChatRoomType.MAFIA_CHAT, roomId);
        ChatRoom deadChat = chatService.createRoom(ChatRoomType.DEAD_CHAT, roomId);

        // 채팅방 ID 저장
        roomInfo.setDayChatId(dayChat.getChatRoomId());
        roomInfo.setMafiaChatId(mafiaChat.getChatRoomId());
        roomInfo.setDeadChatId(deadChat.getChatRoomId());

        // 게임 시작
        gameService.startGame(roomId);

        return ResponseEntity.ok(new BaseResponse<>(roomInfo));
    }

}
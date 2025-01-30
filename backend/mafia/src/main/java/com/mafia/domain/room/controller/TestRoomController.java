package com.mafia.domain.room.controller;

import static com.mafia.global.common.model.dto.BaseResponseStatus.NOT_ALL_READY;
import static com.mafia.global.common.model.dto.BaseResponseStatus.PLAYER_COUNT_INVALID;
import static com.mafia.global.common.model.dto.BaseResponseStatus.UNAUTHORIZED_ACCESS;

import com.mafia.domain.game.model.game.GameOption;
import com.mafia.domain.game.service.GameService;
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
    private final TestRoomRedisService roomRedisService;
    private final GameService gameService;

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
    public ResponseEntity<BaseResponse<Boolean>> createRoom(
        @RequestBody RoomRequest roomRequest,
        @RequestParam Long memberId
    ) {
        return ResponseEntity.ok(
            new BaseResponse<>(roomDbService.createRoom(roomRequest, memberId)));
    }

    @DeleteMapping("/{roomId}")
    public ResponseEntity<BaseResponse<Boolean>> deleteRoom(
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
    public ResponseEntity<BaseResponse<String>> enterRoom(
        @PathVariable Long roomId,
        @RequestParam Long memberId,
        @RequestBody(required = false) RoomRequest roomRequest) {

        String password = (roomRequest != null ? roomRequest.getRoomPassword() : null);

        roomRedisService.enterRoom(roomId, memberId, password);

        return ResponseEntity.ok(new BaseResponse<>("Entered room"));
    }

    @PostMapping("/{roomId}/leave")
    public ResponseEntity<BaseResponse<String>> leaveRoom(
        @PathVariable Long roomId,
        @RequestParam Long memberId) {

        // 먼저 호스트 여부 체크
        boolean isHost = roomRedisService.isHost(roomId, memberId);

        // Redis에서 참가자 정보 삭제 (호스트 여부 체크 포함)
        roomRedisService.leaveRoom(roomId, memberId);

        // 호스트라면 RDB에서도 삭제
        if (isHost) {
            roomDbService.deleteRoom(roomId);
            return ResponseEntity.ok(new BaseResponse<>("Room deleted"));
        }

        return ResponseEntity.ok(new BaseResponse<>("Left room"));
    }

    @PostMapping("/{roomId}/ready")
    public ResponseEntity<BaseResponse<String>> toggleReady(
        @PathVariable Long roomId,
        @RequestParam Long memberId) {
        roomRedisService.toggleReady(roomId, memberId);
        return ResponseEntity.ok(new BaseResponse<>("Ready toggled"));
    }

    @PostMapping("/{roomId}/start")
    public ResponseEntity<BaseResponse<Boolean>> startGame(
        @PathVariable Long roomId,
        @RequestParam Long memberId) {

        // 방장 체크
        if (!roomRedisService.isHost(roomId, memberId)) {
            throw new BusinessException(UNAUTHORIZED_ACCESS);
        }

        RoomInfo roomInfo = roomRedisService.findById(roomId);
        GameOption gameOption = roomInfo.getGameOption();
        int currentPlayers = roomInfo.getParticipant().size();

        System.out.println(currentPlayers + " #### " + gameOption.getRequiredPlayers());

        // 참가자 수 체크
        if (currentPlayers != gameOption.getRequiredPlayers()) {
            throw new BusinessException(PLAYER_COUNT_INVALID);
        }

        // 모든 참가자 준비 상태 체크
        if (roomInfo.getReadyCnt() != currentPlayers - 1) { // 방장 제외라서 -1
            throw new BusinessException(NOT_ALL_READY);
        }

        System.out.println(roomInfo.toString() + " ####%%%%%%");

        // 방 아이디만 넘겨주면 게임서비스에서 roominfo에서 participant 객체 조회하면 memberId, nickName 얻을 수 있음
        return ResponseEntity.ok(new BaseResponse<>(gameService.startGame(roomId)));
    }
}
package com.mafia.global.common.model.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum BaseResponseStatus {
    SUCCESS(true, HttpStatus.OK, 200, "요청에 성공하였습니다."),
    AUTHORIZATION_SUCCESS(true, HttpStatus.OK, 200, "토큰 발급에 성공하였습니다."),
    BAD_REQUEST(false, HttpStatus.BAD_REQUEST, 400, "입력값을 확인해주세요."),
    UNAUTHORIZED(false, HttpStatus.UNAUTHORIZED, 401, "인증이 필요합니다."),
    FORBIDDEN(false, HttpStatus.FORBIDDEN, 403, "권한이 없습니다."),
    NOT_FOUND(false, HttpStatus.NOT_FOUND, 404, "대상을 찾을 수 없습니다."),

    // Room Error Codes (1001~1100)
    // 방 생성/조회 관련 (1001 ~ 1009)
    ROOM_NOT_FOUND(false, HttpStatus.NOT_FOUND, 1001, "존재하지 않는 방입니다."),
    ROOM_TITLE_INVALID(false, HttpStatus.BAD_REQUEST, 1002, "방 제목은 비어있을 수 없습니다."),
    ROOM_TITLE_LIMIT(false, HttpStatus.BAD_REQUEST, 1003, "방 제목은 50자를 초과할 수 없습니다."),
    ROOM_INVALID_PLAYERS(false, HttpStatus.BAD_REQUEST, 1003, "6 ~ 8명만 설정가능합니다."),
    ROOM_CREATE_FAIL(false, HttpStatus.BAD_REQUEST, 1003, "방 생성 실패 (RDB, Redis 확인 필요)"),

    // 방 입장/퇴장 관련 (1010 ~ 1019)
    ALREADY_HAS_ROOM(false, HttpStatus.BAD_REQUEST, 1010, "이미 다른 방에 참여 중입니다."),
    ROOM_FULL(false, HttpStatus.BAD_REQUEST, 1011, "더 이상 입장할 수 없습니다."),
    UNAUTHORIZED_HOST_ACTION(false, HttpStatus.FORBIDDEN, 1012, "방장만 강퇴할 수 있습니다."),
    CANNOT_KICK_HOST(false, HttpStatus.BAD_REQUEST, 1013, "방장은 강퇴할 수 없습니다."),
    LENGTH_PASSWORD(false, HttpStatus.BAD_REQUEST, 1014, "비밀번호는 4이상 16이하로만 설정할 수 있습니다."),
    INVALID_PASSWORD(false, HttpStatus.BAD_REQUEST, 1015, "유효하지 않은 비밀번호입니다."),

    // 게임 시작 관련 (1020 ~ 1029)
    UNAUTHORIZED_ACCESS(false, HttpStatus.FORBIDDEN, 1020, "권한이 없습니다."),
    PLAYER_COUNT_INVALID(false, HttpStatus.BAD_REQUEST, 1021, "필요 인원과 현재 인원이 일치하지 않습니다."),
    NOT_ALL_READY(false, HttpStatus.BAD_REQUEST, 1022, "모든 참가자가 준비를 완료하지 않았습니다."),
    HOST_CANNOT_READY(false, HttpStatus.BAD_REQUEST, 1023, "방장은 준비 상태를 변경할 수 없습니다."),
    GAME_ALREADY_STARTED(false, HttpStatus.BAD_REQUEST, 1024, "현재 방은 게임 진행 중입니다."),

    // Member Error Codes (2000~)
    MEMBER_NOT_FOUND(false, HttpStatus.NOT_FOUND, 2001, "존재하지 않는 회원입니다."),
    NOT_GUEST_ACCOUNT(false, HttpStatus.FORBIDDEN, 2002, "게스트 계정만 삭제할 수 있습니다."),
    INVALID_JSON_FORMAT(false, HttpStatus.BAD_REQUEST, 3001, "잘못된 JSON 형식입니다."),

    // Game Error Codes (4001~4100)

    // Game Start Error Codes (4001~4009)
    GAME_ALREADY_START(false, HttpStatus.BAD_REQUEST, 4001, "해당 게임 코드가 이미 존재합니다."),
    PLAYER_NOT_FOUND(false, HttpStatus.NOT_FOUND, 4002, "플레이어를 찾을 수 없습니다."),
    OPTION_NOT_FOUND(false, HttpStatus.NOT_FOUND, 4003, "옵션을 찾을 수 없습니다."),
    GAME_START_FAIL(false, HttpStatus.BAD_REQUEST, 4004, "게임 시작에 실패했습니다."),
    PLAYER_NOT_ENOUGH(false, HttpStatus.BAD_REQUEST, 4005, "게임 참가자가 충분하지 않습니다."),
    // Game Error Codes (4010)
    GAME_NOT_FOUND(false, HttpStatus.NOT_FOUND, 4010, "해당 방의 게임을 찾을 수 없습니다."),
    GAME_TIME_OVER(false, HttpStatus.BAD_REQUEST, 4011, "남은 시간이 얼마 없어 스킵이 불가능합니다."),
    // Game Delete Error Codes (4020)
    GAME_DELETE_FAIL(false, HttpStatus.BAD_REQUEST, 4020, "게임 삭제에 실패했습니다."),
    //Game Vote Error Codes (4030~4039)
    DEAD_CANNOT_VOTE(false, HttpStatus.BAD_REQUEST, 4030, "사망한 플레이어는 투표할 수 없습니다."),
    TARGET_IS_DEAD(false, HttpStatus.BAD_REQUEST, 4031, "타켓은 이미 싸늘한 주검입니다..."),
    MUTANT_CANNOT_VOTE(false, HttpStatus.BAD_REQUEST, 4032, "중립은 투표할 수 없습니다."),
    POLICE_CANNOT_VOTE(false, HttpStatus.BAD_REQUEST, 4033, "경찰은 좀비를 알아내어 이제 투표할 수 없습니다."),
    // Kill Error Codes (4040~4049)
    PLAYER_CANNOT_HEAL(false, HttpStatus.BAD_REQUEST, 4040, "죽은 플레이어는 살릴 수 없습니다."),
    MEDICAL_COUNT_ZERO(false, HttpStatus.BAD_REQUEST, 4041, "모든 의사 능력 사용 횟수를 소진했습니다."),
    CANNOT_KILL_ROLE(false, HttpStatus.BAD_REQUEST, 4042, "사용자를 죽일 수 없는 직업입니다."),
    // Job Error Codes (4050~4059)
    NOT_POLICE_FIND_ROLE(false, HttpStatus.BAD_REQUEST, 4050, "경찰이 아니면 조사를 할 수 없습니다."),
    NOT_DOCTOR_HEAL(false, HttpStatus.BAD_REQUEST, 4051, "의사가 아니면 치료를 할 수 없습니다."),
    // Phase Error Codes (4060~4069)
    PHASE_NOT_FOUND(false, HttpStatus.NOT_FOUND, 4060, "페이즈를 찾을 수 없습니다."),
    UNKNOWN_PHASE(false, HttpStatus.BAD_REQUEST, 4061, "알 수 없는 페이즈입니다."),
    INVALID_PHASE(false, HttpStatus.BAD_REQUEST, 4062, "유효하지 않은 페이즈입니다."),

    // Chat Error Codes (5000~)
    NOT_FOUND_CHAT(false, HttpStatus.NOT_FOUND, 5001, "채팅방을 찾을 수 없습니다."),
    NOT_PERMISSION_CHAT(false, HttpStatus.NOT_FOUND, 5002, "해당 채팅방에 접근이 불가합니다."),
    NOT_FOUND_SESSION(false, HttpStatus.NOT_FOUND, 5003, "해당 OpenVidu 세션이 존재하지 않습니다."),

    // JWT Error Codes (6000~)
    REFRESH_TOKEN_NOT_FOUND(false, HttpStatus.BAD_REQUEST, 6001, "리프레시 토큰을 찾을 수 없습니다."),
    REFRESH_TOKEN_EXPIRED(false, HttpStatus.BAD_REQUEST, 6002, "만료된 리프레시 토큰입니다."),
    INVALID_REFRESH_TOKEN(false, HttpStatus.BAD_REQUEST, 6003, "유효하지 않은 리프레시 토큰입니다.");

    private final boolean isSuccess;
    @JsonIgnore
    private final HttpStatus httpStatus;
    private final int code;
    private final String message;

    BaseResponseStatus(boolean isSuccess, HttpStatus httpStatus, int code, String message) {
        this.isSuccess = isSuccess;
        this.httpStatus = httpStatus;
        this.code = code;
        this.message = message;
    }
}
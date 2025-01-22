package com.mafia.global.common.model.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum BaseResponseStatus {
    SUCCESS(true, HttpStatus.OK, 200, "요청에 성공하였습니다."),
    BAD_REQUEST(false, HttpStatus.BAD_REQUEST, 400, "입력값을 확인해주세요."),
    UNAUTHORIZED(false, HttpStatus.UNAUTHORIZED, 401, "인증이 필요합니다."),
    FORBIDDEN(false, HttpStatus.FORBIDDEN, 403, "권한이 없습니다."),
    NOT_FOUND(false, HttpStatus.NOT_FOUND, 404, "대상을 찾을 수 없습니다."),

    // Room Error Codes (1001~1100)
    ROOM_NOT_FOUND(false, HttpStatus.NOT_FOUND, 1001, "해당 방을 찾을 수 없습니다."),
    ROOM_INVALID_PLAYER_COUNT(false, HttpStatus.BAD_REQUEST, 1002, "유효하지 않은 플레이어 수입니다."),
    ROOM_TITLE_DUPLICATE(false, HttpStatus.BAD_REQUEST, 1003, "이미 존재하는 방 제목입니다.");

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
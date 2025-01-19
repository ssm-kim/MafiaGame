package com.mafia.global.common.exception.exception;

import com.mafia.global.common.model.dto.BaseResponseStatus;
import lombok.Getter;

@Getter
public class BusinessException extends RuntimeException {
    private final BaseResponseStatus baseResponseStatus;

    public BusinessException(BaseResponseStatus baseResponseStatus) {
        super(baseResponseStatus.getMessage());
        this.baseResponseStatus = baseResponseStatus;
    }
}

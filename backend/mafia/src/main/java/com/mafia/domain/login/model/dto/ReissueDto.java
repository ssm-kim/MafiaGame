package com.mafia.domain.login.model.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ReissueDto {
    private String newAccessToken;
    private String newRefreshToken;
    private String providerId;
}
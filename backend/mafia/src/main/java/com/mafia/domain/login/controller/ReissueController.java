package com.mafia.domain.login.controller;

import com.mafia.domain.login.model.dto.ReissueDto;
import com.mafia.domain.login.service.JWTService;
import com.mafia.domain.login.utils.CookieUtil;
import com.mafia.global.common.model.dto.BaseResponse;
import com.mafia.global.common.model.dto.BaseResponseStatus;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class ReissueController {

    private final JWTService jwtService;
    private final CookieUtil cookieUtil;

    @PostMapping("/reissue")
    public ResponseEntity<BaseResponse<Void>> reissue(
        @CookieValue(value = "REFRESH", required = false) String refresh,
        HttpServletResponse response) {

        ReissueDto reissueDto = jwtService.reissueTokens(refresh);

        response.addCookie(cookieUtil.createCookie("ACCESS", reissueDto.getNewAccessToken()));
        response.addCookie(cookieUtil.createCookie("REFRESH", reissueDto.getNewRefreshToken()));
        return ResponseEntity.ok(new BaseResponse<>(BaseResponseStatus.AUTHORIZATION_SUCCESS));
    }
}

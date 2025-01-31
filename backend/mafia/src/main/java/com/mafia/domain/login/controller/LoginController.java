package com.mafia.domain.login.controller;


import com.mafia.domain.login.model.dto.CustomOAuth2User;
import com.mafia.domain.login.utils.CookieUtil;
import com.mafia.domain.member.model.dto.response.MemberResponse;
import com.mafia.domain.member.service.MemberService;
import com.mafia.global.common.model.dto.BaseResponse;
import com.mafia.global.common.service.RedisService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import static com.mafia.global.common.model.dto.BaseResponseStatus.AUTHORIZATION_SUCCESS;

@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class LoginController {

    private final RedisService redisService;
    private final MemberService memberService;
    private final CookieUtil cookieUtil;

    @GetMapping("/login/success")
    public ResponseEntity<BaseResponse<MemberResponse>> loginSuccess(@AuthenticationPrincipal CustomOAuth2User detail) {
        MemberResponse memberResponse = memberService.getMemberInfo(detail.getMemberId());

        return ResponseEntity.ok(new BaseResponse<>(memberResponse));
    }

    @PostMapping("/logout")
    public ResponseEntity<BaseResponse<Void>> logout(@AuthenticationPrincipal CustomOAuth2User detail,
    HttpServletResponse response) {
        // Redis에서 Refresh 토큰 제거
        String providerId = detail.getProviderId();
        redisService.delete(providerId);

        // 쿠키 제거
        Cookie accessCookie = cookieUtil.createCookie("ACCESS", null);
        Cookie refreshCookie = cookieUtil.createCookie("REFRESH", null);
        accessCookie.setMaxAge(0);  // 즉시 만료
        refreshCookie.setMaxAge(0); // 즉시 만료

        response.addCookie(accessCookie);
        response.addCookie(refreshCookie);

        return ResponseEntity.ok(new BaseResponse<>());
    }
}

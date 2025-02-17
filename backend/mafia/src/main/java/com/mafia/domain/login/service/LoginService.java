package com.mafia.domain.login.service;

import com.mafia.domain.login.model.dto.AuthenticatedUser;
import com.mafia.domain.member.model.dto.response.MemberResponse;
import com.mafia.domain.member.service.MemberService;
import com.mafia.global.common.service.RedisService;
import com.mafia.global.common.utils.CookieUtil;
import com.mafia.global.common.utils.JWTUtil;
import jakarta.servlet.http.HttpServletResponse;
import java.util.concurrent.TimeUnit;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class LoginService {

    private final CustomOAuth2UserService customOAuth2UserService;
    private final RedisService redisService;
    private final JWTUtil jwtUtil;
    private final CookieUtil cookieUtil;
    private final MemberService memberService;

    public MemberResponse guestLogin(HttpServletResponse response) {
        // 게스트 사용자 생성 및 인증
        AuthenticatedUser authenticatedUser = customOAuth2UserService.createGuestUser();

        // 토큰 생성 및 쿠키 설정
        setTokens(authenticatedUser, response);

        // 회원 정보 조회
        return memberService.getMemberInfo(authenticatedUser.getMemberId());
    }

    private void setTokens(AuthenticatedUser user, HttpServletResponse response) {
        String access = jwtUtil.createAccessToken(user.getProviderId(), user.getMemberId());
        String refresh = jwtUtil.createRefreshToken(user.getProviderId(), user.getMemberId());

        // Refresh 토큰 저장 게스트일 경우 6시간 후 만료
        redisService.saveWithExpiry(user.getProviderId(), refresh, 6, TimeUnit.HOURS);

        // 쿠키 설정
        response.addCookie(cookieUtil.createCookie("ACCESS", access));
        response.addCookie(cookieUtil.createCookie("REFRESH", refresh));
    }
}
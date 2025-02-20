package com.mafia.domain.login.service;

import com.mafia.domain.login.model.dto.AuthenticatedUser;
import com.mafia.domain.member.service.MemberService;
import com.mafia.global.common.service.RedisService;
import com.mafia.global.common.utils.CookieUtil;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class LogoutService {

    private final RedisService redisService;
    private final MemberService memberService;
    private final CookieUtil cookieUtil;

    @Transactional
    public void logout(AuthenticatedUser user, HttpServletResponse response) {
        String providerId = user.getProviderId();

        // Redis에서 Refresh 토큰 제거
        redisService.delete(providerId);

        // 게스트 사용자인 경우 DB에서도 제거
        if (providerId.startsWith("guest")) {
            memberService.deleteMember(user.getMemberId());
        }

        // 쿠키 제거
        removeCookies(response);
    }

    private void removeCookies(HttpServletResponse response) {
        Cookie accessCookie = cookieUtil.createCookie("ACCESS", null);
        Cookie refreshCookie = cookieUtil.createCookie("REFRESH", null);

        accessCookie.setMaxAge(0);
        refreshCookie.setMaxAge(0);

        response.addCookie(accessCookie);
        response.addCookie(refreshCookie);
    }
}
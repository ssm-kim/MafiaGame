package com.mafia.domain.login.filter;

import com.mafia.domain.login.model.dto.AuthenticatedUser;
import com.mafia.domain.member.model.dto.MemberDTO;
import com.mafia.domain.member.repository.MemberRepository;
import com.mafia.global.common.service.RedisService;
import com.mafia.global.common.utils.JWTUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.concurrent.TimeUnit;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Slf4j
@RequiredArgsConstructor
@Component
public class JWTFilter extends OncePerRequestFilter {

    private final JWTUtil jwtUtil;
    private final MemberRepository memberRepository;
    private final RedisService redisService;

    private static final String ACTIVITY_KEY_PREFIX = "guest_activity:";
    private static final int UPDATE_INTERVAL = 1800; // 30분 (초 단위)

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
        FilterChain filterChain)
        throws ServletException, IOException {

        // 쿠키에서 토큰 추출
        String authorization = extractTokenFromCookies(request.getCookies());

        // 토큰이 없거나 만료된 경우 다음 필터로 진행
        if (authorization == null || jwtUtil.isExpired(authorization)) {
            filterChain.doFilter(request, response);
            return;
        }

        // JWT 토큰에서 사용자 정보 추출
        String providerId = jwtUtil.getProviderId(authorization);
        Long memberId = jwtUtil.getMemberId(authorization);

        // 게스트 사용자인 경우에만 활동 시간 업데이트 처리
        if (providerId.startsWith("guest_")) {
            String activityKey = ACTIVITY_KEY_PREFIX + providerId;
            String lastUpdate = redisService.get(activityKey, String.class).orElse(null);

            if (lastUpdate == null) {
                memberRepository.findById(memberId).ifPresent(member -> {
                    member.updateLastActivityTime();
                    memberRepository.save(member);
                });
                redisService.saveWithExpiry(activityKey,
                    String.valueOf(System.currentTimeMillis()),
                    UPDATE_INTERVAL,
                    TimeUnit.SECONDS);
            }
        }

        // 사용자 정보로 MemberDTO 생성
        MemberDTO memberDTO = MemberDTO.builder()
            .providerId(providerId)
            .memberId(memberId)
            .build();

        // Spring Security 인증 객체 생성 및 설정
        AuthenticatedUser authenticatedUser = new AuthenticatedUser(memberDTO);
        Authentication authToken = new UsernamePasswordAuthenticationToken(
            authenticatedUser,
            null,
            authenticatedUser.getAuthorities()
        );

        SecurityContextHolder.getContext().setAuthentication(authToken);
        filterChain.doFilter(request, response);
    }

    /**
     * 쿠키 배열에서 ACCESS 토큰을 추출
     *
     * @param cookies 쿠키 배열
     * @return ACCESS 토큰 값 또는 null
     */
    private String extractTokenFromCookies(Cookie[] cookies) {
        if (cookies == null) {
            return null;
        }

        for (Cookie cookie : cookies) {
            if (cookie.getName().equals("ACCESS")) {
                return cookie.getValue();
            }
        }
        return null;
    }
}
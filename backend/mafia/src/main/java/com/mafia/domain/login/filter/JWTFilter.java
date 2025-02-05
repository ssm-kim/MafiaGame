package com.mafia.domain.login.filter;

import com.mafia.domain.login.model.dto.CustomOAuth2User;
import com.mafia.domain.login.utils.JWTUtil;
import com.mafia.domain.member.model.dto.MemberDTO;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Slf4j
@RequiredArgsConstructor
@Component
public class JWTFilter extends OncePerRequestFilter {

    private final JWTUtil jwtUtil;

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

        // 사용자 정보로 MemberDTO 생성
        MemberDTO memberDTO = MemberDTO.builder()
            .providerId(providerId)
            .memberId(memberId)
            .build();

        // Spring Security 인증 객체 생성 및 설정
        CustomOAuth2User customOAuth2User = new CustomOAuth2User(memberDTO);
        Authentication authToken = new UsernamePasswordAuthenticationToken(
            customOAuth2User,
            null,
            customOAuth2User.getAuthorities()
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
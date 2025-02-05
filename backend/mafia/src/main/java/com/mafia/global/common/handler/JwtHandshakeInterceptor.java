package com.mafia.global.common.handler;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

public class JwtHandshakeInterceptor implements HandshakeInterceptor {

    @Override
    public boolean beforeHandshake(ServerHttpRequest request,
        ServerHttpResponse response,
        WebSocketHandler wsHandler,
        Map<String, Object> attributes) throws Exception {
        if (request instanceof ServletServerHttpRequest) {
            HttpServletRequest servletRequest = ((ServletServerHttpRequest) request).getServletRequest();
            Cookie[] cookies = servletRequest.getCookies();
            if (cookies != null) {
                for (Cookie cookie : cookies) {
                    if ("ACCESS".equals(cookie.getName())) {  // 쿠키 이름이 "ACCESS"인 경우
                        String token = cookie.getValue();
                        System.out.println("Before HandShake find token: " + token);
                        // 여기서 토큰 검증 로직을 추가하거나, 이후에 사용하기 위해 세션 속성에 저장합니다.
                        attributes.put("ACCESS_TOKEN", token);
                        break;
                    }
                }
            }
        }
        return true;  // 핸드셰이크 계속 진행
    }

    @Override
    public void afterHandshake(ServerHttpRequest request,
        ServerHttpResponse response,
        WebSocketHandler wsHandler,
        Exception exception) {
        // 별도 처리 없음
    }
}

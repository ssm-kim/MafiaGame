package com.mafia.global.common.handler;


import com.mafia.domain.login.utils.JWTUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class StompHandler implements ChannelInterceptor{
    private final JWTUtil jwt;
    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor =
            MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        // memberId, providerId 추출 가능(중요)
        //CustomOAuth2User principal = (CustomOAuth2User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            // HandshakeInterceptor에서 저장한 토큰을 세션 속성에서 가져옴
            String token = (String) accessor.getSessionAttributes().get("ACCESS_TOKEN");
            System.out.println("InboundChannel token: " + token);

            // 토큰이 없으면 연결 거부 등의 처리를 할 수 있음
            if (token == null) {
                throw new IllegalArgumentException("No JWT token found in WebSocket session attributes");
            }
            jwt.validateToken(token);
            accessor.setUser(new UsernamePasswordAuthenticationToken(null, null));
        }

        return message;
    }
}

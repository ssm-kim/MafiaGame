package com.mafia.global.common.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/mafia-chat-ws") // 클라이언트가 연결할 WebSocket 엔드포인트
            .setAllowedOriginPatterns("*");
        // .withSockJS(); // SockJS 지원

        registry.addEndpoint("/mafia-game-ws")  // 게임 위치 전용 엔드포인트
            .setAllowedOriginPatterns("*");
        // .withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic"); // 🔥 클라이언트가 구독할 경로
        registry.setApplicationDestinationPrefixes("/app"); // 🔥 클라이언트가 메시지를 보낼 경로
    }


}

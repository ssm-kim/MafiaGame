package com.mafia.global.common.config;

import com.mafia.domain.chat.handler.CustomChatWebSocketHandler;
import com.mafia.domain.chat.service.ChatService;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import org.springframework.context.annotation.Bean;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.support.HttpSessionHandshakeInterceptor;
import lombok.RequiredArgsConstructor;

@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketConfigurer {

    private final ChatService chatService;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(webSocketHandler(), "/mafia")
            .addInterceptors(new HttpSessionHandshakeInterceptor())
            .setAllowedOriginPatterns("*");
    }

    @Bean
    public WebSocketHandler webSocketHandler() {
        return new CustomChatWebSocketHandler(chatService);
    }
}
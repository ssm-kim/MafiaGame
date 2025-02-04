package com.mafia.domain.chat.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class ChatSubscriber implements MessageListener {

    private final SimpMessagingTemplate messagingTemplate;

    public ChatSubscriber(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @Override
    public void onMessage(Message message, byte[] pattern) {
        String msg = new String(message.getBody());
        String channel = new String(pattern);

        // 🔥 Redis Pub/Sub에서 받은 메시지를 WebSocket으로 전송
        switch (channel) {
            case "day-chat":
                messagingTemplate.convertAndSend("/topic/day-chat", msg);
                log.info("Sent to WebSocket: /topic/day-chat -> {}", msg);
                break;
            case "night-chat":
                messagingTemplate.convertAndSend("/topic/night-chat", msg);
                log.info("Sent to WebSocket: /topic/night-chat -> {}", msg);
                break;
            case "dead-chat":
                messagingTemplate.convertAndSend("/topic/dead-chat", msg);
                log.info("Sent to WebSocket: /topic/dead-chat -> {}", msg);
                break;
        }
    }
}


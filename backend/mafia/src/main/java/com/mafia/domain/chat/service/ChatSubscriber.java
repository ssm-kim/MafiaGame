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

        log.info("📩 Redis Message Received: channel={}, message={}", channel, msg);

        // WebSocket을 통해 클라이언트에게 메시지 전달
        messagingTemplate.convertAndSend("/topic/" + channel, msg);
    }
}

